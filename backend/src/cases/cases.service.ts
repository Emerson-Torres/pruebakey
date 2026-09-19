import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CaseType, CaseStatus, Direction, MessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IntentService } from '../intent/intent.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { Intencion } from '../intent/intent.enum';
import {
  MessagingProvider,
  MESSAGING_PROVIDER,
} from '../messaging/messaging.interface';
// Datos que llegan del webhook por cada mensaje entrante.
export interface MensajeEntrante {
  telefono: string; // el "From" de Twilio
  texto: string; // el "Body"
  messageSid: string; // el "MessageSid", id unico de Twilio
}

@Injectable()
export class CasesService {
  // Fila de espera por telefono para evitar casos duplicados por
  // concurrencia (5.2). La clave es el telefono; el valor es la ultima
  // promesa encolada para ese telefono. Cada telefono tiene su propia
  // fila, asi numeros distintos no se bloquean entre si.
  private readonly locks = new Map<string, Promise<unknown>>();

  // Nest inyecta estos tres servicios automaticamente gracias a los
  // imports/exports que configuramos en los modulos.
    constructor(
    private readonly prisma: PrismaService,
    private readonly intent: IntentService,
    private readonly knowledge: KnowledgeService,
    // Inyeccion por token: como MessagingProvider es una interfaz (no existe
    // en runtime), usamos @Inject con el token para que Nest sepa que dar.
    @Inject(MESSAGING_PROVIDER)
    private readonly messaging: MessagingProvider,
  ) {}

  // Procesa un mensaje entrante de punta a punta: detecta intencion,
  // busca o crea el caso, guarda el mensaje entrante, responde desde la
  // base de conocimiento y guarda el mensaje saliente.
  async procesarMensaje(entrante: MensajeEntrante) {
    // 0. IDEMPOTENCIA (5.1): si este messageSid ya fue procesado antes
    //    (Twilio reintenta y reenvia el mismo mensaje), no hacemos nada.
    //    Twilio puede entregar el mismo MessageSid dos o tres veces; esto
    //    evita duplicar mensajes, casos y respuestas.
    const yaProcesado = await this.prisma.message.findUnique({
      where: { messageSid: entrante.messageSid },
    });
    if (yaProcesado) {
      return { duplicado: true };
    }

    // 1. Detectar la intencion del texto.
    const intencion = this.intent.detectar(entrante.texto);

    // 2. Derivar el tipo de caso a partir de la intencion.
    const tipo: CaseType =
      intencion === Intencion.RECLAMO ? CaseType.RECLAMO : CaseType.CONSULTA;

    // 3. Buscar o crear el caso, protegido por el lock por telefono (5.2).
    //    Si dos mensajes del mismo numero llegan casi al mismo tiempo,
    //    conLock los pone en fila: el segundo espera a que el primero
    //    termine de crear el caso, y asi lo reutiliza en vez de duplicarlo.
    const caso = await this.conLock(entrante.telefono, () =>
      this.buscarOCrearCaso(entrante.telefono, tipo, intencion),
    );
    // 4. Guardar el mensaje ENTRANTE, ligado al caso.
    await this.prisma.message.create({
      data: {
        caseId: caso.id,
        messageSid: entrante.messageSid,
        direccion: Direction.INBOUND,
        texto: entrante.texto,
        intencion,
      },
    });

    // 5. Obtener la respuesta de la base de conocimiento.
    const respuesta = this.knowledge.obtenerRespuesta(intencion);

       // 6. Guardar el mensaje SALIENTE como PENDING (todavia no enviado).
    //    El entrante ya quedo a salvo (paso 4), asi que aunque el envio
    //    falle despues, no perdemos nada (5.3).
    const saliente = await this.prisma.message.create({
      data: {
        caseId: caso.id,
        direccion: Direction.OUTBOUND,
        texto: respuesta,
        estado: MessageStatus.PENDING,
      },
    });

    // 7. Intentar enviar la respuesta al usuario a traves del proveedor.
    //    Si sale bien, marcamos SENT; si falla, marcamos FAILED (el
    //    mensaje NO se pierde, queda registrado como fallido).
    try {
      await this.messaging.enviar(caso.telefono, respuesta);
      await this.prisma.message.update({
        where: { id: saliente.id },
        data: { estado: MessageStatus.SENT },
      });
    } catch {
      await this.prisma.message.update({
        where: { id: saliente.id },
        data: { estado: MessageStatus.FAILED },
      });
    }

    // 8. Devolver lo necesario para responder al usuario.
    return { caso, respuesta };
  }
  // Aplica la regla "un caso activo por (telefono, tipo)":
  // busca un caso de ese telefono y tipo que no este CERRADO; si lo
  // encuentra lo reutiliza (y actualiza su ultima intencion), si no
  // crea uno nuevo.
  private async buscarOCrearCaso(
    telefono: string,
    tipo: CaseType,
    intencion: Intencion,
  ) {
    // Buscar un caso activo (no CERRADO) de este telefono y este tipo.
    const casoExistente = await this.prisma.case.findFirst({
      where: {
        telefono,
        tipo,
        estado: { not: CaseStatus.CERRADO },
      },
    });

    // Si existe, lo reutilizamos y actualizamos su ultima intencion.
    if (casoExistente) {
      return this.prisma.case.update({
        where: { id: casoExistente.id },
        data: { intencion },
      });
    }

    // Si no existe, creamos uno nuevo.
    return this.prisma.case.create({
      data: {
        telefono,
        tipo,
        intencion,
      },
    });
  }
  // Serializa las tareas de un mismo telefono: la nueva tarea espera a
  // que termine la anterior antes de ejecutarse. Es el "lock" de 5.2.
  private conLock<T>(telefono: string, tarea: () => Promise<T>): Promise<T> {
    // Ultima promesa en la fila de este telefono. Si no hay ninguna,
    // arrancamos con una ya resuelta (fila vacia = se ejecuta de una).
    const filaAnterior = this.locks.get(telefono) ?? Promise.resolve();

    // Encadenamos nuestra tarea DESPUES de la fila anterior: recien se
    // ejecuta cuando la anterior termina.
    const miTurno = filaAnterior.then(() => tarea());

    // Nos registramos como la nueva ultima de la fila, para que la
    // proxima peticion de este telefono espere por nosotros.
    // El .catch(() => {}) evita que un error en una tarea rompa la
    // cadena y deje trabada la fila del telefono.
    this.locks.set(
      telefono,
      miTurno.catch(() => {}),
    );

    return miTurno;
  }

    // --- Metodos de lectura para el panel administrativo ---

  // Lista casos con filtros opcionales por tipo y estado.
  // Por defecto (sin filtro de estado) devuelve solo los activos
  // (ABIERTO y EN_PROCESO); los CERRADO son historial y se piden aparte.
  async listarCasos(filtros: { tipo?: CaseType; estado?: CaseStatus }) {
    return this.prisma.case.findMany({
      where: {
        // Si viene un tipo, filtra por el; si no, no restringe por tipo.
        ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
        // Si viene un estado, filtra por ese estado exacto; si no,
        // por defecto muestra solo los activos (no CERRADO).
        ...(filtros.estado
          ? { estado: filtros.estado }
          : { estado: { not: CaseStatus.CERRADO } }),
      },
      // Los mas recientes primero (por ultima actualizacion).
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Obtiene un caso por id, con su hilo completo de mensajes ordenado
  // cronologicamente. Devuelve null si el caso no existe.
  async obtenerCaso(id: string) {
    return this.prisma.case.findUnique({
      where: { id },
      // include trae los mensajes relacionados en la misma consulta.
      include: {
        mensajes: {
          orderBy: { createdAt: 'asc' }, // del mas viejo al mas nuevo
        },
      },
    });
  }

    // Cambia el estado de un caso (lo usa el panel: ABIERTO -> EN_PROCESO
  // -> CERRADO). Valida que el estado recibido sea uno valido y que el
  // caso exista, antes de actualizar.
  async cambiarEstado(id: string, estado: CaseStatus) {
    // Validacion: el estado debe ser uno de los valores permitidos.
    // Object.values(CaseStatus) da ['ABIERTO','EN_PROCESO','CERRADO'].
    if (!Object.values(CaseStatus).includes(estado)) {
      throw new BadRequestException(`Estado invalido: ${estado}`);
    }

    // Validacion: el caso debe existir.
    const existe = await this.prisma.case.findUnique({ where: { id } });
    if (!existe) {
      throw new NotFoundException(`Caso ${id} no encontrado`);
    }

    // Actualiza solo el estado; updatedAt se refresca solo (@updatedAt).
    return this.prisma.case.update({
      where: { id },
      data: { estado },
    });
  }
}