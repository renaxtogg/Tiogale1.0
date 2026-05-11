"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Metadata } from "next";

// Note: metadata must be exported from a Server Component.
// For client pages, set it in a parent layout or a parallel route.

const initialState = { error: undefined };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">
          Ingrese sus credenciales para acceder al sistema.
        </p>
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nombre@empresa.com"
            autoComplete="email"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tiene una cuenta?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Registrarse
        </Link>
      </p>
    </div>
  );
}
