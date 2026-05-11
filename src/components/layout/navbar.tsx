"use client";

import { usePathname } from "next/navigation";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { signOut } from "@/lib/supabase/actions";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Maps route paths to human-readable page titles
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/obras": "Obras",
  "/presupuestos": "Presupuestos",
  "/gastos": "Gastos",
  "/certificaciones": "Certificaciones",
  "/entidades": "Entidades",
};

interface NavbarProps {
  user: SupabaseUser | null;
}

function getInitials(email: string | undefined) {
  if (!email) return "U";
  return email.slice(0, 2).toUpperCase();
}

function getPageTitle(pathname: string) {
  // Find the best matching prefix
  const match = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key));
  return match ? PAGE_TITLES[match] : "ConstruERP";
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      {/* Mobile sidebar trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navegación</SheetTitle>
          </SheetHeader>
          <Sidebar className="h-full" />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <h1 className="text-lg font-semibold">{title}</h1>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
