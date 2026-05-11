import { redirect } from "next/navigation";

// Root route redirects based on auth state.
// The middleware handles the actual auth check; this is just a clean entry point.
export default function RootPage() {
  redirect("/dashboard");
}
