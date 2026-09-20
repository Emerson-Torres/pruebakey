import type { CaseStatus, CaseType } from '../lib/types';
import { estadoBadge, estadoLabel, tipoBadge, tipoLabel } from '../lib/ui';

// Badge para el estado de un caso (Abierto / En proceso / Cerrado).
export function EstadoBadge({ estado }: { estado: CaseStatus }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estadoBadge(
        estado,
      )}`}
    >
      {estadoLabel(estado)}
    </span>
  );
}

// Badge para el tipo de un caso (Consulta / Reclamo).
export function TipoBadge({ tipo }: { tipo: CaseType }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tipoBadge(
        tipo,
      )}`}
    >
      {tipoLabel(tipo)}
    </span>
  );
}