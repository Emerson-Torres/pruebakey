'use client';

import type { CaseType, CaseStatus } from '../lib/types';

// Props: los filtros activos y las funciones para cambiarlos.
// El componente no guarda estado propio; lo recibe y lo reporta hacia arriba.
interface Props {
  filtroTipo?: CaseType;
  filtroEstado?: CaseStatus;
  onTipo: (tipo?: CaseType) => void;
  onEstado: (estado?: CaseStatus) => void;
}

export function CaseFilters({
  filtroTipo,
  filtroEstado,
  onTipo,
  onEstado,
}: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">Tipo</span>
      <FiltroBtn activo={!filtroTipo} onClick={() => onTipo(undefined)}>
        Todos
      </FiltroBtn>
      <FiltroBtn
        activo={filtroTipo === 'CONSULTA'}
        onClick={() => onTipo('CONSULTA')}
      >
        Consulta
      </FiltroBtn>
      <FiltroBtn
        activo={filtroTipo === 'RECLAMO'}
        onClick={() => onTipo('RECLAMO')}
      >
        Reclamo
      </FiltroBtn>

      <span className="mx-2 h-4 w-px bg-gray-300" />

      <span className="text-xs text-gray-500">Estado</span>
      <FiltroBtn activo={!filtroEstado} onClick={() => onEstado(undefined)}>
        Activos
      </FiltroBtn>
      <FiltroBtn
        activo={filtroEstado === 'ABIERTO'}
        onClick={() => onEstado('ABIERTO')}
      >
        Abierto
      </FiltroBtn>
      <FiltroBtn
        activo={filtroEstado === 'EN_PROCESO'}
        onClick={() => onEstado('EN_PROCESO')}
      >
        En proceso
      </FiltroBtn>
      <FiltroBtn
        activo={filtroEstado === 'CERRADO'}
        onClick={() => onEstado('CERRADO')}
      >
        Cerrado
      </FiltroBtn>
    </div>
  );
}

// Boton de filtro reutilizable. Cuando esta activo usa el negro de marca.
function FiltroBtn({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-xs transition ${
        activo
          ? 'text-white'
          : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
      }`}
      style={activo ? { backgroundColor: 'var(--key-dark)' } : undefined}
    >
      {children}
    </button>
  );
}