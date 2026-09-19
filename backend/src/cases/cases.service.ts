import { Injectable } from '@nestjs/common';
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

  // Procesa un mensaje entrante de punta a punta (version Etapa 1: siempre
  // crea un caso nuevo; la logica de buscar caso existente viene despues).
  async procesarMensaje(entrante: MensajeEntrante) {
    // 1. Detectar la intencion del texto.
    const intencion = this.intent.detectar(entrante.texto);

    // 2. Derivar el tipo de caso a partir de la intencion.
    //    Solo RECLAMO abre un caso tipo RECLAMO; el resto son CONSULTA.
    const tipo = intencion === Intencion.RECLAMO ? 'RECLAMO' : 'CONSULTA';

    // 3. Crear el caso en la base.
    const caso = await this.prisma.case.create({
      data: {
        telefono: entrante.telefono,
        tipo,
        intencion,
      },
    });

    // 4. Guardar el mensaje ENTRANTE, ligado al caso.
    await this.prisma.message.create({
      data: {
        caseId: caso.id,
        messageSid: entrante.messageSid,
        direccion: 'INBOUND',
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
        direccion: 'OUTBOUND',
        texto: respuesta,
        // los salientes no tienen messageSid (no vienen de Twilio)
      },
    });

    // 7. Devolver lo necesario para responder al usuario.
    return { caso, respuesta };
  }
}