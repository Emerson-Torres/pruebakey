import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio, { Twilio } from 'twilio';
import { MessagingProvider } from './messaging.interface';

// Implementacion de MessagingProvider que envia por la API real de Twilio.
// Es la segunda implementacion de la misma interfaz: el resto del sistema
// (CasesService, etc.) no cambia nada al usar esta en vez de la de log.
@Injectable()
export class TwilioMessagingProvider implements MessagingProvider {
  private readonly logger = new Logger('TwilioMensajeria');
  private readonly client: Twilio;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    // Lee las credenciales del entorno (nunca hardcodeadas).
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.from = this.config.get<string>('TWILIO_WHATSAPP_FROM') ?? '';

    // Crea el cliente de Twilio con las credenciales.
    this.client = twilio(accountSid, authToken);
  }

  async enviar(telefono: string, texto: string): Promise<void> {
    // Twilio espera el destino con el prefijo "whatsapp:".
    const to = telefono.startsWith('whatsapp:')
      ? telefono
      : `whatsapp:${telefono}`;

    // Llama a la API de Twilio para enviar el mensaje de WhatsApp.
    await this.client.messages.create({
      from: this.from,
      to,
      body: texto,
    });

    this.logger.log(`Mensaje enviado por Twilio a ${to}`);
  }
}