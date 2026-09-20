/**
 * Los precios se guardan como enteros en pesos colombianos (COP).
 * Ej: 389000 === $389.000. Nunca usamos decimales para evitar
 * errores de redondeo con floats.
 */

export function formatCOP(pesos: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(pesos);
}

/** Wompi siempre recibe el monto en centavos. */
export function toCents(pesos: number): number {
  return Math.round(pesos * 100);
}
