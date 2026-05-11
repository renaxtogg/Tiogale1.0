"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

export async function signIn(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Credenciales incorrectas. Verifique su email y contraseña." };
  }

  redirect("/dashboard");
}
