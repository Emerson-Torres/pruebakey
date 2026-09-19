import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { IntentModule } from '../intent/intent.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [IntentModule, KnowledgeModule], // trae IntentService y KnowledgeService
  providers: [CasesService],
  exports: [CasesService], // el webhook lo va a necesitar despues
})
export class CasesModule {}