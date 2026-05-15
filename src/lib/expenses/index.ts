import { round2 } from '@/lib/calculations';
import type { GastoRow, CategoriaGasto } from '@/types';

// ─── Aggregations ─────────────────────────────────────────────────────────────

export function totalGastos(gastos: Pick<GastoRow, 'monto'>[]): number {
  return round2(gastos.reduce((sum, g) => sum + Number(g.monto), 0));
}

export function gastosPorCategoria(
  gastos: Pick<GastoRow, 'monto' | 'categoria'>[]
): { categoria: CategoriaGasto; total: number }[] {
  const map = new Map<string, number>();
  for (const g of gastos) {
    map.set(g.categoria, (map.get(g.categoria) ?? 0) + Number(g.monto));
  }
  return Array.from(map.entries())
    .map(([categoria, total]) => ({ categoria: categoria as CategoriaGasto, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}

export function gastosPorRubro(
  gastos: Pick<GastoRow, 'monto' | 'rubro_id'>[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const g of gastos) {
    if (!g.rubro_id) continue;
    map.set(g.rubro_id, round2((map.get(g.rubro_id) ?? 0) + Number(g.monto)));
  }
  return map;
}

export function gastosPorObra(
  gastos: Pick<GastoRow, 'monto' | 'obra_id'>[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const g of gastos) {
    map.set(g.obra_id, round2((map.get(g.obra_id) ?? 0) + Number(g.monto)));
  }
  return map;
}

/** Derive the expense total from unit breakdown if present, otherwise use monto directly */
export function resolveGastoTotal(g: Pick<GastoRow, 'monto' | 'cantidad' | 'precio_unitario'>): number {
  if (g.cantidad != null && g.precio_unitario != null) {
    return round2(Number(g.cantidad) * Number(g.precio_unitario));
  }
  return Number(g.monto);
}
