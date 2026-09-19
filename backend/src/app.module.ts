import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { IntentModule } from './intent/intent.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { CasesModule } from './cases/cases.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { MessagingModule } from './messaging/messaging.module';

// Modulo raiz de la aplicacion: registra todos los modulos del sistema.
@Module({
  imports: [
    // ConfigModule carga el .env y hace las variables accesibles en toda
    // la app via ConfigService. isGlobal evita tener que importarlo en
    // cada modulo que necesite leer una variable de entorno.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IntentModule,
    KnowledgeModule,
    CasesModule,
    WhatsappModule,
    MessagingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}