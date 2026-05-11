"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";
import { FieldError } from "@/components/shared/field-error";
import { Loader2 } from "lucide-react";
import type { EntidadRow, ObraRow, FormState } from "@/types";
import { ESTADO_OBRA_LABELS, TIPO_CONTRATO_LABELS } from "@/types";

interface ObraFormProps {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  clientes: Pick<EntidadRow, "id" | "nombre">[];
  defaultValues?: Partial<ObraRow>;
  submitLabel?: string;
}

const initialState: FormState = {};

export function ObraForm({
  action,
  clientes,
  defaultValues,
  submitLabel = "Crear obra",
}: ObraFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre de la obra *</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Ej: Edificio Mitre 420"
          defaultValue={defaultValues?.nombre}
          disabled={isPending}
        />
        <FieldError message={fe.nombre} />
      </div>

      {/* Tipo contrato + Estado */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tipo_contrato">Tipo de contrato *</Label>
          <SelectNative
            id="tipo_contrato"
            name="tipo_contrato"
            defaultValue={defaultValues?.tipo_contrato ?? "cerrado"}
            disabled={isPending}
          >
            {(Object.entries(TIPO_CONTRATO_LABELS) as [string, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>{label}</option>
              )
            )}
          </SelectNative>
          <FieldError message={fe.tipo_contrato} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estado">Estado</Label>
          <SelectNative
            id="estado"
            name="estado"
            defaultValue={defaultValues?.estado ?? "planning"}
            disabled={isPending}
          >
            {(Object.entries(ESTADO_OBRA_LABELS) as [string, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>{label}</option>
              )
            )}
          </SelectNative>
        </div>
      </div>

      {/* Presupuesto + Cliente */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="presupuesto_aprobado">Presupuesto aprobado ($) *</Label>
          <Input
            id="presupuesto_aprobado"
            name="presupuesto_aprobado"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue={defaultValues?.presupuesto_aprobado ?? ""}
            disabled={isPending}
          />
          <FieldError message={fe.presupuesto_aprobado} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cliente_id">Cliente</Label>
          <SelectNative
            id="cliente_id"
            name="cliente_id"
            defaultValue={defaultValues?.cliente_id ?? ""}
            disabled={isPending}
          >
            <option value="">— Sin cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </SelectNative>
        </div>
      </div>

      {/* Fechas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
          <Input
            id="fecha_inicio"
            name="fecha_inicio"
            type="date"
            defaultValue={defaultValues?.fecha_inicio ?? ""}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fecha_fin_estimada">Fecha fin estimada</Label>
          <Input
            id="fecha_fin_estimada"
            name="fecha_fin_estimada"
            type="date"
            defaultValue={defaultValues?.fecha_fin_estimada ?? ""}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Descripcion */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          placeholder="Descripción del proyecto..."
          defaultValue={defaultValues?.descripcion ?? ""}
          disabled={isPending}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Guardando..." : submitLabel}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/obras">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
