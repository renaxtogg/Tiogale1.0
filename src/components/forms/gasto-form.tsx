"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { FieldError } from "@/components/shared/field-error";
import { Loader2 } from "lucide-react";
import type { ObraRow, EntidadRow, FormState } from "@/types";
import { CATEGORIA_GASTO_LABELS } from "@/types";
import { todayISO } from "@/lib/utils";

interface RubroOption {
  id: string;
  nombre: string;
  capitulo_nombre: string;
}

interface GastoFormProps {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  obras: Pick<ObraRow, "id" | "nombre">[];
  entidades: Pick<EntidadRow, "id" | "nombre" | "tipo">[];
  rubros?: RubroOption[];
  defaultObraId?: string;
  defaultRubroId?: string;
}

const initialState: FormState = {};

export function GastoForm({
  action,
  obras,
  entidades,
  rubros = [],
  defaultObraId,
  defaultRubroId,
}: GastoFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};

  const proveedores = entidades.filter(
    (e) => e.tipo === "proveedor" || e.tipo === "subcontratista" || e.tipo === "empleado"
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Obra + Categoría */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="obra_id">Obra *</Label>
          <SelectNative id="obra_id" name="obra_id" defaultValue={defaultObraId ?? ""} disabled={isPending}>
            <option value="">— Seleccionar obra —</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </SelectNative>
          <FieldError message={fe.obra_id} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoria">Categoría *</Label>
          <SelectNative id="categoria" name="categoria" defaultValue="material" disabled={isPending}>
            {(Object.entries(CATEGORIA_GASTO_LABELS) as [string, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </SelectNative>
          <FieldError message={fe.categoria} />
        </div>
      </div>

      {/* Rubro (optional) */}
      {rubros.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="rubro_id">
            Rubro
            <span className="ml-1 text-xs text-muted-foreground">(opcional — para comparar con presupuesto)</span>
          </Label>
          <SelectNative id="rubro_id" name="rubro_id" defaultValue={defaultRubroId ?? ""} disabled={isPending}>
            <option value="">— Sin rubro asociado —</option>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                [{r.capitulo_nombre}] {r.nombre}
              </option>
            ))}
          </SelectNative>
        </div>
      )}

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Input
          id="descripcion"
          name="descripcion"
          placeholder="Ej: Compra de hierro 12mm, 200 barras"
          disabled={isPending}
        />
        <FieldError message={fe.descripcion} />
      </div>

      {/* Monto + Fecha */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="monto">Monto total ($) *</Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            disabled={isPending}
          />
          <FieldError message={fe.monto} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha *</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={todayISO()} disabled={isPending} />
          <FieldError message={fe.fecha} />
        </div>
      </div>

      {/* Unit breakdown (optional) */}
      <div className="rounded-md border p-4 bg-muted/20 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Desglose por unidad (opcional)
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="unidad" className="text-xs">Unidad</Label>
            <Input id="unidad" name="unidad" placeholder="m², kg, hr" disabled={isPending} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cantidad" className="text-xs">Cantidad</Label>
            <Input
              id="cantidad"
              name="cantidad"
              type="number"
              min="0.0001"
              step="0.0001"
              placeholder="0"
              disabled={isPending}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="precio_unitario" className="text-xs">Precio unitario ($)</Label>
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
          </div>
        </div>
      </div>

      {/* Proveedor + Comprobante */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="entidad_id">Proveedor / Subcontratista</Label>
          <SelectNative id="entidad_id" name="entidad_id" defaultValue="" disabled={isPending}>
            <option value="">— Sin proveedor —</option>
            {proveedores.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </SelectNative>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="comprobante">Nro. comprobante</Label>
          <Input id="comprobante" name="comprobante" placeholder="Factura / Recibo" disabled={isPending} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Guardando..." : "Registrar gasto"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/gastos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
