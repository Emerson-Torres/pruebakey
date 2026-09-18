import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Envuelve el PrismaClient como un servicio de Nest.
// Al extender PrismaClient, este servicio ES un cliente de Prisma:
// hereda todos sus metodos (prisma.case.create, prisma.message.findMany, etc.).
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Se ejecuta una vez cuando Nest termina de armar la app.
  // Abrimos la conexion a la base aca, no en cada consulta.
  async onModuleInit() {
    await this.$connect();
  }

  // Se ejecuta cuando la app se apaga (Ctrl+C, cierre del proceso).
  // Cerramos la conexion para no dejar conexiones colgadas.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}