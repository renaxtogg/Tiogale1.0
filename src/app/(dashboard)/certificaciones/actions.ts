"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { required, positiveNumber, collectErrors } from "@/lib/validations";
import { validarMontoCertificacion } from "@/lib/validations";
import type { FormState, TipoCert, EstadoCert } from "@/types";

export async function createCertificacion(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const obra_id           = formData.get("obra_id") as string;
  const tipo              = formData.get("tipo") as string;
  const estado            = formData.get("estado") as string;
  const monto_raw         = formData.get("monto") as string;
  const porcentaje_raw    = formData.get("porcentaje_avance") as string;
  const fecha             = formData.get("fecha") as string;
  const observaciones     = formData.get("observaciones") as string;

  const fieldErrors = collectErrors({
    obra_id: required(obra_id, "Obra"),
    tipo:    required(tipo, "Tipo"),
    monto:   positiveNumber(monto_raw, "Monto"),
    fecha:   required(fecha, "Fecha"),
  });
  if (fieldErrors) return fieldErrors;

  const supabase = await createClient();

  // ── Business rule: fixed-price cap ────────────────────────────────────────
  const { data: obra, error: obraErr } = await supabase
    .from("obras")
    .select("tipo_contrato, presupuesto_aprobado, nombre")
    .eq("id", obra_id)
    .single();

  if (obraErr || !obra) return { error: "No se encontró la obra seleccionada." };

  const { data: certsExistentes } = await supabase
    .from("certificaciones")
    .select("monto, estado")
    .eq("obra_id", obra_id);

  const validacion = validarMontoCertificacion(
    obra,
    certsExistentes ?? [],
    Number(monto_raw)
  );
  if (!validacion.valid) return { error: validacion.error };

  // ── Get next numero ──────────────────────────────────────────────────────
  const { count } = await supabase
    .from("certificaciones")
    .select("*", { count: "exact", head: true })
    .eq("obra_id", obra_id);

  const { error } = await supabase.from("certificaciones").insert({
    obra_id,
    numero:            (count ?? 0) + 1,
    tipo:              tipo as TipoCert,
    estado:            (estado || "borrador") as EstadoCert,
    monto:             Number(monto_raw),
    porcentaje_avance: porcentaje_raw ? Number(porcentaje_raw) : null,
    fecha,
    observaciones:     observaciones?.trim() || null,
  });

  if (error) return { error: error.message };
  redirect("/certificaciones");
}

export async function updateEstadoCertificacion(
  id: string,
  nuevoEstado: EstadoCert
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("certificaciones")
    .update({
      estado:           nuevoEstado,
      fecha_aprobacion: nuevoEstado === "aprobada" ? new Date().toISOString().slice(0, 10) : undefined,
      fecha_cobro:      nuevoEstado === "cobrada"  ? new Date().toISOString().slice(0, 10) : undefined,
    })
    .eq("id", id);
  revalidatePath("/certificaciones");
}

export async function deleteCertificacion(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("certificaciones").delete().eq("id", id);
  revalidatePath("/certificaciones");
  redirect("/certificaciones");
}
