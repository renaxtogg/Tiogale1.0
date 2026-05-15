"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { required, collectErrors } from "@/lib/validations";
import type { FormState } from "@/types";

export async function createPresupuesto(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const obra_id = formData.get("obra_id") as string;
  const nombre  = formData.get("nombre") as string;
  const notas   = formData.get("notas") as string;

  const fieldErrors = collectErrors({
    obra_id: required(obra_id, "Obra"),
    nombre:  required(nombre,  "Nombre"),
  });
  if (fieldErrors) return fieldErrors;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .insert({
      obra_id,
      nombre:  nombre.trim(),
      notas:   notas?.trim() || null,
      version: 1,
      estado:  "borrador",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  redirect(`/presupuestos/${data.id}`);
}
