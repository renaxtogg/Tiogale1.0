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
    if (error.message === "Email not confirmed") {
      return {
        error:
          "Su email no ha sido confirmado. Revise su bandeja de entrada o solicite un nuevo enlace.",
        code: "email_not_confirmed",
      };
    }
    return { error: "Credenciales incorrectas. Verifique su email y contraseña." };
  }

  redirect("/dashboard");
}

export async function resendConfirmation(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Ingrese su email para reenviar el enlace de confirmación." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    return { error: "No se pudo reenviar el enlace. Intente nuevamente." };
  }

  return { success: "Enlace de confirmación enviado. Revise su bandeja de entrada." };
}
