import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Punto de entrada de la aplicacion: arranca el servidor HTTP de Nest.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para que el panel (que corre en otro puerto) pueda
  // consumir esta API desde el navegador. Sin esto, el navegador bloquea
  // las peticiones entre origenes distintos (localhost:3001 -> :3000).
   app.enableCors({
    origin: 'http://localhost:3001', // origen del frontend
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],// metodos y headers permitidos para asegurar la funcionalidad completa al clonar
    allowedHeaders: ['Content-Type'],
  });

  await app.listen(process.env.PORT ?? 3000);
}

// Se envuelve en una funcion async porque CommonJS no permite
// "await" suelto a nivel de archivo (eso solo existe en ESM).
bootstrap();
