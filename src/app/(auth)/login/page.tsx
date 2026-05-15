"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, resendConfirmation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";

const initialState = { error: undefined };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [resendState, resendAction, isResending] = useActionState(
    resendConfirmation,
    initialState
  );

  const emailNotConfirmed = state?.code === "email_not_confirmed";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">
          Ingrese sus credenciales para acceder al sistema.
        </p>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {resendState?.success && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{resendState.success}</span>
        </div>
      )}

      {resendState?.error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{resendState.error}</span>
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

      {emailNotConfirmed && (
        <div className="rounded-md border border-amber-400/50 bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-400">
            <MailCheck className="h-4 w-4 shrink-0" />
            ¿No recibió el email de confirmación?
          </div>
          <form action={resendAction} className="mt-2 flex gap-2">
            <Input
              name="email"
              type="email"
              placeholder="Su email"
              className="h-8 text-sm"
              required
              disabled={isResending}
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isResending}
              className="shrink-0"
            >
              {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
              Reenviar
            </Button>
          </form>
        </div>
      )}

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
