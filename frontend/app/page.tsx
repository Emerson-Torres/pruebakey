'use client';

import { useEffect, useState } from 'react';
import { getCases } from './lib/api';
import type { Case, CaseType, CaseStatus } from './lib/types';
import { Header } from './components/Header';
import { CaseFilters } from './components/CaseFilters';
import { CaseTable } from './components/CaseTable';

export default function PanelCasos() {
  const [casos, setCasos] = useState<Case[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<CaseType | undefined>();
  const [filtroEstado, setFiltroEstado] = useState<CaseStatus | undefined>();

  // Recarga los casos cada vez que cambia un filtro.
  useEffect(() => {
    setCargando(true);
    setError(null);
    getCases({ tipo: filtroTipo, estado: filtroEstado })
      .then(setCasos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [filtroTipo, filtroEstado]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Casos de atención
          </h1>
          {!cargando && !error && (
            <span className="text-xs text-gray-400">
              {casos.length} {casos.length === 1 ? 'caso' : 'casos'}
            </span>
          )}
        </div>

        <CaseFilters
          filtroTipo={filtroTipo}
          filtroEstado={filtroEstado}
          onTipo={setFiltroTipo}
          onEstado={setFiltroEstado}
        />

        {cargando && <p className="text-gray-500">Cargando casos…</p>}

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-red-700">
            No se pudieron cargar los casos: {error}
          </p>
        )}

        {!cargando && !error && casos.length === 0 && (
          <p className="text-gray-500">No hay casos para estos filtros.</p>
        )}

        {!cargando && !error && casos.length > 0 && (
          <CaseTable casos={casos} />
        )}
      </main>
    </div>
  );
}