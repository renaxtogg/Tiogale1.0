import type { ObraRow, CertificacionRow, FormState } from '@/types';
import { calcularTotalCertificado } from '@/lib/calculations';

// ─── Certification business rules ─────────────────────────────────────────────

/**
 * Validates whether a new certification amount is allowed for a given project.
 *
 * FIXED-PRICE (cerrado):
 *   The sum of all approved/collected certifications + new amount
 *   CANNOT exceed the approved budget.
 *
 * ADJUSTABLE (abierto):
 *   No cap — certifications can exceed the original budget.
 */
export function validarMontoCertificacion(
  obra: Pick<ObraRow, 'tipo_contrato' | 'presupuesto_aprobado' | 'nombre'>,
  certExistentes: Pick<CertificacionRow, 'monto' | 'estado'>[],
  nuevoMonto: number
): { valid: true } | { valid: false; error: string } {
  if (nuevoMonto <= 0) {
    return { valid: false, error: 'El monto debe ser mayor a cero.' };
  }

  if (obra.tipo_contrato === 'abierto') {
    return { valid: true };
  }

  // Fixed-price: check cap
  const yaUsado    = calcularTotalCertificado(certExistentes);
  const disponible = Number(obra.presupuesto_aprobado) - yaUsado;

  if (nuevoMonto > disponible) {
    const fmt = (n: number) =>
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

    return {
      valid: false,
      error:
        `Contrato de precio cerrado. El presupuesto disponible es ${fmt(disponible)} ` +
        `(presupuesto ${fmt(Number(obra.presupuesto_aprobado))} − ya certificado ${fmt(yaUsado)}). ` +
        `Para superar este límite cambie el contrato a "Ajustable".`,
    };
  }

  return { valid: true };
}

// ─── Generic field validators ──────────────────────────────────────────────────

export function required(value: unknown, fieldName: string): string | undefined {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${fieldName} es requerido.`;
  }
}

export function positiveNumber(
  value: unknown,
  fieldName: string
): string | undefined {
  const n = Number(value);
  if (isNaN(n) || n <= 0) {
    return `${fieldName} debe ser un número mayor a cero.`;
  }
}

export function nonNegativeNumber(
  value: unknown,
  fieldName: string
): string | undefined {
  const n = Number(value);
  if (isNaN(n) || n < 0) {
    return `${fieldName} debe ser un número igual o mayor a cero.`;
  }
}

// ─── Collect field errors into FormState ──────────────────────────────────────

type ValidationMap = Record<string, string | undefined>;

/**
 * Returns a FormState with fieldErrors if any validations failed,
 * otherwise returns null (all good).
 */
export function collectErrors(validations: ValidationMap): FormState | null {
  const errors: Record<string, string> = {};
  for (const [field, error] of Object.entries(validations)) {
    if (error) errors[field] = error;
  }
  if (Object.keys(errors).length === 0) return null;
  return { fieldErrors: errors };
}
