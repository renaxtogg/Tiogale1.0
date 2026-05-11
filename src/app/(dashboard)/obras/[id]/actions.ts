"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/** Deletes the obra and all its cascaded data, then redirects to the list. */
export async function deleteObra(obraId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("obras").delete().eq("id", obraId);
  revalidatePath("/obras");
  redirect("/obras");
}

/** Deletes a gasto and returns to the obra detail page. */
export async function deleteGasto(gastoId: string, obraId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("gastos").delete().eq("id", gastoId);
  revalidatePath(`/obras/${obraId}`);
  redirect(`/obras/${obraId}`);
}

/** Deletes a certificacion and returns to the obra detail page. */
export async function deleteCertificacion(certId: string, obraId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("certificaciones").delete().eq("id", certId);
  revalidatePath(`/obras/${obraId}`);
  redirect(`/obras/${obraId}`);
}
