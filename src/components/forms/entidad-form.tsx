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
import type { EntidadRow, FormState } from "@/types";
import { TIPO_ENTIDAD_LABELS } from "@/types";

interface EntidadFormProps {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  defaultValues?: Partial<EntidadRow>;
  submitLabel?: string;
}

const initialState: FormState = {};

export function EntidadForm({
  action,
  defaultValues,
  submitLabel = "Crear entidad",
}: EntidadFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Nombre + Tipo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre / Razón social *</Label>
          <Input
            id="nombre"
            name="nombre"
            placeholder="Ej: Hormigones del Sur S.A."
            defaultValue={defaultValues?.nombre}
            disabled={isPending}
          />
          <FieldError message={fe.nombre} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo *</Label>
          <SelectNative
            id="tipo"
            name="tipo"
            defaultValue={defaultValues?.tipo ?? "proveedor"}
            disabled={isPending}
          >
            {(Object.entries(TIPO_ENTIDAD_LABELS) as [string, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>{label}</option>
              )
            )}
          </SelectNative>
          <FieldError message={fe.tipo} />
        </div>
      </div>

      {/* CUIT + Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cuit">CUIT</Label>
          <Input
            id="cuit"
            name="cuit"
            placeholder="20-12345678-9"
            defaultValue={defaultValues?.cuit ?? ""}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="contacto@empresa.com"
            defaultValue={defaultValues?.email ?? ""}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Telefono */}
      <div className="space-y-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          placeholder="+54 11 1234-5678"
          defaultValue={defaultValues?.telefono ?? ""}
          disabled={isPending}
        />
      </div>

      {/* Direccion */}
      <div className="space-y-1.5">
        <Label htmlFor="direccion">Dirección</Label>
        <Textarea
          id="direccion"
          name="direccion"
          rows={2}
          placeholder="Calle, número, ciudad..."
          defaultValue={defaultValues?.direccion ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Guardando..." : submitLabel}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/entidades">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
