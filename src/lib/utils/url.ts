/**
 * Returns the canonical app URL for use in server-side code (e.g. emailRedirectTo).
 * Priority: explicit env override → Vercel auto-provided URL → localhost dev default.
 *
 * VERCEL_URL is provided by the Vercel runtime on every deployment and is server-only
 * (no NEXT_PUBLIC_ prefix needed since this file is only imported from server code).
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
