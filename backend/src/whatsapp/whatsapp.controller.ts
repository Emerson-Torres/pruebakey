import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { CasesService } from '../cases/cases.service';
import { TwilioWebhookDto } from './dto/twilio-webhook.dto';

// Controlador del webhook de WhatsApp. Es la puerta de entrada HTTP:
// recibe los mensajes que enviaria Twilio y delega el trabajo real
// al CasesService. No contiene logica de negocio.
@Controller('webhook')
export class WhatsappController {
  constructor(private readonly cases: CasesService) {}

  // POST /webhook/whatsapp
  // Twilio envia los datos en formato form-encoded; Nest los parsea
  // automaticamente y los entrega en el @Body como TwilioWebhookDto.
  @Post('whatsapp')
  @HttpCode(200) // responder 200 rapido: si Twilio no recibe 200 a tiempo, reintenta
  async recibirMensaje(@Body() payload: TwilioWebhookDto) {
    // Twilio manda el remitente como "whatsapp:+50370000000".
    // Le quitamos el prefijo "whatsapp:" para guardar solo el numero.
    const telefono = payload.From?.replace('whatsapp:', '') ?? '';

    // Traducimos del formato de Twilio (PascalCase) al que espera
    // nuestro servicio (la interfaz MensajeEntrante).
    const resultado = await this.cases.procesarMensaje({
      telefono,
      texto: payload.Body,
      messageSid: payload.MessageSid,
    });

    // Devolvemos la respuesta generada. En este prototipo sirve para
    // verificar el flujo con curl; el envio real al usuario se maneja
    // aparte (interfaz de mensajeria, mas adelante).
    return { respuesta: resultado.respuesta };
  }
}