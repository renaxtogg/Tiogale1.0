import { round2 } from '@/lib/calculations';
import type { RubroConAcu, ComparacionRubro, ComparacionPresupuesto } from '@/types';

// ─── Rubro-level comparison ───────────────────────────────────────────────────

/**
 * Compare budgeted subtotal vs accumulated real expenses for one rubro.
 * diferencia > 0 means under budget (profit potential).
 * diferencia < 0 means over budget (loss).
 */
export function compararRubro(
  rubro: RubroConAcu,
  gastoReal: number
): ComparacionRubro {
  const presupuestado  = rubro.subtotal;
  const diferencia     = round2(presupuestado - gastoReal);
  const desviacion_pct = presupuestado > 0
    ? round2(((gastoReal - presupuestado) / presupuestado) * 100)
    : 0;

  return {
    rubro_id:       rubro.id,
    rubro_nombre:   rubro.nombre,
    presupuestado,
    real:           round2(gastoReal),
    diferencia,
    desviacion_pct,
  };
}

// ─── Presupuesto-level comparison ────────────────────────────────────────────

/**
 * Compare the full budget against all real expenses for the same obra.
 * gastosPorRubroId: Map<rubro_id, total_real_expenses>
 */
export function compararPresupuesto(
  presupuestoId: string,
  obraNombre: string,
  totalPresup: number,
  rubros: RubroConAcu[],
  gastosPorRubroId: Map<string, number>,
  totalReal: number
): ComparacionPresupuesto {
  const diferencia    = round2(totalPresup - totalReal);
  const desviacion_pct = totalPresup > 0
    ? round2(((totalReal - totalPresup) / totalPresup) * 100)
    : 0;

  const rubrosComparados = rubros.map((r) =>
    compararRubro(r, gastosPorRubroId.get(r.id) ?? 0)
  );

  return {
    presupuesto_id: presupuestoId,
    obra_nombre:    obraNombre,
    total_presup:   totalPresup,
    total_real:     round2(totalReal),
    diferencia,
    desviacion_pct,
    rubros:         rubrosComparados,
  };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

/** Returns 'ganancia', 'perdida', or 'equilibrio' based on diferencia sign */
export function resultadoLabel(diferencia: number): 'ganancia' | 'perdida' | 'equilibrio' {
  if (diferencia > 0)  return 'ganancia';
  if (diferencia < 0)  return 'perdida';
  return 'equilibrio';
}

/** Colour class for a diferencia value */
export function diferenciaColorClass(diferencia: number): string {
  if (diferencia > 0) return 'text-emerald-600';
  if (diferencia < 0) return 'text-destructive';
  return 'text-muted-foreground';
}
