"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { FieldError } from "@/components/shared/field-error";
import { Loader2 } from "lucide-react";
import { createCatalogoRubro } from "../actions";
import { TIPO_EJECUCION_LABELS } from "@/types";
import type { FormState } from "@/types";

const initialState: FormState = {};

export default function NuevoCatalogoRubroPage() {
  const [state, formAction, isPending] = useActionState(createCatalogoRubro, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <div className="max-w-lg mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nuevo Rubro de Catálogo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Los rubros del catálogo son plantillas reutilizables en cualquier proyecto.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {state.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" placeholder="Ej: E-01" disabled={isPending} />
          </div>
          <div className="sm:col-span-3 space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" placeholder="Ej: Excavación manual en terreno normal" disabled={isPending} />
            <FieldError message={fe.nombre} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="unidad">Unidad *</Label>
            <Input id="unidad" name="unidad" placeholder="Ej: m³" disabled={isPending} />
            <FieldError message={fe.unidad} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipo_ejecucion">Tipo de ejecución</Label>
            <SelectNative id="tipo_ejecucion" name="tipo_ejecucion" defaultValue="propio" disabled={isPending}>
              {(Object.entries(TIPO_EJECUCION_LABELS) as [string, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </SelectNative>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Guardando..." : "Crear rubro"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/catalogo">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
