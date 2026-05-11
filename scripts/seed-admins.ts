/**
 * One-time admin user seeder.
 * Run with: npx tsx scripts/seed-admins.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uses the Supabase Admin API — service role key stays server-side only.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMINS = [
  { email: "mancuellorenato@gmail.com", password: "mancuellorenato" },
  { email: "josuepereira@gmail.com", password: "josuepereira" },
];

async function seed() {
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const existingEmails = new Set(users.map((u) => u.email));

  for (const { email, password } of ADMINS) {
    if (existingEmails.has(email)) {
      console.log(`⏭  ${email} already exists — skipping`);
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });

    if (error) {
      console.error(`✗  Failed to create ${email}:`, error.message);
    } else {
      console.log(`✓  Created admin: ${email} (id: ${data.user.id})`);
    }
  }
}

seed().catch(console.error);
