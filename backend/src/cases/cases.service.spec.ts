import { Test, TestingModule } from '@nestjs/testing';
import { CaseType, CaseStatus, Direction } from '@prisma/client';
import { CasesService, MensajeEntrante } from './cases.service';
import { PrismaService } from '../prisma/prisma.service';
import { IntentService } from '../intent/intent.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { Intencion } from '../intent/intent.enum';

describe('CasesService', () => {
  let service: CasesService;

  // Mock de Prisma: imita solo los metodos que usa el servicio.
  // Ahora incluye findFirst y update, que agrego la regla find-or-create.
  const prismaMock = {
    case: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        IntentService,
        KnowledgeService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
  });

  // --- Escenario 1: no hay caso activo, se crea uno nuevo ---

  it('crea un caso nuevo tipo RECLAMO cuando no existe uno activo', async () => {
    // findFirst devuelve null = no hay caso activo para ese telefono/tipo.
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({ id: 'caso-1' });
    prismaMock.message.create.mockResolvedValue({});

    const entrante: MensajeEntrante = {
      telefono: '+50370000000',
      texto: 'quiero poner un reclamo',
      messageSid: 'SM123',
    };

    await service.procesarMensaje(entrante);

    // Se debe crear un caso RECLAMO (no reutilizar ni actualizar).
    expect(prismaMock.case.create).toHaveBeenCalledWith({
      data: {
        telefono: '+50370000000',
        tipo: CaseType.RECLAMO,
        intencion: Intencion.RECLAMO,
      },
    });
    // Y no se debe haber llamado a update (no habia caso que reutilizar).
    expect(prismaMock.case.update).not.toHaveBeenCalled();
  });

  it('crea un caso nuevo tipo CONSULTA para una consulta de fechas', async () => {
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({ id: 'caso-2' });
    prismaMock.message.create.mockResolvedValue({});

    const entrante: MensajeEntrante = {
      telefono: '+50370000001',
      texto: 'cuando empieza el ciclo',
      messageSid: 'SM124',
    };

    await service.procesarMensaje(entrante);

    expect(prismaMock.case.create).toHaveBeenCalledWith({
      data: {
        telefono: '+50370000001',
        tipo: CaseType.CONSULTA,
        intencion: Intencion.FECHAS_CICLOS,
      },
    });
  });

  // --- Escenario 2: ya existe un caso activo, se reutiliza (decision 6.4) ---

  it('reutiliza el caso activo existente en vez de crear otro', async () => {
    // Simulamos que ya hay un caso activo para ese telefono y tipo.
    prismaMock.case.findFirst.mockResolvedValue({
      id: 'caso-existente',
      telefono: '+50370000002',
      tipo: CaseType.CONSULTA,
      estado: CaseStatus.ABIERTO,
    });
    prismaMock.case.update.mockResolvedValue({ id: 'caso-existente' });
    prismaMock.message.create.mockResolvedValue({});

    const entrante: MensajeEntrante = {
      telefono: '+50370000002',
      texto: 'cuando empieza el ciclo',
      messageSid: 'SM125',
    };

    await service.procesarMensaje(entrante);

    // NO se debe crear un caso nuevo...
    expect(prismaMock.case.create).not.toHaveBeenCalled();
    // ...sino actualizar el existente.
    expect(prismaMock.case.update).toHaveBeenCalledWith({
      where: { id: 'caso-existente' },
      data: { intencion: Intencion.FECHAS_CICLOS },
    });
  });

  // --- Escenario 3: la busqueda excluye los CERRADO (decision 6.2) ---

  it('busca solo casos que no esten CERRADO', async () => {
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({ id: 'caso-3' });
    prismaMock.message.create.mockResolvedValue({});

    const entrante: MensajeEntrante = {
      telefono: '+50370000003',
      texto: 'quiero poner un reclamo',
      messageSid: 'SM126',
    };

    await service.procesarMensaje(entrante);

    // Verificamos que la busqueda excluye los cerrados: asi, si el unico
    // caso previo estaba CERRADO, findFirst devuelve null y se crea uno
    // nuevo (decision 6.2: un caso cerrado no se reabre).
    expect(prismaMock.case.findFirst).toHaveBeenCalledWith({
      where: {
        telefono: '+50370000003',
        tipo: CaseType.RECLAMO,
        estado: { not: CaseStatus.CERRADO },
      },
    });
  });

  // --- Registro de mensajes: entrante + saliente ---

  it('guarda el mensaje entrante y el saliente (dos mensajes en total)', async () => {
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({ id: 'caso-4' });
    prismaMock.message.create.mockResolvedValue({});

    const entrante: MensajeEntrante = {
      telefono: '+50370000004',
      texto: 'quiero poner un reclamo',
      messageSid: 'SM127',
    };

    await service.procesarMensaje(entrante);

    expect(prismaMock.message.create).toHaveBeenCalledTimes(2);

    // Primer mensaje: el entrante (INBOUND) con su messageSid.
    expect(prismaMock.message.create).toHaveBeenNthCalledWith(1, {
      data: {
        caseId: 'caso-4',
        messageSid: 'SM127',
        direccion: Direction.INBOUND,
        texto: 'quiero poner un reclamo',
        intencion: Intencion.RECLAMO,
      },
    });

    // Segundo mensaje: el saliente (OUTBOUND), sin messageSid.
    expect(prismaMock.message.create).toHaveBeenNthCalledWith(2, {
      data: {
        caseId: 'caso-4',
        direccion: Direction.OUTBOUND,
        texto: expect.any(String),
      },
    });
  });
});