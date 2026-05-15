import { round2 } from '@/lib/calculations';
import type {
  AnalisisCostoItemRow,
  RubroRow,
  CapituloRow,
  AcuItemConSubtotal,
  RubroConAcu,
  CapituloConRubros,
} from '@/types';

// ─── ACU (Análisis de Costo Unitario) ────────────────────────────────────────

/** subtotal for a single ACU item */
export function acuItemSubtotal(item: Pick<AnalisisCostoItemRow, 'cantidad' | 'precio_unitario'>): number {
  return round2(Number(item.cantidad) * Number(item.precio_unitario));
}

/** Sum of all ACU item subtotals → becomes the rubro's unit price */
export function calcularAcuTotal(items: Pick<AnalisisCostoItemRow, 'cantidad' | 'precio_unitario'>[]): number {
  return round2(items.reduce((sum, i) => sum + acuItemSubtotal(i), 0));
}

export function enrichAcuItems(items: AnalisisCostoItemRow[]): AcuItemConSubtotal[] {
  return items.map((i) => ({ ...i, subtotal: acuItemSubtotal(i) }));
}

// ─── Rubro ────────────────────────────────────────────────────────────────────

/** subtotal for a single rubro = cantidad * precio_unitario */
export function rubroSubtotal(rubro: Pick<RubroRow, 'cantidad' | 'precio_unitario'>): number {
  return round2(Number(rubro.cantidad) * Number(rubro.precio_unitario));
}

export function enrichRubros(
  rubros: RubroRow[],
  acuByRubroId: Map<string, AnalisisCostoItemRow[]>
): RubroConAcu[] {
  return rubros.map((r) => {
    const items     = acuByRubroId.get(r.id) ?? [];
    const enriched  = enrichAcuItems(items);
    const acu_total = calcularAcuTotal(items);
    return {
      ...r,
      subtotal:             rubroSubtotal(r),
      acu_total,
      analisis_costo_items: enriched,
    };
  });
}

// ─── Capítulo ─────────────────────────────────────────────────────────────────

/** Sum of all rubro subtotals in a chapter */
export function calcularSubtotalCapitulo(rubros: Pick<RubroRow, 'cantidad' | 'precio_unitario'>[]): number {
  return round2(rubros.reduce((sum, r) => sum + rubroSubtotal(r), 0));
}

export function enrichCapitulos(
  capitulos: CapituloRow[],
  rubrosByCapituloId: Map<string, RubroConAcu[]>
): CapituloConRubros[] {
  return capitulos.map((c) => {
    const rubros = rubrosByCapituloId.get(c.id) ?? [];
    return {
      ...c,
      subtotal: calcularSubtotalCapitulo(rubros),
      rubros,
    };
  });
}

// ─── Presupuesto total ────────────────────────────────────────────────────────

/** Total of all chapters in a presupuesto */
export function calcularTotalPresupuesto(capitulos: { subtotal: number }[]): number {
  return round2(capitulos.reduce((sum, c) => sum + c.subtotal, 0));
}
