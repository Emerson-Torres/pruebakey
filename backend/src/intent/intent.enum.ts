// Catalogo de intenciones que el bot sabe detectar.
// Usar un enum (en vez de strings sueltos) evita errores de tipeo
// y deja que TypeScript valide que solo se usen estos valores.
export enum Intencion {
  FECHAS_CICLOS = 'FECHAS_CICLOS',
  FECHAS_PAGO = 'FECHAS_PAGO',
  INSCRIPCION = 'INSCRIPCION',
  ADMISIONES = 'ADMISIONES',
  RECLAMO = 'RECLAMO',
  DESCONOCIDA = 'DESCONOCIDA', // fallback cuando no coincide ninguna
}