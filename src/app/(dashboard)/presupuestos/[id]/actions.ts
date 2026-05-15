"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { required, positiveNumber, nonNegativeNumber, collectErrors } from "@/lib/validations";
import { calcularAcuTotal } from "@/lib/budget";
import type { FormState, TipoEjecucion, TipoItem } from "@/types";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function revalidatePresupuesto(presupuestoId: string) {
  revalidatePath(`/presupuestos/${presupuestoId}`);
  revalidatePath("/presupuestos");
}

async function recalcRubroprice(rubroId: string) {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("analisis_costo_items")
    .select("cantidad, precio_unitario")
    .eq("rubro_id", rubroId);
  const newPrice = calcularAcuTotal(items ?? []);
  await supabase.from("rubros").update({ precio_unitario: newPrice }).eq("id", rubroId);
  return newPrice;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM-BASED actions (useActionState + redirect) — used by standalone pages
// ═══════════════════════════════════════════════════════════════════════════════

export async function createCapitulo(
  presupuestoId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const codigo = formData.get("codigo") as string;
  const nombre = formData.get("nombre") as string;
  const orden  = formData.get("orden") as string;
  const fieldErrors = collectErrors({ nombre: required(nombre, "Nombre") });
  if (fieldErrors) return fieldErrors;
  const supabase = await createClient();
  const { error } = await supabase.from("capitulos").insert({
    presupuesto_id: presupuestoId,
    codigo: codigo?.trim() || null,
    nombre: nombre.trim(),
    orden:  orden ? Number(orden) : 0,
  });
  if (error) return { error: error.message };
  redirect(`/presupuestos/${presupuestoId}`);
}

export async function createRubro(
  presupuestoId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const capitulo_id    = formData.get("capitulo_id") as string;
  const codigo         = formData.get("codigo") as string;
  const nombre         = formData.get("nombre") as string;
  const unidad         = formData.get("unidad") as string;
  const cantidad_raw   = formData.get("cantidad") as string;
  const p_unit_raw     = formData.get("precio_unitario") as string;
  const tipo_ejecucion = formData.get("tipo_ejecucion") as string;
  const orden_raw      = formData.get("orden") as string;
  const fieldErrors = collectErrors({
    capitulo_id: required(capitulo_id, "Capítulo"),
    nombre:      required(nombre, "Nombre"),
    unidad:      required(unidad, "Unidad"),
    cantidad:    positiveNumber(cantidad_raw, "Cantidad"),
    precio_unitario: nonNegativeNumber(p_unit_raw || "0", "Precio unitario"),
  });
  if (fieldErrors) return fieldErrors;
  const supabase = await createClient();
  const { error } = await supabase.from("rubros").insert({
    capitulo_id,
    codigo:          codigo?.trim() || null,
    nombre:          nombre.trim(),
    unidad:          unidad.trim(),
    cantidad:        Number(cantidad_raw),
    precio_unitario: p_unit_raw ? Number(p_unit_raw) : 0,
    tipo_ejecucion:  (tipo_ejecucion || "propio") as TipoEjecucion,
    orden:           orden_raw ? Number(orden_raw) : 0,
  });
  if (error) return { error: error.message };
  redirect(`/presupuestos/${presupuestoId}`);
}

export async function deleteCapitulo(capituloId: string, presupuestoId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("capitulos").delete().eq("id", capituloId);
  revalidatePresupuesto(presupuestoId);
  redirect(`/presupuestos/${presupuestoId}`);
}

export async function deleteRubro(rubroId: string, presupuestoId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("rubros").delete().eq("id", rubroId);
  revalidatePresupuesto(presupuestoId);
  redirect(`/presupuestos/${presupuestoId}`);
}

export async function createAcuItem(
  rubroId: string,
  presupuestoId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const tipo            = formData.get("tipo") as string;
  const descripcion     = formData.get("descripcion") as string;
  const unidad          = formData.get("unidad") as string;
  const cantidad_raw    = formData.get("cantidad") as string;
  const p_unit_raw      = formData.get("precio_unitario") as string;
  const fieldErrors = collectErrors({
    descripcion:     required(descripcion, "Descripción"),
    unidad:          required(unidad, "Unidad"),
    cantidad:        positiveNumber(cantidad_raw, "Cantidad"),
    precio_unitario: nonNegativeNumber(p_unit_raw || "0", "Precio unitario"),
  });
  if (fieldErrors) return fieldErrors;
  const supabase = await createClient();
  const { error } = await supabase.from("analisis_costo_items").insert({
    rubro_id:       rubroId,
    tipo:           (tipo || "material") as TipoItem,
    descripcion:    descripcion.trim(),
    unidad:         unidad.trim(),
    cantidad:       Number(cantidad_raw),
    precio_unitario: Number(p_unit_raw),
  });
  if (error) return { error: error.message };
  await recalcRubroprice(rubroId);
  revalidatePresupuesto(presupuestoId);
  redirect(`/presupuestos/${presupuestoId}/rubros/${rubroId}`);
}

export async function deleteAcuItem(
  itemId: string,
  rubroId: string,
  presupuestoId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("analisis_costo_items").delete().eq("id", itemId);
  await recalcRubroprice(rubroId);
  revalidatePresupuesto(presupuestoId);
  redirect(`/presupuestos/${presupuestoId}/rubros/${rubroId}`);
}

export async function deletePresupuesto(presupuestoId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("presupuestos").delete().eq("id", presupuestoId);
  revalidatePath("/presupuestos");
  redirect("/presupuestos");
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE actions (return result, no redirect) — used by PresupuestoEditor
// ═══════════════════════════════════════════════════════════════════════════════

export type InlineResult = { error?: string };

export async function inlineCreateCapitulo(
  presupuestoId: string,
  data: { codigo?: string; nombre: string; orden?: number }
): Promise<InlineResult> {
  if (!data.nombre.trim()) return { error: "Nombre es requerido." };
  const supabase = await createClient();
  const { error } = await supabase.from("capitulos").insert({
    presupuesto_id: presupuestoId,
    codigo:  data.codigo?.trim() || null,
    nombre:  data.nombre.trim(),
    orden:   data.orden ?? 0,
  });
  if (error) return { error: error.message };
  revalidatePresupuesto(presupuestoId);
  return {};
}

export async function inlineUpdateCapitulo(
  capituloId: string,
  presupuestoId: string,
  data: { codigo?: string; nombre: string; orden?: number }
): Promise<InlineResult> {
  if (!data.nombre.trim()) return { error: "Nombre es requerido." };
  const supabase = await createClient();
  const { error } = await supabase.from("capitulos").update({
    codigo: data.codigo?.trim() || null,
    nombre: data.nombre.trim(),
    orden:  data.orden ?? 0,
  }).eq("id", capituloId);
  if (error) return { error: error.message };
  revalidatePresupuesto(presupuestoId);
  return {};
}

export async function inlineDeleteCapitulo(
  capituloId: string,
  presupuestoId: string
): Promise<InlineResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("capitulos").delete().eq("id", capituloId);
  if (error) return { error: error.message };
  revalidatePresupuesto(presupuestoId);
  return {};
}

export async function inlineCreateRubro(
  presupuestoId: string,
  data: {
    capitulo_id: string;
    codigo?: string;
    nombre: string;
    unidad: string;
    cantidad: number;
    precio_unitario?: number;
    tipo_ejecucion: TipoEjecucion;
    orden?: number;
    catalogo_rubro_id?: string;
    clone_acu?: boolean;
  }
): Promise<InlineResult> {
  if (!data.nombre.trim()) return { error: "Nombre es requerido." };
  if (!data.unidad.trim()) return { error: "Unidad es requerida." };
  if (data.cantidad <= 0)  return { error: "Cantidad debe ser mayor a cero." };

  const supabase = await createClient();
  const { data: rubro, error } = await supabase
    .from("rubros")
    .insert({
      capitulo_id:      data.capitulo_id,
      catalogo_rubro_id: data.catalogo_rubro_id || null,
      codigo:           data.codigo?.trim() || null,
      nombre:           data.nombre.trim(),
      unidad:           data.unidad.trim(),
      cantidad:         data.cantidad,
      precio_unitario:  data.precio_unitario ?? 0,
      tipo_ejecucion:   data.tipo_ejecucion,
      orden:            data.orden ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Clone ACU items from catalog if requested
  if (data.clone_acu && data.catalogo_rubro_id && rubro) {
    const { data: catalogAcu } = await supabase
      .from("catalogo_acu_items")
      .select("*")
      .eq("catalogo_rubro_id", data.catalogo_rubro_id);

    if (catalogAcu && catalogAcu.length > 0) {
      await supabase.from("analisis_costo_items").insert(
        catalogAcu.map((item) => ({
          rubro_id:       rubro.id,
          tipo:           item.tipo,
          descripcion:    item.descripcion,
          unidad:         item.unidad,
          cantidad:       item.cantidad,
          precio_unitario: item.precio_unitario,
        }))
      );
      // Recalculate price from cloned ACU
      const newPrice = calcularAcuTotal(catalogAcu);
      await supabase.from("rubros").update({ precio_unitario: newPrice }).eq("id", rubro.id);
    }
  }

  revalidatePresupuesto(presupuestoId);
  return {};
}

export async function inlineUpdateRubro(
  rubroId: string,
  presupuestoId: string,
  data: {
    codigo?: string;
    nombre: string;
    unidad: string;
    cantidad: number;
    precio_unitario: number;
    tipo_ejecucion: TipoEjecucion;
  }
): Promise<InlineResult> {
  if (!data.nombre.trim()) return { error: "Nombre es requerido." };
  if (data.cantidad <= 0)  return { error: "Cantidad debe ser mayor a cero." };

  const supabase = await createClient();
  const { error } = await supabase.from("rubros").update({
    codigo:          data.codigo?.trim() || null,
    nombre:          data.nombre.trim(),
    unidad:          data.unidad.trim(),
    cantidad:        data.cantidad,
    precio_unitario: data.precio_unitario,
    tipo_ejecucion:  data.tipo_ejecucion,
  }).eq("id", rubroId);
  if (error) return { error: error.message };
  revalidatePresupuesto(presupuestoId);
  return {};
}

export async function inlineDeleteRubro(
  rubroId: string,
  presupuestoId: string
): Promise<InlineResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("rubros").delete().eq("id", rubroId);
  if (error) return { error: error.message };
  revalidatePresupuesto(presupuestoId);
  return {};
}

// ─── ACU inline actions ───────────────────────────────────────────────────────

export async function inlineCreateAcuItem(
  rubroId: string,
  presupuestoId: string,
  data: {
    tipo: TipoItem;
    descripcion: string;
    unidad: string;
    cantidad: number;
    precio_unitario: number;
  }
): Promise<InlineResult> {
  if (!data.descripcion.trim()) return { error: "Descripción es requerida." };
  if (!data.unidad.trim())      return { error: "Unidad es requerida." };
  if (data.cantidad <= 0)       return { error: "Cantidad debe ser mayor a cero." };

  const supabase = await createClient();
  const { error } = await supabase.from("analisis_costo_items").insert({
    rubro_id:       rubroId,
    tipo:           data.tipo,
    descripcion:    data.descripcion.trim(),
    unidad:         data.unidad.trim(),
    cantidad:       data.cantidad,
    precio_unitario: data.precio_unitario,
  });
  if (error) return { error: error.message };
  await recalcRubroprice(rubroId);
  revalidatePath(`/presupuestos/${presupuestoId}/rubros/${rubroId}`);
  revalidatePresupuesto(presupuestoId);
  return {};
}

export async function inlineUpdateAcuItem(
  itemId: string,
  rubroId: string,
  presupuestoId: string,
  data: {
    tipo: TipoItem;
    descripcion: string;
    unidad: string;
    cantidad: number;
    precio_unitario: number;
  }
): Promise<InlineResult> {
  if (!data.descripcion.trim()) return { error: "Descripción es requerida." };

  const supabase = await createClient();
  const { error } = await supabase.from("analisis_costo_items").update({
    tipo:            data.tipo,
    descripcion:     data.descripcion.trim(),
    unidad:          data.unidad.trim(),
    cantidad:        data.cantidad,
    precio_unitario: data.precio_unitario,
  }).eq("id", itemId);
  if (error) return { error: error.message };
  await recalcRubroprice(rubroId);
  revalidatePath(`/presupuestos/${presupuestoId}/rubros/${rubroId}`);
  revalidatePresupuesto(presupuestoId);
  return {};
}

export async function inlineDeleteAcuItem(
  itemId: string,
  rubroId: string,
  presupuestoId: string
): Promise<InlineResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("analisis_costo_items").delete().eq("id", itemId);
  if (error) return { error: error.message };
  await recalcRubroprice(rubroId);
  revalidatePath(`/presupuestos/${presupuestoId}/rubros/${rubroId}`);
  revalidatePresupuesto(presupuestoId);
  return {};
}
