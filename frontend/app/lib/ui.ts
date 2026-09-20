import type { CaseStatus, CaseType } from './types';

// Clases de Tailwind para el badge de cada estado.
export function estadoBadge(estado: CaseStatus): string {
  switch (estado) {
    case 'ABIERTO':
      return 'bg-blue-100 text-blue-800';
    case 'EN_PROCESO':
      return 'bg-amber-100 text-amber-800';
    case 'CERRADO':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Clases de Tailwind para el badge de cada tipo.
export function tipoBadge(tipo: CaseType): string {
  return tipo === 'RECLAMO'
    ? 'bg-orange-100 text-orange-800'
    : 'bg-gray-100 text-gray-700';
}

// Etiqueta legible para el estado (sin guion bajo).
export function estadoLabel(estado: CaseStatus): string {
  return estado === 'EN_PROCESO' ? 'En proceso' : capitalizar(estado);
}

// Etiqueta legible para el tipo.
export function tipoLabel(tipo: CaseType): string {
  return capitalizar(tipo);
}

// Formatea una fecha ISO a algo corto y legible en espanol.
export function formatFecha(iso: string): string {
  const fecha = new Date(iso);
  return fecha.toLocaleString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function capitalizar(texto: string): string {
  const min = texto.toLowerCase();
  return min.charAt(0).toUpperCase() + min.slice(1);
}