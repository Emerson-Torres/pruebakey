import { Injectable } from '@nestjs/common';
import { Intencion } from './intent.enum';

// Cada entrada asocia una intencion con las palabras clave que la disparan.
// EL ORDEN IMPORTA: se recorre de arriba hacia abajo y gana la primera
// que coincide. Por eso RECLAMO va primero (decision 6.1: si alguien
// dice "reclamo por mi inscripcion", debe ganar RECLAMO sobre INSCRIPCION).
const CATALOGO: { intencion: Intencion; keywords: string[] }[] = [
  { intencion: Intencion.RECLAMO, keywords: ['reclamo', 'reclamar', 'queja', 'problema'] },
  { intencion: Intencion.INSCRIPCION, keywords: ['inscri', 'requisitos'] },
  { intencion: Intencion.FECHAS_PAGO, keywords: ['pago', 'pagar', 'matricula', 'cuota', 'cuotas'] },
  { intencion: Intencion.FECHAS_CICLOS, keywords: ['ciclo', 'inicio', 'empieza', 'semestre', 'arranca'] },
  { intencion: Intencion.ADMISIONES, keywords: ['admision', 'carrera', 'ingenieria', 'contacto'] },
];

@Injectable()
export class IntentService {
  // Detecta la intencion de un texto libre del usuario.
  detectar(textoOriginal: string): Intencion {
    const texto = this.normalizar(textoOriginal);

    // Recorre el catalogo en orden; devuelve la primera intencion
    // cuya palabra clave aparezca como palabra completa en el texto.
    for (const entrada of CATALOGO) {
      for (const keyword of entrada.keywords) {
        if (this.contienePalabra(texto, keyword)) {
          return entrada.intencion;
        }
      }
    }

    // Si nada coincidio, es intencion desconocida (dispara el menu de ayuda).
    return Intencion.DESCONOCIDA;
  }

  // Deja el texto comparable: minusculas y sin acentos.
  // Asi "Matricula", "MATRICULA" y "matricula" se vuelven todas iguales.
  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD') // separa cada letra de su acento
      .replace(/[\u0300-\u036f]/g, ''); // borra los acentos ya separados
  }

  // Verifica que la keyword aparezca como PALABRA COMPLETA, no como fragmento.
  // Sin esto, "pago" coincidiria dentro de "empago" o "pagote".
  private contienePalabra(texto: string, keyword: string): boolean {
    const patron = new RegExp(`\\b${keyword}`);
    return patron.test(texto);
  }
}