"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { required, collectErrors } from "@/lib/validations";
import type { FormState, TipoEjecucion } from "@/types";

export async function createCatalogoRubro(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const codigo         = formData.get("codigo") as string;
  const nombre         = formData.get("nombre") as string;
  const unidad         = formData.get("unidad") as string;
  const tipo_ejecucion = formData.get("tipo_ejecucion") as string;

  const fieldErrors = collectErrors({
    nombre: required(nombre, "Nombre"),
    unidad: required(unidad, "Unidad"),
  });
  if (fieldErrors) return fieldErrors;

  const supabase = await createClient();
  const { error } = await supabase.from("catalogo_rubros").insert({
    codigo:          codigo?.trim() || null,
    nombre:          nombre.trim(),
    unidad:          unidad.trim(),
    tipo_ejecucion:  (tipo_ejecucion || "propio") as TipoEjecucion,
  });

  if (error) return { error: error.message };
  revalidatePath("/catalogo");
  redirect("/catalogo");
}

export async function deleteCatalogoRubro(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("catalogo_rubros").delete().eq("id", id);
  revalidatePath("/catalogo");
  redirect("/catalogo");
}

export async function toggleCatalogoRubroActivo(id: string, activo: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("catalogo_rubros").update({ activo }).eq("id", id);
  revalidatePath("/catalogo");
}
