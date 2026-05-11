"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { required, collectErrors } from "@/lib/validations";
import type { FormState, TipoEntidad } from "@/types";

export async function createEntidad(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const nombre    = formData.get("nombre") as string;
  const tipo      = formData.get("tipo") as string;
  const cuit      = formData.get("cuit") as string;
  const email     = formData.get("email") as string;
  const telefono  = formData.get("telefono") as string;
  const direccion = formData.get("direccion") as string;

  const fieldErrors = collectErrors({
    nombre: required(nombre, "Nombre"),
    tipo:   required(tipo, "Tipo"),
  });
  if (fieldErrors) return fieldErrors;

  const supabase = await createClient();
  const { error } = await supabase.from("entidades").insert({
    nombre:    nombre.trim(),
    tipo:      tipo as TipoEntidad,
    cuit:      cuit?.trim() || null,
    email:     email?.trim() || null,
    telefono:  telefono?.trim() || null,
    direccion: direccion?.trim() || null,
  });

  if (error) return { error: error.message };
  redirect("/entidades");
}

export async function deleteEntidad(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("entidades").delete().eq("id", id);
  revalidatePath("/entidades");
  redirect("/entidades");
}
