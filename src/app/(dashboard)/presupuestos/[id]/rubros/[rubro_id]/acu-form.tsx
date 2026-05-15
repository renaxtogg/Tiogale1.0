"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { FieldError } from "@/components/shared/field-error";
import { Loader2, Plus } from "lucide-react";
import type { FormState } from "@/types";
import { TIPO_ITEM_LABELS } from "@/types";

interface AcuFormProps {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
}

const initialState: FormState = {};

export function AcuForm({ action }: AcuFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-6 items-end">
        {/* Tipo */}
        <div className="space-y-1.5">
          <Label htmlFor="tipo" className="text-xs">Tipo</Label>
          <SelectNative id="tipo" name="tipo" defaultValue="material" disabled={isPending} className="text-sm">
            {(Object.entries(TIPO_ITEM_LABELS) as [string, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </SelectNative>
        </div>

        {/* Descripción */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="descripcion" className="text-xs">Descripción *</Label>
          <Input
            id="descripcion"
            name="descripcion"
            placeholder="Ej: Jalones topográficos"
            disabled={isPending}
            className="text-sm"
          />
          <FieldError message={fe.descripcion} />
        </div>

        {/* Unidad */}
        <div className="space-y-1.5">
          <Label htmlFor="unidad" className="text-xs">Unidad *</Label>
          <Input id="unidad" name="unidad" placeholder="un" disabled={isPending} className="text-sm" />
          <FieldError message={fe.unidad} />
        </div>

        {/* Cantidad */}
        <div className="space-y-1.5">
          <Label htmlFor="cantidad" className="text-xs">Cantidad *</Label>
          <Input
            id="cantidad"
            name="cantidad"
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="1"
            disabled={isPending}
            className="text-sm"
          />
          <FieldError message={fe.cantidad} />
        </div>

        {/* Precio unitario + Submit */}
        <div className="space-y-1.5">
          <Label htmlFor="precio_unitario" className="text-xs">P. Unitario ($) *</Label>
          <div className="flex gap-2">
            <Input
              id="precio_unitario"
              name="precio_unitario"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={isPending}
              className="text-sm"
            />
            <Button type="submit" size="sm" disabled={isPending} className="shrink-0">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <FieldError message={fe.precio_unitario} />
        </div>
      </div>
    </form>
  );
}
