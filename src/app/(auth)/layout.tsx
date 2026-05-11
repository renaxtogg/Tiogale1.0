import { Building2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Building2 className="h-7 w-7" />
          <span className="text-xl font-semibold">ConstruERP</span>
        </div>
        <blockquote className="space-y-2">
          <p className="text-lg italic">
            &ldquo;Gestiona tus obras, presupuestos y certificaciones en un solo
            lugar.&rdquo;
          </p>
          <footer className="text-sm opacity-80">Sistema de gestión para construcción</footer>
        </blockquote>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">ConstruERP</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
