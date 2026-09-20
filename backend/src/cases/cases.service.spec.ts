import { Test, TestingModule } from '@nestjs/testing';
import { CaseType, CaseStatus, Direction, MessageStatus } from '@prisma/client';
import { CasesService, MensajeEntrante } from './cases.service';
import { PrismaService } from '../prisma/prisma.service';
import { IntentService } from '../intent/intent.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { Intencion } from '../intent/intent.enum';
import { MESSAGING_PROVIDER } from '../messaging/messaging.interface';

describe('CasesService', () => {
  let service: CasesService;

  // Mock de Prisma: imita solo los metodos que usa el servicio.
  const prismaMock = {
    case: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  // Mock del proveedor de mensajeria: por defecto "envia" sin fallar.
  const messagingMock = {
    enviar: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Por defecto, ningun mensaje es duplicado (findUnique devuelve null).
    // Los tests que prueban idempotencia lo sobreescriben.
    prismaMock.message.findUnique.mockResolvedValue(null);
    // El saliente que se crea necesita un id para el update posterior.
    prismaMock.message.create.mockResolvedValue({ id: 'msg-1' });
    prismaMock.message.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        IntentService,
        KnowledgeService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MESSAGING_PROVIDER, useValue: messagingMock },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
  });

  // --- Idempotencia (5.1): mismo messageSid dos veces = sin efecto ---

  it('ignora un mensaje cuyo messageSid ya fue procesado (idempotencia 5.1)', async () => {
    prismaMock.message.findUnique.mockResolvedValue({
      id: 'msg-existente',
      messageSid: 'SM999',
    });

    const entrante: MensajeEntrante = {
      telefono: '+50377777777',
      texto: 'quiero poner un reclamo',
      messageSid: 'SM999',
    };

    const resultado = await service.procesarMensaje(entrante);

    expect(prismaMock.case.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.case.create).not.toHaveBeenCalled();
    expect(prismaMock.message.create).not.toHaveBeenCalled();
    expect(resultado).toEqual({ duplicado: true });
  });

  // --- Escenario 1: no hay caso activo, se crea uno nuevo ---

  it('crea un caso nuevo tipo RECLAMO cuando no existe uno activo', async () => {
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({ id: 'caso-1' });

    const entrante: MensajeEntrante = {
      telefono: '+50370000000',
      texto: 'quiero poner un reclamo',
      messageSid: 'SM123',
    };

    await service.procesarMensaje(entrante);

    expect(prismaMock.case.create).toHaveBeenCalledWith({
      data: {
        telefono: '+50370000000',
        tipo: CaseType.RECLAMO,
        intencion: Intencion.RECLAMO,
      },
    });
    expect(prismaMock.case.update).not.toHaveBeenCalled();
  });

  it('crea un caso nuevo tipo CONSULTA para una consulta de fechas', async () => {
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({ id: 'caso-2' });

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
    prismaMock.case.findFirst.mockResolvedValue({
      id: 'caso-existente',
      telefono: '+50370000002',
      tipo: CaseType.CONSULTA,
      estado: CaseStatus.ABIERTO,
    });
    prismaMock.case.update.mockResolvedValue({ id: 'caso-existente' });

    const entrante: MensajeEntrante = {
      telefono: '+50370000002',
      texto: 'cuando empieza el ciclo',
      messageSid: 'SM125',
    };

    await service.procesarMensaje(entrante);

    expect(prismaMock.case.create).not.toHaveBeenCalled();
    expect(prismaMock.case.update).toHaveBeenCalledWith({
      where: { id: 'caso-existente' },
      data: { intencion: Intencion.FECHAS_CICLOS },
    });
  });

  // --- Escenario 3: la busqueda excluye los CERRADO (decision 6.2) ---

  it('busca solo casos que no esten CERRADO', async () => {
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({ id: 'caso-3' });

    const entrante: MensajeEntrante = {
      telefono: '+50370000003',
      texto: 'quiero poner un reclamo',
      messageSid: 'SM126',
    };

    await service.procesarMensaje(entrante);

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

    // Segundo mensaje: el saliente (OUTBOUND), nace como PENDING.
    expect(prismaMock.message.create).toHaveBeenNthCalledWith(2, {
      data: {
        caseId: 'caso-4',
        direccion: Direction.OUTBOUND,
        texto: expect.any(String),
        estado: MessageStatus.PENDING,
      },
    });
  });

  // --- Concurrencia (5.2): dos mensajes del mismo numero a la vez ---

  it('no crea casos duplicados cuando llegan dos mensajes del mismo numero a la vez', async () => {
    let casoCreado: { id: string } | null = null;

    prismaMock.case.findFirst.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return casoCreado;
    });

    prismaMock.case.create.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      casoCreado = { id: 'caso-unico' };
      return casoCreado;
    });

    prismaMock.case.update.mockResolvedValue({ id: 'caso-unico' });

    const mensaje1: MensajeEntrante = {
      telefono: '+50388888888',
      texto: 'quiero poner un reclamo',
      messageSid: 'SM-A',
    };
    const mensaje2: MensajeEntrante = {
      telefono: '+50388888888',
      texto: 'quiero poner un reclamo',
      messageSid: 'SM-B',
    };

    await Promise.all([
      service.procesarMensaje(mensaje1),
      service.procesarMensaje(mensaje2),
    ]);

    expect(prismaMock.case.create).toHaveBeenCalledTimes(1);
  });

  // --- Proveedor de mensajeria (5.3): envio exitoso vs fallido ---

  it('marca el saliente como SENT cuando el envio tiene exito', async () => {
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({
      id: 'caso-5',
      telefono: '+50370000005',
    });
    // El envio no falla (mock por defecto).

    const entrante: MensajeEntrante = {
      telefono: '+50370000005',
      texto: 'cuando empieza el ciclo',
      messageSid: 'SM200',
    };

    await service.procesarMensaje(entrante);

    // Se intento enviar por el proveedor...
    expect(messagingMock.enviar).toHaveBeenCalled();
    // ...y el saliente (msg-1) se marco como SENT.
    expect(prismaMock.message.update).toHaveBeenCalledWith({
      where: { id: 'msg-1' },
      data: { estado: MessageStatus.SENT },
    });
  });

  it('marca el saliente como FAILED cuando el envio falla, sin perder el mensaje (5.3)', async () => {
    prismaMock.case.findFirst.mockResolvedValue(null);
    prismaMock.case.create.mockResolvedValue({
      id: 'caso-6',
      telefono: '+50370000006',
    });
    // Simulamos que el envio falla (el proveedor lanza error).
    messagingMock.enviar.mockRejectedValue(new Error('proveedor caido'));

    const entrante: MensajeEntrante = {
      telefono: '+50370000006',
      texto: 'cuando empieza el ciclo',
      messageSid: 'SM201',
    };

    // No debe explotar: el fallo del envio se maneja internamente.
    await service.procesarMensaje(entrante);

    // El saliente NO se pierde: queda marcado como FAILED.
    expect(prismaMock.message.update).toHaveBeenCalledWith({
      where: { id: 'msg-1' },
      data: { estado: MessageStatus.FAILED },
    });
  });
});
