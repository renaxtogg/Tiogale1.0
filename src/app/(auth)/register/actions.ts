"use server";

import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/url";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

export async function signUp(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return { error: "Todos los campos son requeridos." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppUrl()}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Session present → Supabase auto-confirmed (e.g. email confirmation disabled).
  // No session → confirmation email sent; redirect to a holding page.
  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/register/verify-email");
}
