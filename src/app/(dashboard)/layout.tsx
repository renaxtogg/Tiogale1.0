import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

/**
 * Dashboard shell — fetches the authenticated user server-side and passes it
 * to the Navbar. Middleware already guards these routes; this fetch is for
 * displaying user data, not for auth protection.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Desktop sidebar — hidden on mobile (mobile uses Sheet in Navbar) */}
      <div className="hidden lg:flex lg:flex-col lg:shrink-0">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar user={user} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
