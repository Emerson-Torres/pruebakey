import { Injectable } from '@nestjs/common';
import { Intencion } from '../intent/intent.enum';

// Base de conocimiento estática adaptada a Key Institute (Instituto Kriete de Ingeniería y Ciencias).
// Fuente: https://www.keyinstitute.com/
// Nota: donde no hay dato público en la web, se deja un texto de ejemplo editable.
const RESPUESTAS: Record<Intencion, string> = {
  [Intencion.FECHAS_CICLOS]:
    'Las ingenierías en Key Institute tienen una duración de 4 años (8 ciclos académicos). ' +
    'El año escolar inicia en agosto de 2026 o enero de 2027. ' +
    'La primera cohorte inició el 3 de marzo de 2025.',

  [Intencion.FECHAS_PAGO]:
    // Decision 6.3: no se pregunta si es admision o mensualidad, se
    // responden los dos juntos para no agregar friccion.
    // Dato real: costo de admision $50 (sitio de Key Institute).
    // Fechas y monto de mensualidad: no publicados en la web, se usa
    // un valor de ejemplo para el prototipo (dato "seed").
    'El proceso de admisión tiene un costo de $50, pagadero al momento de aplicar. ' +
    'La mensualidad es de $150 y vence el día 5 de cada mes. ' +
    'Para más detalle, escribe a admisiones@keyinstitute.edu.sv.',

  [Intencion.INSCRIPCION]:
    'Para inscribirte en Key Institute necesitas: (1) llenar el formulario de admisión, ' +
    '(2) escribir el Key Essay, (3) pagar el proceso de admisión, (4) adjuntar partida de nacimiento, ' +
    '(5) DUI o Pasaporte, (6) DUI del gestor de pago, (7) notas de los dos primeros años de bachillerato ' +
    '(selladas y firmadas), (8) entrevista Key y (9) examen Key.',

  [Intencion.ADMISIONES]:
    'Key Institute ofrece tres carreras de ingeniería: ' +
    '1) Ingeniería y Ciencias de la Computación Integradas, ' +
    '2) Ingeniería Industrial y Manufactura Avanzada, ' +
    '3) Ingeniería Mecatrónica y Robótica. ' +
    'Contacto de admisiones: admisiones@keyinstitute.edu.sv. ' +
    'Contacto de RRHH: recursos.humanos@keyinstitute.edu.sv.',

  [Intencion.RECLAMO]:
    'Tu reclamo fue registrado. Un asesor de Key Institute te contactará a la brevedad. ' +
    'También puedes escribir directamente a: info@keyinstitute.edu.sv.',

  [Intencion.DESCONOCIDA]:
    'No entendí tu mensaje. Puedo ayudarte con: fechas de ciclos, fechas de pago, ' +
    'inscripción, admisiones, o registrar un reclamo. ' +
    'Escribime qué necesitás.',
};

@Injectable()
export class KnowledgeService {
  // Devuelve el texto de respuesta para una intención dada.
  obtenerRespuesta(intencion: Intencion): string {
    return RESPUESTAS[intencion];
  }
}