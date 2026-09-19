import { IntentService } from './intent.service';
import { Intencion } from './intent.enum';

describe('IntentService', () => {
  let service: IntentService;

  // El servicio no tiene dependencias (no inyecta nada), asi que
  // no hace falta armar un TestingModule de Nest: se instancia directo.
  beforeEach(() => {
    service = new IntentService();
  });

  // --- Casos por cada intencion del catalogo ---

  it('detecta FECHAS_CICLOS cuando se pregunta por el inicio del ciclo', () => {
    expect(service.detectar('¿cuándo empieza el ciclo?')).toBe(Intencion.FECHAS_CICLOS);
  });

  it('detecta FECHAS_PAGO sin importar mayusculas ni acentos', () => {
    // Prueba especifica de normalizacion: "Matrícula" con tilde y mayuscula
    expect(service.detectar('fechas de pago de Matrícula')).toBe(Intencion.FECHAS_PAGO);
  });

  it('detecta INSCRIPCION cuando preguntan como inscribirse', () => {
    expect(service.detectar('cómo me inscribo')).toBe(Intencion.INSCRIPCION);
  });

  it('detecta ADMISIONES cuando preguntan por una carrera', () => {
    expect(service.detectar('info sobre admisión a ingeniería')).toBe(Intencion.ADMISIONES);
  });

  it('detecta RECLAMO con el mensaje directo', () => {
    expect(service.detectar('quiero poner un reclamo')).toBe(Intencion.RECLAMO);
  });

  // --- Fallback ---

  it('devuelve DESCONOCIDA cuando el mensaje no coincide con nada', () => {
    expect(service.detectar('hola, ¿qué tal?')).toBe(Intencion.DESCONOCIDA);
  });

  // --- Caso limite: la decision 6.1, prioridad de RECLAMO sobre INSCRIPCION ---

  it('prioriza RECLAMO sobre INSCRIPCION cuando el mensaje menciona ambos temas', () => {
    // Este es el ejemplo textual de la seccion 6 de la prueba tecnica:
    // "reclamo por tres dias esperando respuesta sobre mi inscripcion"
    // debe ganar RECLAMO, no INSCRIPCION.
    const texto = 'quiero poner un reclamo porque llevo tres días esperando respuesta sobre mi inscripción';
    expect(service.detectar(texto)).toBe(Intencion.RECLAMO);
  });

  // --- Caso limite: palabra completa, no fragmento ---

  it('no confunde palabras parecidas (word boundary)', () => {
    // "empago" contiene la letra secuencia "pago" pero no es la palabra "pago"
    expect(service.detectar('mi empresa se llama empago solutions')).toBe(Intencion.DESCONOCIDA);
  });
});