"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { acuItemSubtotal, calcularAcuTotal, rubroSubtotal } from "@/lib/budget";
import {
  inlineCreateAcuItem, inlineUpdateAcuItem, inlineDeleteAcuItem,
} from "@/app/(dashboard)/presupuestos/[id]/actions";
import { TIPO_ITEM_LABELS } from "@/types";
import type { RubroRow, AnalisisCostoItemRow, TipoItem, TipoEjecucion } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AcuEditorProps {
  rubro: RubroRow;
  items: AnalisisCostoItemRow[];
  presupuestoId: string;
}

// ─── Tiny inline inputs ───────────────────────────────────────────────────────

function Cell({
  value, onChange, type = "text", step, placeholder, className = "",
}: {
  value: string; onChange: (v: string) => void;
  type?: "text" | "number"; step?: string; placeholder?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${type === "number" ? "font-mono text-right" : ""} ${className}`}
    />
  );
}

// ─── Single ACU row (read + edit mode) ───────────────────────────────────────

function AcuRow({
  item,
  rubroId,
  presupuestoId,
  onRefresh,
}: {
  item: AnalisisCostoItemRow;
  rubroId: string;
  presupuestoId: string;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [tipo,       setTipo]       = useState<TipoItem>(item.tipo as TipoItem);
  const [desc,       setDesc]       = useState(item.descripcion);
  const [unidad,     setUnidad]     = useState(item.unidad);
  const [cantidad,   setCantidad]   = useState(String(item.cantidad));
  const [precio,     setPrecio]     = useState(String(item.precio_unitario));
  const [error,      setError]      = useState<string>();

  const subtotal = acuItemSubtotal(item);
  const editSubtotal = (parseFloat(cantidad) || 0) * (parseFloat(precio) || 0);

  function save() {
    const cant = parseFloat(cantidad);
    if (!desc.trim())         { setError("Descripción requerida."); return; }
    if (isNaN(cant) || cant <= 0) { setError("Cantidad inválida."); return; }
    startTransition(async () => {
      const res = await inlineUpdateAcuItem(item.id, rubroId, presupuestoId, {
        tipo,
        descripcion:    desc.trim(),
        unidad:         unidad.trim(),
        cantidad:       cant,
        precio_unitario: parseFloat(precio) || 0,
      });
      if (res.error) { setError(res.error); return; }
      setEditing(false);
      onRefresh();
    });
  }

  function remove() {
    if (!confirm(`¿Eliminar "${item.descripcion}"?`)) return;
    startTransition(async () => {
      await inlineDeleteAcuItem(item.id, rubroId, presupuestoId);
      onRefresh();
    });
  }

  if (editing) {
    return (
      <tr className="bg-amber-50/50">
        <td className="px-2 py-1.5 w-28">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoItem)}
            className="w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {(Object.entries(TIPO_ITEM_LABELS) as [string, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1.5 min-w-[180px]">
          <Cell value={desc} onChange={setDesc} placeholder="Descripción" />
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </td>
        <td className="px-2 py-1.5 w-20"><Cell value={unidad} onChange={setUnidad} /></td>
        <td className="px-2 py-1.5 w-24"><Cell value={cantidad} onChange={setCantidad} type="number" step="0.0001" /></td>
        <td className="px-2 py-1.5 w-28"><Cell value={precio} onChange={setPrecio} type="number" /></td>
        <td className="px-2 py-1.5 w-28 text-right font-mono text-sm font-semibold">
          {formatCurrency(editSubtotal)}
        </td>
        <td className="px-2 py-1.5 w-20">
          <div className="flex gap-1">
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setError(undefined); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-muted/30 group transition-colors">
      <td className="px-3 py-1.5">
        <Badge variant="outline" className="text-[10px]">
          {TIPO_ITEM_LABELS[item.tipo as TipoItem]}
        </Badge>
      </td>
      <td className="px-3 py-1.5 text-sm">{item.descripcion}</td>
      <td className="px-3 py-1.5 text-xs text-muted-foreground">{item.unidad}</td>
      <td className="px-3 py-1.5 text-right font-mono text-sm">
        {Number(item.cantidad).toLocaleString("es-AR", { maximumFractionDigits: 4 })}
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-sm">
        {formatCurrency(Number(item.precio_unitario))}
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-sm font-semibold">
        {formatCurrency(subtotal)}
      </td>
      <td className="px-3 py-1.5">
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={remove}
            disabled={isPending}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Add ACU item row ─────────────────────────────────────────────────────────

function AddAcuRow({
  rubroId,
  presupuestoId,
  onDone,
}: {
  rubroId: string;
  presupuestoId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tipo,    setTipo]    = useState<TipoItem>("material");
  const [desc,    setDesc]    = useState("");
  const [unidad,  setUnidad]  = useState("un");
  const [cantidad, setCantidad] = useState("1");
  const [precio,  setPrecio]  = useState("0");
  const [error,   setError]   = useState<string>();

  const subtotal = (parseFloat(cantidad) || 0) * (parseFloat(precio) || 0);

  function submit() {
    const cant = parseFloat(cantidad);
    if (!desc.trim())            { setError("Descripción requerida."); return; }
    if (isNaN(cant) || cant <= 0){ setError("Cantidad inválida."); return; }
    startTransition(async () => {
      const res = await inlineCreateAcuItem(rubroId, presupuestoId, {
        tipo,
        descripcion:    desc.trim(),
        unidad:         unidad.trim(),
        cantidad:       cant,
        precio_unitario: parseFloat(precio) || 0,
      });
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onDone();
    });
  }

  return (
    <tr className="bg-emerald-50/50 border-t border-emerald-200">
      <td className="px-2 py-1.5">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoItem)}
          className="w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {(Object.entries(TIPO_ITEM_LABELS) as [string, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <Cell value={desc} onChange={setDesc} placeholder="Descripción *" />
        {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      </td>
      <td className="px-2 py-1.5"><Cell value={unidad} onChange={setUnidad} placeholder="un" /></td>
      <td className="px-2 py-1.5"><Cell value={cantidad} onChange={setCantidad} type="number" step="0.0001" /></td>
      <td className="px-2 py-1.5"><Cell value={precio} onChange={setPrecio} type="number" /></td>
      <td className="px-2 py-1.5 text-right font-mono text-sm font-semibold text-emerald-700">
        {formatCurrency(subtotal)}
      </td>
      <td className="px-2 py-1.5">
        <div className="flex gap-1">
          <Button size="sm" onClick={submit} disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDone}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main AcuEditor ───────────────────────────────────────────────────────────

export function AcuEditor({ rubro, items, presupuestoId }: AcuEditorProps) {
  const router = useRouter();
  const [addingItem, setAddingItem] = useState(false);

  const acuTotal    = calcularAcuTotal(items);
  const subtotal    = rubroSubtotal(rubro);
  const priceMatch  = Math.abs(acuTotal - Number(rubro.precio_unitario)) < 0.01;

  return (
    <div className="space-y-4">
      {/* Rubro summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md border bg-muted/20 p-3">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Unidad</p>
          <p className="font-semibold mt-0.5">{rubro.unidad}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Cantidad</p>
          <p className="font-mono font-semibold mt-0.5">
            {Number(rubro.cantidad).toLocaleString("es-AR", { maximumFractionDigits: 4 })}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Precio unitario
            {!priceMatch && acuTotal > 0 && (
              <span className="ml-1 text-amber-600">≠ ACU</span>
            )}
          </p>
          <p className="font-mono font-semibold mt-0.5">
            {formatCurrency(Number(rubro.precio_unitario))}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Subtotal rubro</p>
          <p className="font-mono text-lg font-bold mt-0.5">{formatCurrency(subtotal)}</p>
        </div>
      </div>

      {/* ACU table */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Análisis de Costo Unitario (ACU)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estimación del costo por <strong>{rubro.unidad}</strong>.
              No son gastos reales — determinan el precio unitario del rubro.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAddingItem((v) => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ítem
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs text-muted-foreground border-b bg-muted/20">
                <th className="px-3 py-2 text-left font-medium w-28">Tipo</th>
                <th className="px-3 py-2 text-left font-medium">Descripción</th>
                <th className="px-3 py-2 text-left font-medium w-20">Unidad</th>
                <th className="px-3 py-2 text-right font-medium w-24">Cantidad</th>
                <th className="px-3 py-2 text-right font-medium w-28">P. Unitario</th>
                <th className="px-3 py-2 text-right font-medium w-28">Subtotal</th>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !addingItem && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    Sin ítems de ACU.{" "}
                    <button onClick={() => setAddingItem(true)} className="text-primary hover:underline">
                      Agregar el primero.
                    </button>
                  </td>
                </tr>
              )}

              {items.map((item) => (
                <AcuRow
                  key={item.id}
                  item={item}
                  rubroId={rubro.id}
                  presupuestoId={presupuestoId}
                  onRefresh={() => router.refresh()}
                />
              ))}

              {addingItem && (
                <AddAcuRow
                  rubroId={rubro.id}
                  presupuestoId={presupuestoId}
                  onDone={() => setAddingItem(false)}
                />
              )}

              {/* ACU Total row */}
              {items.length > 0 && (
                <tr className="border-t bg-muted/30 font-semibold">
                  <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Total ACU (costo por {rubro.unidad})
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold">
                    {formatCurrency(acuTotal)}
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Derivation summary */}
        {items.length > 0 && (
          <div className="rounded-md bg-slate-50 dark:bg-slate-900 border px-4 py-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Precio unitario (del ACU)</span>
              <span className="font-mono font-semibold">{formatCurrency(acuTotal)} / {rubro.unidad}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Subtotal rubro ({Number(rubro.cantidad).toLocaleString("es-AR")} {rubro.unidad} × {formatCurrency(acuTotal)})
              </span>
              <span className="font-mono font-bold text-base">
                {formatCurrency(Number(rubro.cantidad) * acuTotal)}
              </span>
            </div>
            {!priceMatch && acuTotal > 0 && (
              <p className="text-xs text-amber-600 pt-1">
                El precio unitario almacenado ({formatCurrency(Number(rubro.precio_unitario))}) difiere del total ACU.
                Edite el rubro para sincronizarlos.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
