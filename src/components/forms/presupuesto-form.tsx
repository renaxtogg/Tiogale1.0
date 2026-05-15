"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { FieldError } from "@/components/shared/field-error";
import { Loader2 } from "lucide-react";
import type { ObraRow, FormState } from "@/types";

interface PresupuestoFormProps {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  obras: Pick<ObraRow, "id" | "nombre">[];
  defaultObraId?: string;
}

const initialState: FormState = {};

export function PresupuestoForm({ action, obras, defaultObraId }: PresupuestoFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

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
        <Label htmlFor="nombre">Nombre del presupuesto *</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Ej: Presupuesto Principal"
          defaultValue="Presupuesto Principal"
          disabled={isPending}
        />
        <FieldError message={fe.nombre} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas">Notas</Label>
        <Input id="notas" name="notas" placeholder="Observaciones opcionales" disabled={isPending} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Creando..." : "Crear presupuesto"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/presupuestos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
