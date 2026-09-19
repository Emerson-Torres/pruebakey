import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { CaseType, CaseStatus } from '@prisma/client';
import { CasesService } from './cases.service';

// API de gestion de casos para el panel administrativo.
// Distinta del WhatsappController: aquel recibe mensajes (lo usa Twilio),
// este expone la lectura y gestion de casos (lo usa el panel).
@Controller('cases')
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  // GET /cases?tipo=RECLAMO&estado=ABIERTO
  // Lista casos. Sin filtro de estado, devuelve solo los activos
  // (ABIERTO y EN_PROCESO); los CERRADO se piden con ?estado=CERRADO.
  @Get()
  async listar(
    @Query('tipo') tipo?: CaseType,
    @Query('estado') estado?: CaseStatus,
  ) {
    return this.cases.listarCasos({ tipo, estado });
  }

  // GET /cases/:id
  // Devuelve un caso con su hilo completo de mensajes.
  @Get(':id')
  async detalle(@Param('id') id: string) {
    const caso = await this.cases.obtenerCaso(id);
    // Si el id no existe, respondemos 404 en vez de un null silencioso.
    if (!caso) {
      throw new NotFoundException(`Caso ${id} no encontrado`);
    }
    return caso;
  }

  // PATCH /cases/:id/estado
  // Cambia el estado de un caso. El body es { "estado": "EN_PROCESO" }.
  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id') id: string,
    @Body('estado') estado: CaseStatus,
  ) {
    return this.cases.cambiarEstado(id, estado);
  }
}