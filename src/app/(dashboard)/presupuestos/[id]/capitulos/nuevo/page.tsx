"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/shared/field-error";
import { Loader2 } from "lucide-react";
import { createCapitulo } from "../../actions";
import type { FormState } from "@/types";

const initialState: FormState = {};

export default function NuevoCapituloPage() {
  const params = useParams<{ id: string }>();
  const presupuestoId = params.id;

  const boundAction = createCapitulo.bind(null, presupuestoId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <div className="max-w-lg mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nuevo Capítulo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Los capítulos agrupan rubros. No tienen costo directo.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {state.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" placeholder="Ej: 1" disabled={isPending} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" placeholder="Ej: TRABAJOS PRELIMINARES" disabled={isPending} />
            <FieldError message={fe.nombre} />
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="orden">Orden</Label>
          <Input id="orden" name="orden" type="number" min="0" placeholder="0" disabled={isPending} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Guardando..." : "Agregar capítulo"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/presupuestos/${presupuestoId}`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
