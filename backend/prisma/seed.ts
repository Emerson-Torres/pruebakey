import { PrismaClient, CaseType, CaseStatus, Direction } from '@prisma/client';

const prisma = new PrismaClient();

// Datos de ejemplo para el panel. Cubren distintos tipos y estados
// para poder probar los filtros. Los telefonos tienen formato correcto.
async function main() {
  // 1. Limpiar la base: primero los mensajes (dependen de los casos),
  //    despues los casos. El orden importa por la llave foranea.
  await prisma.message.deleteMany();
  await prisma.case.deleteMany();

  // 2. Caso RECLAMO abierto, con su hilo de mensajes.
  await prisma.case.create({
    data: {
      telefono: '+50378124567',
      tipo: CaseType.RECLAMO,
      estado: CaseStatus.ABIERTO,
      intencion: 'RECLAMO',
      mensajes: {
        create: [
          {
            messageSid: 'SEED-SM-001',
            direccion: Direction.INBOUND,
            texto: 'quiero poner un reclamo, llevo dias esperando',
            intencion: 'RECLAMO',
            estado: 'SENT',
          },
          {
            direccion: Direction.OUTBOUND,
            texto:
              'Tu reclamo fue registrado. Un asesor de Key Institute te contactara a la brevedad.',
            estado: 'SENT',
          },
        ],
      },
    },
  });

  // 3. Caso CONSULTA en proceso (alguien ya lo esta atendiendo).
  await prisma.case.create({
    data: {
      telefono: '+50361239870',
      tipo: CaseType.CONSULTA,
      estado: CaseStatus.EN_PROCESO,
      intencion: 'FECHAS_PAGO',
      mensajes: {
        create: [
          {
            messageSid: 'SEED-SM-002',
            direccion: Direction.INBOUND,
            texto: 'cuando tengo que pagar?',
            intencion: 'FECHAS_PAGO',
            estado: 'SENT',
          },
          {
            direccion: Direction.OUTBOUND,
            texto:
              'El proceso de admision cuesta $50. La mensualidad es de $150 y vence el dia 5 de cada mes.',
            estado: 'SENT',
          },
        ],
      },
    },
  });

  // 4. Caso CONSULTA abierto (recien llegado, sin atender).
  await prisma.case.create({
    data: {
      telefono: '+50370459812',
      tipo: CaseType.CONSULTA,
      estado: CaseStatus.ABIERTO,
      intencion: 'INSCRIPCION',
      mensajes: {
        create: [
          {
            messageSid: 'SEED-SM-003',
            direccion: Direction.INBOUND,
            texto: 'como me inscribo?',
            intencion: 'INSCRIPCION',
            estado: 'SENT',
          },
          {
            direccion: Direction.OUTBOUND,
            texto:
              'Para inscribirte necesitas: formulario de admision, Key Essay, pago del proceso, partida de nacimiento y DUI.',
            estado: 'SENT',
          },
        ],
      },
    },
  });

  // 5. Caso RECLAMO cerrado (historial: no aparece en la vista por defecto).
  await prisma.case.create({
    data: {
      telefono: '+50376583201',
      tipo: CaseType.RECLAMO,
      estado: CaseStatus.CERRADO,
      intencion: 'RECLAMO',
      mensajes: {
        create: [
          {
            messageSid: 'SEED-SM-004',
            direccion: Direction.INBOUND,
            texto: 'tuve un problema con mi pago',
            intencion: 'RECLAMO',
            estado: 'SENT',
          },
          {
            direccion: Direction.OUTBOUND,
            texto: 'Tu reclamo fue registrado y resuelto. Gracias por tu paciencia.',
            estado: 'SENT',
          },
        ],
      },
    },
  });

  console.log('Seed completado: 4 casos de ejemplo creados.');
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });