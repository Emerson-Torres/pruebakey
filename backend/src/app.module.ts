import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modulo raiz de la aplicacion: aca se registran los modulos, controllers
// y providers que arma toda la app. Mas adelante vamos a sumar aca los
// modulos de whatsapp, cases, messaging e intent.
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}