'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCase, updateCaseStatus } from '../../lib/api';
import type { CaseWithMessages, CaseStatus } from '../../lib/types';
import { Header } from '../../components/Header';
import { EstadoBadge, TipoBadge } from '../../components/Badge';
import { MessageThread } from '../../components/MessageThread';
import { CaseStatusControl } from '../../components/CaseStatusControl';
import { formatFecha } from '../../lib/ui';

export default function DetalleCaso() {
  // useParams lee el [id] de la URL (/casos/:id).
  const params = useParams();
  const id = params.id as string;

  const [caso, setCaso] = useState<CaseWithMessages | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Carga el caso al montar la pagina (y cuando cambia el id).
  useEffect(() => {
    setCargando(true);
    setError(null);
    getCase(id)
      .then(setCaso)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  // Maneja el cambio de estado: llama a la API y refresca el caso en pantalla.
  async function cambiarEstado(nuevo: CaseStatus) {
    setGuardando(true);
    setError(null);
    try {
      await updateCaseStatus(id, nuevo);
      // Volvemos a pedir el caso para reflejar el estado actualizado.
      const actualizado = await getCase(id);
      setCaso(actualizado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-3xl p-6">
        {/* Enlace para volver a la lista */}
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-gray-500 hover:underline"
        >
          ← Volver a la lista
        </Link>

        {cargando && <p className="text-gray-500">Cargando caso…</p>}

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-red-700">{error}</p>
        )}

        {!cargando && caso && (
          <>
            {/* Encabezado del caso */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {caso.telefono}
                  </h1>
                  <p className="text-xs text-gray-400">
                    Caso #{caso.id.slice(-6)} · creado {formatFecha(caso.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <TipoBadge tipo={caso.tipo} />
                  <EstadoBadge estado={caso.estado} />
                </div>
              </div>

              {/* Control de cambio de estado */}
              <div className="border-t border-gray-100 pt-3">
                <CaseStatusControl
                  estadoActual={caso.estado}
                  onCambiar={cambiarEstado}
                  guardando={guardando}
                />
              </div>
            </div>

            {/* Hilo de mensajes */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-medium text-gray-600">
                Hilo de mensajes
              </h2>
              <MessageThread mensajes={caso.mensajes} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}