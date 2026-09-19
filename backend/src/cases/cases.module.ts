import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { IntentModule } from '../intent/intent.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { MessagingModule } from '../messaging/messaging.module';
import { CasesController } from './cases.controller';

@Module({
  imports: [IntentModule, KnowledgeModule, MessagingModule], // + mensajeria
  providers: [CasesService],
  exports: [CasesService],
  controllers: [CasesController], //uso del webhook
})
export class CasesModule {}