// Contrato que debe cumplir cualquier proveedor de mensajeria.
// El resto del sistema depende de esta interfaz, no de una
// implementacion concreta (Twilio, log, etc.). Asi se puede cambiar
// de proveedor sin tocar el codigo que lo usa.
export interface MessagingProvider {
  // Envia un mensaje de texto a un numero. Devuelve una promesa que
  // se resuelve si el envio fue exitoso, o se rechaza si fallo.
  enviar(telefono: string, texto: string): Promise<void>;
}

// Token de inyeccion: como las interfaces de TypeScript no existen en
// tiempo de ejecucion, Nest necesita este simbolo como "nombre" bajo
// el cual registrar e inyectar la implementacion concreta.
export const MESSAGING_PROVIDER = Symbol('MESSAGING_PROVIDER');