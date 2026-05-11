import type { ResumenFinanciero } from '@/types';

// ─── Monetary helpers ─────────────────────────────────────────────────────────

/** Round to 2 decimal places to avoid floating-point drift */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Aggregation primitives ───────────────────────────────────────────────────

export function calcularTotalGastos(gastos: { monto: number | string }[]): number {
  return round2(gastos.reduce((acc, g) => acc + Number(g.monto), 0));
}

/**
 * Only counts certifications that are NOT in draft (borrador).
 * Drafts don't affect the financial position.
 */
export function calcularTotalCertificado(
  certs: { monto: number | string; estado: string }[]
): number {
  return round2(
    certs
      .filter((c) => c.estado !== 'borrador')
      .reduce((acc, c) => acc + Number(c.monto), 0)
  );
}

// ─── Project financial summary ────────────────────────────────────────────────

export function calcularResumenFinanciero(
  obra: { presupuesto_aprobado: number | string },
  gastos: { monto: number | string }[],
  certificaciones: { monto: number | string; estado: string }[]
): ResumenFinanciero {
  const presupuesto     = Number(obra.presupuesto_aprobado);
  const total_gastos    = calcularTotalGastos(gastos);
  const total_cert      = calcularTotalCertificado(certificaciones);
  const resultado       = round2(total_cert - total_gastos);
  const desviacion      = round2(total_gastos - presupuesto);
  const margen          = presupuesto > 0
    ? round2((resultado / presupuesto) * 100)
    : 0;

  return {
    presupuesto_aprobado: presupuesto,
    total_gastos,
    total_certificado: total_cert,
    resultado,
    desviacion_vs_presup: desviacion,
    margen_porcentaje: margen,
  };
}

// ─── Budget vs actual comparison by category ─────────────────────────────────

type GastoPorCategoria = { categoria: string; total: number };

export function agruparGastosPorCategoria(
  gastos: { monto: number | string; categoria: string }[]
): GastoPorCategoria[] {
  const map = new Map<string, number>();
  for (const g of gastos) {
    map.set(g.categoria, (map.get(g.categoria) ?? 0) + Number(g.monto));
  }
  return Array.from(map.entries())
    .map(([categoria, total]) => ({ categoria, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}

// ─── Certification coverage ───────────────────────────────────────────────────

/**
 * Returns how much of the approved budget has been certified (0–100+).
 * Values over 100 indicate over-certification (only possible on 'abierto' contracts).
 */
export function calcularPorcentajeCertificado(
  presupuesto: number,
  totalCertificado: number
): number {
  if (presupuesto <= 0) return 0;
  return round2((totalCertificado / presupuesto) * 100);
}

// ─── Fixed-price cap validation ───────────────────────────────────────────────

/**
 * For a 'cerrado' contract, returns how much budget remains available to certify.
 * Returns Infinity for 'abierto' contracts (no cap).
 */
export function calcularCapacidadCertificacion(
  obra: { tipo_contrato: string; presupuesto_aprobado: number | string },
  certificacionesExistentes: { monto: number | string; estado: string }[]
): number {
  if (obra.tipo_contrato === 'abierto') return Infinity;
  const usado = calcularTotalCertificado(certificacionesExistentes);
  return round2(Number(obra.presupuesto_aprobado) - usado);
}

// ─── Dashboard-level aggregations ─────────────────────────────────────────────

type DashboardStats = {
  totalObrasActivas:   number;
  totalGastos:         number;
  totalCertificado:    number;
  resultadoGlobal:     number;
};

export function calcularStatsDashboard(obras: {
  estado:               string;
  gastos?:              { monto: number }[];
  certificaciones?:     { monto: number; estado: string }[];
}[]): DashboardStats {
  let totalObrasActivas = 0;
  let totalGastos       = 0;
  let totalCertificado  = 0;

  for (const obra of obras) {
    if (obra.estado === 'active') totalObrasActivas++;
    totalGastos     += (obra.gastos ?? []).reduce((s, g) => s + Number(g.monto), 0);
    totalCertificado += (obra.certificaciones ?? [])
      .filter((c) => c.estado !== 'borrador')
      .reduce((s, c) => s + Number(c.monto), 0);
  }

  return {
    totalObrasActivas,
    totalGastos:      round2(totalGastos),
    totalCertificado: round2(totalCertificado),
    resultadoGlobal:  round2(totalCertificado - totalGastos),
  };
}
