'use client';

import type { CaseStatus } from '../lib/types';

interface Props {
  estadoActual: CaseStatus;
  // Se dispara cuando el operador pide avanzar el estado.
  onCambiar: (nuevo: CaseStatus) => void;
  // Mientras se guarda el cambio, deshabilitamos el boton.
  guardando: boolean;
}

export function CaseStatusControl({ estadoActual, onCambiar, guardando }: Props) {
  // Segun el estado actual, definimos cual es el "siguiente paso" logico.
  // Esta es la decision que tomamos: avance explicito, un boton a la vez.
  const siguiente = obtenerSiguiente(estadoActual);

  // Un caso CERRADO no tiene siguiente paso (no se reabre, decision 6.2).
  if (!siguiente) {
    return (
      <p className="text-sm text-gray-500">
        Este caso está cerrado. No hay más acciones.
      </p>
    );
  }

  return (
    <button
      onClick={() => onCambiar(siguiente.estado)}
      disabled={guardando}
      className="rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
      style={{ backgroundColor: 'var(--key-dark)' }}
    >
      {guardando ? 'Guardando…' : siguiente.label}
    </button>
  );
}

// Define el siguiente estado y la etiqueta del boton segun el estado actual.
// ABIERTO -> "Tomar caso" -> EN_PROCESO -> "Cerrar caso" -> CERRADO.
function obtenerSiguiente(
  estado: CaseStatus,
): { estado: CaseStatus; label: string } | null {
  switch (estado) {
    case 'ABIERTO':
      return { estado: 'EN_PROCESO', label: 'Tomar caso' };
    case 'EN_PROCESO':
      return { estado: 'CERRADO', label: 'Cerrar caso' };
    case 'CERRADO':
      return null; // no hay accion siguiente
    default:
      return null;
  }
}