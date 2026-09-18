import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Punto de entrada de la aplicacion: arranca el servidor HTTP de Nest.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

// Se envuelve en una funcion async porque CommonJS no permite
// "await" suelto a nivel de archivo (eso solo existe en ESM).
bootstrap();