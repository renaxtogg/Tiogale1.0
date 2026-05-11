"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { required, nonNegativeNumber, collectErrors } from "@/lib/validations";
import type { FormState } from "@/types";

export async function createObra(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const nombre               = formData.get("nombre") as string;
  const descripcion          = formData.get("descripcion") as string;
  const tipo_contrato        = formData.get("tipo_contrato") as string;
  const estado               = formData.get("estado") as string;
  const presupuesto_raw      = formData.get("presupuesto_aprobado") as string;
  const cliente_id           = formData.get("cliente_id") as string;
  const fecha_inicio         = formData.get("fecha_inicio") as string;
  const fecha_fin_estimada   = formData.get("fecha_fin_estimada") as string;

  const fieldErrors = collectErrors({
    nombre:               required(nombre, "Nombre"),
    tipo_contrato:        required(tipo_contrato, "Tipo de contrato"),
    presupuesto_aprobado: nonNegativeNumber(presupuesto_raw, "Presupuesto"),
  });
  if (fieldErrors) return fieldErrors;

  const supabase = await createClient();
  const { error } = await supabase.from("obras").insert({
    nombre:               nombre.trim(),
    descripcion:          descripcion?.trim() || null,
    tipo_contrato:        tipo_contrato as "cerrado" | "abierto",
    estado:               (estado || "planning") as "planning",
    presupuesto_aprobado: Number(presupuesto_raw),
    cliente_id:           cliente_id || null,
    fecha_inicio:         fecha_inicio || null,
    fecha_fin_estimada:   fecha_fin_estimada || null,
  });

  if (error) return { error: error.message };

  redirect("/obras");
}

export async function updateObra(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const nombre             = formData.get("nombre") as string;
  const descripcion        = formData.get("descripcion") as string;
  const tipo_contrato      = formData.get("tipo_contrato") as string;
  const estado             = formData.get("estado") as string;
  const presupuesto_raw    = formData.get("presupuesto_aprobado") as string;
  const cliente_id         = formData.get("cliente_id") as string;
  const fecha_inicio       = formData.get("fecha_inicio") as string;
  const fecha_fin_estimada = formData.get("fecha_fin_estimada") as string;
  const fecha_fin_real     = formData.get("fecha_fin_real") as string;

  const fieldErrors = collectErrors({
    nombre:               required(nombre, "Nombre"),
    tipo_contrato:        required(tipo_contrato, "Tipo de contrato"),
    presupuesto_aprobado: nonNegativeNumber(presupuesto_raw, "Presupuesto"),
  });
  if (fieldErrors) return fieldErrors;

  const supabase = await createClient();
  const { error } = await supabase
    .from("obras")
    .update({
      nombre:               nombre.trim(),
      descripcion:          descripcion?.trim() || null,
      tipo_contrato:        tipo_contrato as "cerrado" | "abierto",
      estado:               estado as "planning",
      presupuesto_aprobado: Number(presupuesto_raw),
      cliente_id:           cliente_id || null,
      fecha_inicio:         fecha_inicio || null,
      fecha_fin_estimada:   fecha_fin_estimada || null,
      fecha_fin_real:       fecha_fin_real || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/obras/${id}`);
  revalidatePath("/obras");
  redirect(`/obras/${id}`);
}

export async function deleteObra(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("obras").delete().eq("id", id);
  revalidatePath("/obras");
  redirect("/obras");
}
