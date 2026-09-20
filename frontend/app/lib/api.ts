import type { Case, CaseWithMessages, CaseType, CaseStatus } from './types';

// URL base del backend, leida de la variable de entorno.
// Si no esta definida, cae a localhost:3000 como default de desarrollo.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// Lista casos, con filtros opcionales por tipo y estado.
// Sin filtro de estado, el backend devuelve solo los activos.
export async function getCases(filtros?: {
  tipo?: CaseType;
  estado?: CaseStatus;
}): Promise<Case[]> {
  const params = new URLSearchParams();
  if (filtros?.tipo) params.set('tipo', filtros.tipo);
  if (filtros?.estado) params.set('estado', filtros.estado);

  const query = params.toString();
  const url = `${API_URL}/cases${query ? `?${query}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Error al listar casos: ${res.status}`);
  }
  return res.json();
}

// Obtiene un caso por id, con su hilo completo de mensajes.
export async function getCase(id: string): Promise<CaseWithMessages> {
  const res = await fetch(`${API_URL}/cases/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Error al obtener el caso: ${res.status}`);
  }
  return res.json();
}

// Cambia el estado de un caso (ABIERTO -> EN_PROCESO -> CERRADO).
export async function updateCaseStatus(
  id: string,
  estado: CaseStatus,
): Promise<Case> {
  const res = await fetch(`${API_URL}/cases/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) {
    throw new Error(`Error al cambiar el estado: ${res.status}`);
  }
  return res.json();
}