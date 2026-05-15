import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AcuEditor } from "@/components/presupuestos/acu-editor";
import { TIPO_EJECUCION_LABELS } from "@/types";
import type { TipoEjecucion } from "@/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; rubro_id: string }>;
}): Promise<Metadata> {
  const { rubro_id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("rubros").select("nombre").eq("id", rubro_id).single();
  return { title: data?.nombre ? `ACU — ${data.nombre}` : "Rubro" };
}

export default async function RubroDetailPage({
  params,
}: {
  params: Promise<{ id: string; rubro_id: string }>;
}) {
  const { id: presupuestoId, rubro_id: rubroId } = await params;
  const supabase = await createClient();

  const [
    { data: rubro, error },
    { data: acuItems },
  ] = await Promise.all([
    supabase
      .from("rubros")
      .select("*, capitulos(codigo, nombre, presupuesto_id, presupuestos(nombre))")
      .eq("id", rubroId)
      .single(),
    supabase
      .from("analisis_costo_items")
      .select("*")
      .eq("rubro_id", rubroId)
      .order("created_at"),
  ]);

  if (error || !rubro) notFound();

  const capitulo = rubro.capitulos as unknown as {
    codigo: string | null; nombre: string;
    presupuesto_id: string;
    presupuestos: { nombre: string } | null;
  } | null;

  const presupuestoNombre = capitulo?.presupuestos?.nombre ?? "Presupuesto";
  const capLabel = capitulo
    ? `${capitulo.codigo ? capitulo.codigo + " — " : ""}${capitulo.nombre}`
    : "";

  return (
    <main className="flex-1 p-4 lg:p-6 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/presupuestos/${presupuestoId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {presupuestoNombre}
          </Link>
        </Button>
        {capLabel && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{capLabel}</span>
          </>
        )}
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{rubro.nombre}</span>
      </div>

      {/* Rubro header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {rubro.codigo ? <span className="font-mono text-muted-foreground mr-2">{rubro.codigo}</span> : null}
            {rubro.nombre}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant={rubro.tipo_ejecucion === "propio" ? "secondary" : "outline"} className="text-xs">
              {TIPO_EJECUCION_LABELS[rubro.tipo_ejecucion as TipoEjecucion]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Subtotal:{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(Number(rubro.cantidad) * Number(rubro.precio_unitario))}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ACU editor — full interactive client component */}
      <AcuEditor
        rubro={rubro}
        items={acuItems ?? []}
        presupuestoId={presupuestoId}
      />
    </main>
  );
}
