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
import type { ObraRow, FormState } from "@/types";
import { TIPO_CERT_LABELS, ESTADO_CERT_LABELS } from "@/types";
import { todayISO } from "@/lib/utils";

interface CertificacionFormProps {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  obras: Pick<ObraRow, "id" | "nombre" | "tipo_contrato" | "presupuesto_aprobado">[];
  defaultObraId?: string;
}

const initialState: FormState = {};

export function CertificacionForm({
  action,
  obras,
  defaultObraId,
}: CertificacionFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Obra + Tipo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="obra_id">Obra *</Label>
          <SelectNative
            id="obra_id"
            name="obra_id"
            defaultValue={defaultObraId ?? ""}
            disabled={isPending}
          >
            <option value="">— Seleccionar obra —</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}{" "}
                ({o.tipo_contrato === "cerrado" ? "Precio Cerrado" : "Ajustable"})
              </option>
            ))}
          </SelectNative>
          <FieldError message={fe.obra_id} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo *</Label>
          <SelectNative
            id="tipo"
            name="tipo"
            defaultValue="normal"
            disabled={isPending}
          >
            {(Object.entries(TIPO_CERT_LABELS) as [string, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>{label}</option>
              )
            )}
          </SelectNative>
          <FieldError message={fe.tipo} />
        </div>
      </div>

      {/* Monto + Porcentaje */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="monto">Monto a certificar ($) *</Label>
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
          <Label htmlFor="porcentaje_avance">
            % de avance (0–100)
          </Label>
          <Input
            id="porcentaje_avance"
            name="porcentaje_avance"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="Ej: 35.5"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Fecha + Estado */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha *</Label>
          <Input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={todayISO()}
            disabled={isPending}
          />
          <FieldError message={fe.fecha} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estado">Estado inicial</Label>
          <SelectNative
            id="estado"
            name="estado"
            defaultValue="borrador"
            disabled={isPending}
          >
            {(Object.entries(ESTADO_CERT_LABELS) as [string, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>{label}</option>
              )
            )}
          </SelectNative>
        </div>
      </div>

      {/* Observaciones */}
      <div className="space-y-1.5">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          name="observaciones"
          rows={3}
          placeholder="Detalle del avance certificado..."
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Guardando..." : "Crear certificación"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/certificaciones">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
