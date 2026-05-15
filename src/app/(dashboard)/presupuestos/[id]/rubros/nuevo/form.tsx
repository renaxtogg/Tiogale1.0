"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { FieldError } from "@/components/shared/field-error";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/types";
import { TIPO_EJECUCION_LABELS } from "@/types";

interface RubroNuevoFormProps {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  capitulos: { id: string; codigo: string | null; nombre: string }[];
  defaultCapituloId?: string;
  presupuestoId: string;
}

const initialState: FormState = {};

export function RubroNuevoForm({
  action,
  capitulos,
  defaultCapituloId,
  presupuestoId,
}: RubroNuevoFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Capítulo */}
      <div className="space-y-1.5">
        <Label htmlFor="capitulo_id">Capítulo *</Label>
        <SelectNative
          id="capitulo_id"
          name="capitulo_id"
          defaultValue={defaultCapituloId ?? ""}
          disabled={isPending}
        >
          <option value="">— Seleccionar capítulo —</option>
          {capitulos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo ? `${c.codigo} - ` : ""}{c.nombre}
            </option>
          ))}
        </SelectNative>
        <FieldError message={fe.capitulo_id} />
        {capitulos.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay capítulos.{" "}
            <Link href={`/presupuestos/${presupuestoId}/capitulos/nuevo`} className="text-primary hover:underline">
              Crear uno primero.
            </Link>
          </p>
        )}
      </div>

      {/* Código + Nombre */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="codigo">Código</Label>
          <Input id="codigo" name="codigo" placeholder="Ej: 1.1" disabled={isPending} />
        </div>
        <div className="sm:col-span-3 space-y-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" placeholder="Ej: Trabajos de Topografía" disabled={isPending} />
          <FieldError message={fe.nombre} />
        </div>
      </div>

      {/* Unidad + Cantidad */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="unidad">Unidad *</Label>
          <Input id="unidad" name="unidad" placeholder="Ej: ml, m², m³, gl" disabled={isPending} />
          <FieldError message={fe.unidad} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cantidad">Cantidad *</Label>
          <Input
            id="cantidad"
            name="cantidad"
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="500"
            disabled={isPending}
          />
          <FieldError message={fe.cantidad} />
        </div>
      </div>

      {/* Precio unitario + Tipo ejecución */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="precio_unitario">
            Precio unitario ($)
            <span className="ml-1 text-xs text-muted-foreground">(opcional, se puede calcular del ACU)</span>
          </Label>
          <Input
            id="precio_unitario"
            name="precio_unitario"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            disabled={isPending}
          />
          <FieldError message={fe.precio_unitario} />
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

      {/* Orden */}
      <div className="space-y-1.5 max-w-xs">
        <Label htmlFor="orden">Orden</Label>
        <Input id="orden" name="orden" type="number" min="0" placeholder="0" disabled={isPending} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending || capitulos.length === 0}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Guardando..." : "Agregar rubro"}
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/presupuestos/${presupuestoId}`}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
