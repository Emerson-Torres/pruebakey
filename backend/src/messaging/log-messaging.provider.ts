import { Injectable, Logger } from '@nestjs/common';
import { MessagingProvider } from './messaging.interface';

// Implementacion de MessagingProvider que no requiere credenciales:
// "envia" el mensaje escribiendolo en el log del servidor. Sirve para
// desarrollo por el momento y para el prototipo, sin depender de una cuenta de Twilio.
@Injectable()
export class LogMessagingProvider implements MessagingProvider {
  private readonly logger = new Logger('Mensajeria');

  async enviar(telefono: string, texto: string): Promise<void> {
    // En un proveedor real (Twilio) aca iria la llamada a su API.
    // Aca solo lo registramos en consola.
    this.logger.log(`[SALIENTE -> ${telefono}] ${texto}`);
  }
}