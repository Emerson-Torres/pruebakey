import { KnowledgeService } from './knowledge.service';
import { Intencion } from '../intent/intent.enum';

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  beforeEach(() => {
    service = new KnowledgeService();
  });

  it('devuelve una respuesta no vacia para cada intencion del catalogo', () => {
    // Recorre TODOS los valores del enum, asi si se agrega una intencion
    // nueva sin darle respuesta, este test la detecta automaticamente.
    for (const intencion of Object.values(Intencion)) {
      const respuesta = service.obtenerRespuesta(intencion);
      expect(respuesta).toBeTruthy();
      expect(respuesta.length).toBeGreaterThan(0);
    }
  });

  it('la respuesta de FECHAS_PAGO cubre admision y mensualidad (decision 6.3)', () => {
    const respuesta = service
      .obtenerRespuesta(Intencion.FECHAS_PAGO)
      .toLowerCase();
    expect(respuesta).toContain('admisión');
    expect(respuesta).toContain('mensualidad');
  });

  it('la respuesta de RECLAMO confirma el registro al usuario', () => {
    const respuesta = service.obtenerRespuesta(Intencion.RECLAMO);
    expect(respuesta.toLowerCase()).toContain('registrado');
  });
});
