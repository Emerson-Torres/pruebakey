import type { Message } from '../lib/types';
import { formatFecha } from '../lib/ui';

export function MessageThread({ mensajes }: { mensajes: Message[] }) {
  if (mensajes.length === 0) {
    return <p className="text-sm text-gray-500">Este caso no tiene mensajes.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {mensajes.map((msg) => (
        <MessageBubble key={msg.id} mensaje={msg} />
      ))}
    </div>
  );
}

// Una burbuja de mensaje. Los entrantes (del usuario) van a la izquierda;
// los salientes (del bot) a la derecha, con el color de marca.
function MessageBubble({ mensaje }: { mensaje: Message }) {
  const esEntrante = mensaje.direccion === 'INBOUND';

  return (
    <div className={`flex ${esEntrante ? 'justify-start' : 'justify-end'}`}>
      <div className="max-w-[80%]">
        <div
          className={`rounded-xl px-3 py-2 text-sm ${
            esEntrante ? 'border border-gray-200 bg-white text-gray-800' : 'text-white'
          }`}
          style={esEntrante ? undefined : { backgroundColor: 'var(--key-dark)' }}
        >
          {mensaje.texto}
        </div>
        <div
          className={`mt-1 text-[11px] text-gray-400 ${
            esEntrante ? 'text-left' : 'text-right'
          }`}
        >
          {esEntrante ? 'Entrante' : 'Saliente'} · {formatFecha(mensaje.createdAt)}
          {/* Para los salientes mostramos el estado de envio (5.3) */}
          {!esEntrante && mensaje.estado && (
            <> · {estadoEnvioLabel(mensaje.estado)}</>
          )}
        </div>
      </div>
    </div>
  );
}

// Traduce el estado de envio del mensaje a algo legible.
function estadoEnvioLabel(estado: string): string {
  switch (estado) {
    case 'SENT':
      return 'enviado';
    case 'PENDING':
      return 'pendiente';
    case 'FAILED':
      return 'falló el envío';
    default:
      return estado.toLowerCase();
  }
}