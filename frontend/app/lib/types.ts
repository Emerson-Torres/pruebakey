// Tipos que reflejan la forma de los datos que devuelve el backend.
// Coinciden con los modelos de Prisma (Case, Message) y sus enums.

export type CaseType = 'CONSULTA' | 'RECLAMO';
export type CaseStatus = 'ABIERTO' | 'EN_PROCESO' | 'CERRADO';
export type Direction = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED';

// Un mensaje del hilo de un caso.
export interface Message {
  id: string;
  caseId: string;
  messageSid: string | null;
  direccion: Direction;
  texto: string;
  intencion: string | null;
  estado: MessageStatus;
  createdAt: string; // las fechas llegan como string (ISO) desde el JSON
}

// Un caso en la lista (sin mensajes).
export interface Case {
  id: string;
  telefono: string;
  tipo: CaseType;
  estado: CaseStatus;
  intencion: string | null;
  createdAt: string;
  updatedAt: string;
}

// Un caso con su hilo de mensajes (lo que devuelve el detalle).
export interface CaseWithMessages extends Case {
  mensajes: Message[];
}