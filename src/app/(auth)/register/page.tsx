"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

const initialState = { error: undefined };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Complete el formulario para registrarse en el sistema.
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
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repita su contraseña"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Registrando..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tiene una cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
