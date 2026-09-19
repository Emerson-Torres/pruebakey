import { Injectable } from '@nestjs/common';
import { CaseType, CaseStatus, Direction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IntentService } from '../intent/intent.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { Intencion } from '../intent/intent.enum';

// Datos que llegan del webhook por cada mensaje entrante.
export interface MensajeEntrante {
  telefono: string; // el "From" de Twilio
  texto: string; // el "Body"
  messageSid: string; // el "MessageSid", id unico de Twilio
}

@Injectable()
export class CasesService {
  // Nest inyecta estos tres servicios automaticamente gracias a los
  // imports/exports que configuramos en los modulos.
  constructor(
    private readonly prisma: PrismaService,
    private readonly intent: IntentService,
    private readonly knowledge: KnowledgeService,
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

    // 3. Buscar o crear el caso segun la regla "un caso activo por
    //    (telefono, tipo)".
    const caso = await this.buscarOCrearCaso(
      entrante.telefono,
      tipo,
      intencion,
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

    // 6. Guardar el mensaje SALIENTE (la respuesta del bot).
    await this.prisma.message.create({
      data: {
        caseId: caso.id,
        direccion: Direction.OUTBOUND,
        texto: respuesta,
      },
    });

    // 7. Devolver lo necesario para responder al usuario.
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
}