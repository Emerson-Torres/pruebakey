import Link from 'next/link';
import type { Case } from '../lib/types';
import { formatFecha } from '../lib/ui';
import { EstadoBadge, TipoBadge } from './Badge';

export function CaseTable({ casos }: { casos: Case[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-4 py-3 font-medium">Teléfono</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Intención</th>
            <th className="px-4 py-3 font-medium">Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr
              key={caso.id}
              className="border-t border-gray-100 hover:bg-gray-50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/casos/${caso.id}`}
                  className="text-gray-900 hover:underline"
                >
                  {caso.telefono}
                </Link>
              </td>
              <td className="px-4 py-3">
                <TipoBadge tipo={caso.tipo} />
              </td>
              <td className="px-4 py-3">
                <EstadoBadge estado={caso.estado} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {caso.intencion ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {formatFecha(caso.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}