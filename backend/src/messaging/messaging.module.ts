import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MESSAGING_PROVIDER } from './messaging.interface';
import { LogMessagingProvider } from './log-messaging.provider';
import { TwilioMessagingProvider } from './twilio-messaging.provider';
@Module({
  providers: [
    {
      // Selecciona la implementacion del proveedor segun la variable
      // MESSAGING_PROVIDER del .env. useFactory permite decidir la clase
      // en tiempo de ejecucion, leyendo la config.
      provide: MESSAGING_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const tipo = config.get<string>('MESSAGING_PROVIDER') ?? 'log';

        // Hoy hay una sola implementacion sin credenciales (log).
        // Agregar Twilio seria: otra clase que implemente MessagingProvider
        // y un case mas aca. El resto del sistema no cambia.
          switch (tipo) {
          case 'twilio':
            return new TwilioMessagingProvider(config);
          case 'log':
          default:
            return new LogMessagingProvider();
        }
      },
    },
  ],
  exports: [MESSAGING_PROVIDER],
})
export class MessagingModule {}
