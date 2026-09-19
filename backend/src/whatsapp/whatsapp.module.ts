import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { CasesModule } from '../cases/cases.module';

@Module({
  imports: [CasesModule], // trae CasesService para procesar los mensajes
  controllers: [WhatsappController],
})
export class WhatsappModule {}