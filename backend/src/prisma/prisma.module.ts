import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Modulo global de acceso a la base de datos.
// @Global hace que PrismaService este disponible en toda la app
// sin tener que importar PrismaModule en cada modulo que lo use.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // exportar = permitir que otros modulos lo inyecten
})
export class PrismaModule {}