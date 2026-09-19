import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { IntentModule } from '../intent/intent.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [IntentModule, KnowledgeModule, MessagingModule], // + mensajeria
  providers: [CasesService],
  exports: [CasesService], //uso del webhook
})
export class CasesModule {}