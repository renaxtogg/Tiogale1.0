"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Receipt,
  Award,
  Users,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/obras", label: "Obras", icon: FolderOpen },
  { href: "/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/certificaciones", label: "Certificaciones", icon: Award },
  { href: "/entidades", label: "Entidades", icon: Users },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col bg-background border-r border-border",
        className
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border shrink-0">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">ConstruERP</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Módulos
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-4">
        <p className="text-xs text-muted-foreground text-center">
          ConstruERP v0.1.0
        </p>
      </div>
    </aside>
  );
}
