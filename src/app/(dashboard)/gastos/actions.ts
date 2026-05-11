"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { required, positiveNumber, collectErrors } from "@/lib/validations";
import type { FormState, CategoriaGasto } from "@/types";

export async function createGasto(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const obra_id     = formData.get("obra_id") as string;
  const categoria   = formData.get("categoria") as string;
  const descripcion = formData.get("descripcion") as string;
  const monto_raw   = formData.get("monto") as string;
  const fecha       = formData.get("fecha") as string;
  const entidad_id  = formData.get("entidad_id") as string;
  const comprobante = formData.get("comprobante") as string;

  const fieldErrors = collectErrors({
    obra_id:     required(obra_id, "Obra"),
    categoria:   required(categoria, "Categoría"),
    descripcion: required(descripcion, "Descripción"),
    monto:       positiveNumber(monto_raw, "Monto"),
    fecha:       required(fecha, "Fecha"),
  });
  if (fieldErrors) return fieldErrors;

  const supabase = await createClient();
  const { error } = await supabase.from("gastos").insert({
    obra_id,
    categoria:   categoria as CategoriaGasto,
    descripcion: descripcion.trim(),
    monto:       Number(monto_raw),
    fecha,
    entidad_id:  entidad_id || null,
    comprobante: comprobante?.trim() || null,
  });

  if (error) return { error: error.message };
  redirect("/gastos");
}

export async function deleteGasto(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("gastos").delete().eq("id", id);
  revalidatePath("/gastos");
  redirect("/gastos");
}
