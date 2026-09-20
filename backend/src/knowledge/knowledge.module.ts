import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Module({
  providers: [KnowledgeService],
  exports: [KnowledgeService], // permite que otros modulos lo inyecten
})
export class KnowledgeModule {}
