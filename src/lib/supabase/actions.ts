"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Signs the current user out and redirects to /login.
 * Call this from a <form action={signOut}> in any Server or Client Component.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
