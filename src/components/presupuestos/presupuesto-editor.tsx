"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SelectNative } from "@/components/ui/select-native";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus, Pencil, Trash2, ChevronRight, Check, X, Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { rubroSubtotal, calcularSubtotalCapitulo } from "@/lib/budget";
import {
  inlineCreateCapitulo, inlineUpdateCapitulo, inlineDeleteCapitulo,
  inlineCreateRubro, inlineUpdateRubro, inlineDeleteRubro,
} from "@/app/(dashboard)/presupuestos/[id]/actions";
import { TIPO_EJECUCION_LABELS } from "@/types";
import type {
  PresupuestoRow, CapituloConRubros, RubroConAcu,
  TipoEjecucion, CatalogoRubroRow, CatalogoAcuItemRow,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogEntry extends CatalogoRubroRow {
  acu_items: CatalogoAcuItemRow[];
}

interface PresupuestoEditorProps {
  presupuesto: PresupuestoRow;
  capitulos: CapituloConRubros[];
  totalPresupuestado: number;
  obraNombre: string;
  catalogo: CatalogEntry[];
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function NumInput({
  value, onChange, step = "0.01", className = "",
}: {
  value: string; onChange: (v: string) => void; step?: string; className?: string;
}) {
  return (
    <input
      type="number"
      min="0"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded border border-input bg-background px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
    />
  );
}

function TxtInput({
  value, onChange, placeholder = "", className = "",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
    />
  );
}

// ─── Add Chapter inline form ──────────────────────────────────────────────────

function AddChapterForm({
  presupuestoId,
  onDone,
}: {
  presupuestoId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError]   = useState<string>();

  function submit() {
    if (!nombre.trim()) { setError("Nombre requerido."); return; }
    startTransition(async () => {
      const res = await inlineCreateCapitulo(presupuestoId, { codigo, nombre });
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onDone();
    });
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t bg-muted/30">
      <TxtInput value={codigo} onChange={setCodigo} placeholder="Cód" className="w-16" />
      <TxtInput value={nombre} onChange={setNombre} placeholder="Nombre del capítulo *" className="flex-1" />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button size="sm" onClick={submit} disabled={isPending}>
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone} disabled={isPending}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ─── Edit Chapter Sheet ───────────────────────────────────────────────────────

function EditChapterSheet({
  cap,
  presupuestoId,
  open,
  onClose,
}: {
  cap: CapituloConRubros;
  presupuestoId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [codigo, setCodigo] = useState(cap.codigo ?? "");
  const [nombre, setNombre] = useState(cap.nombre);
  const [error, setError]   = useState<string>();

  function submit() {
    startTransition(async () => {
      const res = await inlineUpdateCapitulo(cap.id, presupuestoId, { codigo, nombre });
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Editar Capítulo</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Código</label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: 1" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Nombre *</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del capítulo" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Guardar
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Add Rubro inline form ────────────────────────────────────────────────────

function AddRubroForm({
  capituloId,
  presupuestoId,
  catalogo,
  nextOrden,
  onDone,
}: {
  capituloId: string;
  presupuestoId: string;
  catalogo: CatalogEntry[];
  nextOrden: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogEntry | null>(null);
  const [cloneAcu, setCloneAcu] = useState(true);

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("ml");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("0");
  const [tipo, setTipo] = useState<TipoEjecucion>("propio");
  const [error, setError] = useState<string>();

  function onCatalogChange(catId: string) {
    const cat = catalogo.find((c) => c.id === catId) ?? null;
    setSelectedCatalog(cat);
    if (cat) {
      setNombre(cat.nombre);
      setUnidad(cat.unidad);
      setTipo(cat.tipo_ejecucion as TipoEjecucion);
    }
  }

  function submit() {
    const cant = parseFloat(cantidad);
    if (!nombre.trim()) { setError("Nombre requerido."); return; }
    if (!unidad.trim()) { setError("Unidad requerida."); return; }
    if (isNaN(cant) || cant <= 0) { setError("Cantidad debe ser mayor a cero."); return; }

    startTransition(async () => {
      const res = await inlineCreateRubro(presupuestoId, {
        capitulo_id:      capituloId,
        codigo,
        nombre,
        unidad,
        cantidad:         cant,
        precio_unitario:  parseFloat(precio) || 0,
        tipo_ejecucion:   tipo,
        orden:            nextOrden,
        catalogo_rubro_id: selectedCatalog?.id,
        clone_acu:        !!selectedCatalog && cloneAcu && selectedCatalog.acu_items.length > 0,
      });
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onDone();
    });
  }

  return (
    <tr className="bg-amber-50/50 border-t border-amber-200">
      <td className="px-2 py-1.5">
        <TxtInput value={codigo} onChange={setCodigo} placeholder="Cód" />
      </td>
      <td className="px-2 py-1.5 min-w-[180px]">
        {catalogo.length > 0 && (
          <select
            className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-muted-foreground mb-1 focus:outline-none focus:ring-1 focus:ring-ring"
            onChange={(e) => onCatalogChange(e.target.value)}
            defaultValue=""
          >
            <option value="">— Del catálogo —</option>
            {catalogo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo ? `${c.codigo} – ` : ""}{c.nombre}
              </option>
            ))}
          </select>
        )}
        <TxtInput value={nombre} onChange={setNombre} placeholder="Nombre del rubro *" />
        {selectedCatalog?.acu_items.length ? (
          <label className="flex items-center gap-1 mt-1 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={cloneAcu} onChange={(e) => setCloneAcu(e.target.checked)} />
            Copiar ACU del catálogo ({selectedCatalog.acu_items.length} ítems)
          </label>
        ) : null}
      </td>
      <td className="px-2 py-1.5 w-20">
        <TxtInput value={unidad} onChange={setUnidad} placeholder="Und" />
      </td>
      <td className="px-2 py-1.5 w-24">
        <NumInput value={cantidad} onChange={setCantidad} step="0.0001" />
      </td>
      <td className="px-2 py-1.5 w-28">
        <NumInput value={precio} onChange={setPrecio} />
      </td>
      <td className="px-2 py-1.5 w-28 font-mono text-sm text-right text-muted-foreground">
        {formatCurrency((parseFloat(cantidad) || 0) * (parseFloat(precio) || 0))}
      </td>
      <td className="px-2 py-1.5 w-28">
        <SelectNative
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoEjecucion)}
          className="text-xs h-7"
        >
          <option value="propio">Propio</option>
          <option value="subcontratado">Subcontratado</option>
        </SelectNative>
      </td>
      <td className="px-2 py-1.5 w-20">
        <div className="flex items-center gap-1">
          {error && <span className="text-xs text-destructive">{error}</span>}
          <Button size="sm" onClick={submit} disabled={isPending} variant="default">
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

// ─── Edit Rubro Sheet ─────────────────────────────────────────────────────────

function EditRubroSheet({
  rubro,
  presupuestoId,
  open,
  onClose,
}: {
  rubro: RubroConAcu;
  presupuestoId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [codigo, setCodigo]   = useState(rubro.codigo ?? "");
  const [nombre, setNombre]   = useState(rubro.nombre);
  const [unidad, setUnidad]   = useState(rubro.unidad);
  const [cantidad, setCantidad] = useState(String(rubro.cantidad));
  const [precio, setPrecio]   = useState(String(rubro.precio_unitario));
  const [tipo, setTipo]       = useState<TipoEjecucion>(rubro.tipo_ejecucion as TipoEjecucion);
  const [error, setError]     = useState<string>();

  const subtotal = (parseFloat(cantidad) || 0) * (parseFloat(precio) || 0);

  function submit() {
    const cant = parseFloat(cantidad);
    if (!nombre.trim() || isNaN(cant) || cant <= 0) {
      setError("Nombre y cantidad son requeridos.");
      return;
    }
    startTransition(async () => {
      const res = await inlineUpdateRubro(rubro.id, presupuestoId, {
        codigo,
        nombre,
        unidad,
        cantidad: cant,
        precio_unitario: parseFloat(precio) || 0,
        tipo_ejecucion: tipo,
      });
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Rubro</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Código</label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="1.1" />
            </div>
            <div className="col-span-3 space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Nombre *</label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Unidad</label>
              <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Cantidad</label>
              <Input type="number" min="0.0001" step="0.0001" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Precio unitario ($)
              {rubro.acu_total > 0 && (
                <span className="ml-2 text-amber-600 normal-case font-normal">
                  ACU: {formatCurrency(rubro.acu_total)}
                  <button
                    type="button"
                    className="ml-1 underline"
                    onClick={() => setPrecio(String(rubro.acu_total))}
                  >
                    usar
                  </button>
                </span>
              )}
            </label>
            <Input type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Tipo de ejecución</label>
            <SelectNative value={tipo} onChange={(e) => setTipo(e.target.value as TipoEjecucion)}>
              <option value="propio">Propio</option>
              <option value="subcontratado">Subcontratado</option>
            </SelectNative>
          </div>
          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Subtotal: </span>
            <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Guardar
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Rubro row ────────────────────────────────────────────────────────────────

function RubroRow({
  rubro,
  presupuestoId,
  onEdit,
  onDelete,
}: {
  rubro: RubroConAcu;
  presupuestoId: string;
  onEdit: (r: RubroConAcu) => void;
  onDelete: (r: RubroConAcu) => void;
}) {
  return (
    <tr className="hover:bg-muted/30 group transition-colors">
      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
        {rubro.codigo ?? "—"}
      </td>
      <td className="px-3 py-1.5 text-sm font-medium">{rubro.nombre}</td>
      <td className="px-3 py-1.5 text-xs text-muted-foreground">{rubro.unidad}</td>
      <td className="px-3 py-1.5 text-right font-mono text-sm">
        {Number(rubro.cantidad).toLocaleString("es-AR", { maximumFractionDigits: 4 })}
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-sm">
        <span title={rubro.acu_total > 0 ? `ACU: ${formatCurrency(rubro.acu_total)}` : undefined}>
          {formatCurrency(Number(rubro.precio_unitario))}
        </span>
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-sm font-semibold">
        {formatCurrency(rubro.subtotal)}
      </td>
      <td className="px-3 py-1.5">
        <Badge
          variant={rubro.tipo_ejecucion === "propio" ? "secondary" : "outline"}
          className="text-[10px] whitespace-nowrap"
        >
          {TIPO_EJECUCION_LABELS[rubro.tipo_ejecucion as TipoEjecucion]}
        </Badge>
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/presupuestos/${presupuestoId}/rubros/${rubro.id}`}
            title="Ver ACU"
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ACU
            <ChevronRight className="h-3 w-3" />
          </Link>
          <button
            onClick={() => onEdit(rubro)}
            title="Editar"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(rubro)}
            title="Eliminar"
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Chapter Section ──────────────────────────────────────────────────────────

function ChapterSection({
  cap,
  presupuestoId,
  catalogo,
  onEditChapter,
  onDeleteChapter,
  onEditRubro,
  onDeleteRubro,
}: {
  cap: CapituloConRubros;
  presupuestoId: string;
  catalogo: CatalogEntry[];
  onEditChapter: (c: CapituloConRubros) => void;
  onDeleteChapter: (c: CapituloConRubros) => void;
  onEditRubro: (r: RubroConAcu) => void;
  onDeleteRubro: (r: RubroConAcu) => void;
}) {
  const [addingRubro, setAddingRubro] = useState(false);

  return (
    <div className="rounded-md border overflow-hidden">
      {/* Chapter header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b">
        <div className="flex items-center gap-2 min-w-0">
          {cap.codigo && (
            <span className="font-mono text-sm font-semibold text-muted-foreground shrink-0">
              {cap.codigo}
            </span>
          )}
          <span className="font-semibold text-sm truncate">{cap.nombre}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-sm font-bold">{formatCurrency(cap.subtotal)}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setAddingRubro((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5 mr-0.5" />
            Rubro
          </Button>
          <button
            onClick={() => onEditChapter(cap)}
            title="Editar capítulo"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDeleteChapter(cap)}
            title="Eliminar capítulo"
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Rubros table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-muted-foreground border-b bg-muted/20">
              <th className="px-3 py-1.5 text-left font-medium w-20">Código</th>
              <th className="px-3 py-1.5 text-left font-medium">Nombre</th>
              <th className="px-3 py-1.5 text-left font-medium w-20">Unidad</th>
              <th className="px-3 py-1.5 text-right font-medium w-24">Cantidad</th>
              <th className="px-3 py-1.5 text-right font-medium w-28">P. Unitario</th>
              <th className="px-3 py-1.5 text-right font-medium w-28">Subtotal</th>
              <th className="px-3 py-1.5 text-left font-medium w-28">Tipo</th>
              <th className="px-3 py-1.5 w-28" />
            </tr>
          </thead>
          <tbody>
            {cap.rubros.length === 0 && !addingRubro && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Sin rubros.{" "}
                  <button onClick={() => setAddingRubro(true)} className="text-primary hover:underline">
                    Agregar rubro.
                  </button>
                </td>
              </tr>
            )}

            {cap.rubros.map((r) => (
              <RubroRow
                key={r.id}
                rubro={r}
                presupuestoId={presupuestoId}
                onEdit={onEditRubro}
                onDelete={onDeleteRubro}
              />
            ))}

            {addingRubro && (
              <AddRubroForm
                capituloId={cap.id}
                presupuestoId={presupuestoId}
                catalogo={catalogo}
                nextOrden={cap.rubros.length}
                onDone={() => setAddingRubro(false)}
              />
            )}

            {/* Chapter subtotal */}
            {cap.rubros.length > 0 && (
              <tr className="border-t bg-muted/10">
                <td colSpan={5} className="px-3 py-1 text-right text-xs font-medium text-muted-foreground">
                  Subtotal capítulo
                </td>
                <td className="px-3 py-1 text-right font-mono text-sm font-bold">
                  {formatCurrency(cap.subtotal)}
                </td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function PresupuestoEditor({
  presupuesto,
  capitulos,
  totalPresupuestado,
  obraNombre,
  catalogo,
}: PresupuestoEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [addingChapter, setAddingChapter] = useState(false);
  const [editingCap, setEditingCap] = useState<CapituloConRubros | null>(null);
  const [editingRubro, setEditingRubro] = useState<RubroConAcu | null>(null);

  function handleDeleteChapter(cap: CapituloConRubros) {
    if (!confirm(`¿Eliminar el capítulo "${cap.nombre}" y todos sus rubros?`)) return;
    startTransition(async () => {
      await inlineDeleteCapitulo(cap.id, presupuesto.id);
      router.refresh();
    });
  }

  function handleDeleteRubro(rubro: RubroConAcu) {
    if (!confirm(`¿Eliminar el rubro "${rubro.nombre}"?`)) return;
    startTransition(async () => {
      await inlineDeleteRubro(rubro.id, presupuesto.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      {/* Grand total header strip */}
      <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-2 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <Link href="/presupuestos" className="hover:underline">{obraNombre}</Link>
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm">{presupuesto.nombre} v{presupuesto.version}</span>
          <Badge variant={presupuesto.estado === "aprobado" ? "success" : "secondary"} className="text-xs">
            {presupuesto.estado === "aprobado" ? "Aprobado" : "Borrador"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">TOTAL</span>
          <span className="font-mono text-xl font-bold">{formatCurrency(totalPresupuestado)}</span>
          <Button size="sm" variant="outline" onClick={() => setAddingChapter((v) => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Capítulo
          </Button>
        </div>
      </div>

      {/* No chapters yet */}
      {capitulos.length === 0 && !addingChapter && (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            El presupuesto está vacío. Comience creando un capítulo.
          </p>
          <Button onClick={() => setAddingChapter(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar primer capítulo
          </Button>
        </div>
      )}

      {/* Chapters */}
      <div className="space-y-3">
        {capitulos.map((cap) => (
          <ChapterSection
            key={cap.id}
            cap={cap}
            presupuestoId={presupuesto.id}
            catalogo={catalogo}
            onEditChapter={setEditingCap}
            onDeleteChapter={handleDeleteChapter}
            onEditRubro={setEditingRubro}
            onDeleteRubro={handleDeleteRubro}
          />
        ))}
      </div>

      {/* Add chapter inline form */}
      {addingChapter && (
        <div className="rounded-md border">
          <AddChapterForm
            presupuestoId={presupuesto.id}
            onDone={() => setAddingChapter(false)}
          />
        </div>
      )}

      {/* Grand total footer */}
      {capitulos.length > 0 && (
        <div className="flex justify-end pt-3">
          <div className="rounded-md border bg-muted/40 px-6 py-3 flex items-center gap-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total presupuesto ({capitulos.length} capítulo{capitulos.length !== 1 ? "s" : ""})
            </div>
            <div className="font-mono text-2xl font-bold">{formatCurrency(totalPresupuestado)}</div>
          </div>
        </div>
      )}

      {/* Sheets for editing */}
      {editingCap && (
        <EditChapterSheet
          cap={editingCap}
          presupuestoId={presupuesto.id}
          open={!!editingCap}
          onClose={() => setEditingCap(null)}
        />
      )}
      {editingRubro && (
        <EditRubroSheet
          rubro={editingRubro}
          presupuestoId={presupuesto.id}
          open={!!editingRubro}
          onClose={() => setEditingRubro(null)}
        />
      )}
    </div>
  );
}
