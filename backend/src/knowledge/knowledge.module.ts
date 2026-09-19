import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Module({
  providers: [KnowledgeService]
})
export class KnowledgeModule {}
