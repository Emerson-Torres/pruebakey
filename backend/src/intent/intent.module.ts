import { Module } from '@nestjs/common';
import { IntentService } from './intent.service';

@Module({
  providers: [IntentService],
  exports: [IntentService], // permite que otros modulos (cases) lo inyecten
})
export class IntentModule {}
