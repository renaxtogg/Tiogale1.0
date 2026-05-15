import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/shared/delete-button";
import {
  Plus, Receipt, Award, TrendingUp, TrendingDown, Minus, FileText,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcularResumenFinanciero } from "@/lib/calculations";
import { enrichRubros, enrichCapitulos, calcularTotalPresupuesto } from "@/lib/budget";
import { diferenciaColorClass } from "@/lib/comparisons";
import {
  ESTADO_OBRA_LABELS, TIPO_CONTRATO_LABELS,
  CATEGORIA_GASTO_LABELS, ESTADO_CERT_LABELS, TIPO_CERT_LABELS,
} from "@/types";
import type {
  EstadoObra, CategoriaGasto, EstadoCert, TipoCert,
  RubroRow, CapituloRow, AnalisisCostoItemRow,
} from "@/types";
import { deleteObra, deleteGasto, deleteCertificacion } from "./actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("obras").select("nombre").eq("id", id).single();
  return { title: data?.nombre ?? "Obra" };
}

const ESTADO_VARIANT: Record<EstadoObra, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  planning: "secondary", active: "success", paused: "warning",
  completed: "outline", cancelled: "destructive",
};

export default async function ObraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: obra, error },
    { data: gastos },
    { data: certificaciones },
    { data: presupuestos },
  ] = await Promise.all([
    supabase
      .from("obras")
      .select("*, entidades!obras_cliente_id_fkey(nombre, email, telefono)")
      .eq("id", id)
      .single(),
    supabase
      .from("gastos")
      .select("*, entidades(nombre)")
      .eq("obra_id", id)
      .order("fecha", { ascending: false }),
    supabase
      .from("certificaciones")
      .select("*")
      .eq("obra_id", id)
      .order("numero"),
    supabase
      .from("presupuestos")
      .select(`
        id, nombre, version, estado,
        capitulos(
          id, presupuesto_id, codigo, nombre, orden, created_at, updated_at,
          rubros(
            id, capitulo_id, catalogo_rubro_id, codigo, nombre,
            unidad, cantidad, precio_unitario, tipo_ejecucion, orden,
            created_at, updated_at,
            analisis_costo_items(id, rubro_id, tipo, descripcion, unidad, cantidad, precio_unitario, created_at, updated_at)
          )
        )
      `)
      .eq("obra_id", id)
      .order("version"),
  ]);

  if (error || !obra) notFound();

  const resumen = calcularResumenFinanciero(obra, gastos ?? [], certificaciones ?? []);
  const cliente = obra.entidades as unknown as { nombre: string; email?: string; telefono?: string } | null;

  // Compute presupuesto totals
  const presupuestoRows = (presupuestos ?? []).map((p) => {
    const caps = (p.capitulos ?? []) as unknown as (CapituloRow & {
      rubros: (RubroRow & { analisis_costo_items: AnalisisCostoItemRow[] })[];
    })[];
    const acuMap   = new Map<string, AnalisisCostoItemRow[]>();
    const rubroMap = new Map<string, ReturnType<typeof enrichRubros>[number][]>();
    for (const cap of caps) {
      for (const r of cap.rubros ?? []) acuMap.set(r.id, r.analisis_costo_items ?? []);
      rubroMap.set(cap.id, enrichRubros((cap.rubros ?? []) as RubroRow[], acuMap));
    }
    const enrichedCaps = enrichCapitulos(caps as CapituloRow[], rubroMap);
    return { ...p, total: calcularTotalPresupuesto(enrichedCaps) };
  });

  const ResultIcon =
    resumen.resultado > 0 ? TrendingUp : resumen.resultado < 0 ? TrendingDown : Minus;
  const resultColor =
    resumen.resultado > 0
      ? "text-emerald-600"
      : resumen.resultado < 0
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <PageContainer
      title={obra.nombre}
      description={obra.descripcion ?? undefined}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/presupuestos/nuevo?obra_id=${obra.id}`}>
              <FileText className="h-4 w-4" />
              Nuevo presupuesto
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/gastos/nuevo?obra_id=${obra.id}`}>
              <Receipt className="h-4 w-4" />
              Registrar gasto
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/certificaciones/nueva?obra_id=${obra.id}`}>
              <Award className="h-4 w-4" />
              Certificar
            </Link>
          </Button>
        </div>
      }
    >
      {/* ── Header info ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={ESTADO_VARIANT[obra.estado as EstadoObra]}>
          {ESTADO_OBRA_LABELS[obra.estado as EstadoObra]}
        </Badge>
        <Badge variant="outline">
          {TIPO_CONTRATO_LABELS[obra.tipo_contrato as "cerrado" | "abierto"]}
        </Badge>
        {obra.fecha_inicio && (
          <span className="text-sm text-muted-foreground">
            Inicio: {formatDate(obra.fecha_inicio)}
          </span>
        )}
        {obra.fecha_fin_estimada && (
          <span className="text-sm text-muted-foreground">
            Fin estimado: {formatDate(obra.fecha_fin_estimada)}
          </span>
        )}
        {cliente && (
          <span className="text-sm text-muted-foreground">
            Cliente: <span className="font-medium text-foreground">{cliente.nombre}</span>
          </span>
        )}
      </div>

      {/* ── Financial summary ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Presupuesto base aprobado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(resumen.presupuesto_aprobado)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gastos reales</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(resumen.total_gastos)}</p>
            {resumen.presupuesto_aprobado > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {((resumen.total_gastos / resumen.presupuesto_aprobado) * 100).toFixed(1)}% del presupuesto
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total certificado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(resumen.total_certificado)}</p>
            {resumen.presupuesto_aprobado > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {((resumen.total_certificado / resumen.presupuesto_aprobado) * 100).toFixed(1)}% del presupuesto
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resultado (cert − gastos)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-1 ${resultColor}`}>
              <ResultIcon className="h-5 w-5" />
              <p className="text-2xl font-bold">{formatCurrency(Math.abs(resumen.resultado))}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margen: {resumen.margen_porcentaje.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Presupuestos vinculados ───────────────────────────────────── */}
      {presupuestoRows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Presupuestos</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total presupuestado</TableHead>
                  <TableHead className="text-right">vs. Gastos reales</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {presupuestoRows.map((p) => {
                  const dif = p.total - resumen.total_gastos;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">v{p.version}</TableCell>
                      <TableCell>
                        <Badge variant={p.estado === "aprobado" ? "success" : "secondary"} className="text-xs">
                          {p.estado === "aprobado" ? "Aprobado" : "Borrador"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {formatCurrency(p.total)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm font-semibold ${diferenciaColorClass(dif)}`}>
                        {dif >= 0 ? "+" : ""}{formatCurrency(dif)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/presupuestos/${p.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Gastos ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Gastos ({(gastos ?? []).length})
          </h3>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/gastos/nuevo?obra_id=${obra.id}`}>
              <Plus className="h-4 w-4" />
              Agregar gasto
            </Link>
          </Button>
        </div>

        {(gastos ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
            No hay gastos registrados para esta obra.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(gastos ?? []).map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(g.fecha)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {CATEGORIA_GASTO_LABELS[g.categoria as CategoriaGasto]}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{g.descripcion}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(g.entidades as unknown as { nombre: string } | null)?.nombre ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(Number(g.monto))}
                    </TableCell>
                    <TableCell>
                      <DeleteButton
                        action={deleteGasto.bind(null, g.id, id)}
                        confirmMessage={`¿Eliminar el gasto "${g.descripcion}"?`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Certificaciones ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Certificaciones ({(certificaciones ?? []).length})
          </h3>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/certificaciones/nueva?obra_id=${obra.id}`}>
              <Plus className="h-4 w-4" />
              Nueva certificación
            </Link>
          </Button>
        </div>

        {(certificaciones ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
            No hay certificaciones registradas para esta obra.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Avance</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(certificaciones ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      #{c.numero ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {TIPO_CERT_LABELS[c.tipo as TipoCert]}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(c.fecha)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.porcentaje_avance != null ? `${c.porcentaje_avance}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(Number(c.monto))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.estado === "cobrada" ? "outline"
                          : c.estado === "aprobada" ? "success"
                          : "secondary"
                        }
                      >
                        {ESTADO_CERT_LABELS[c.estado as EstadoCert]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DeleteButton
                        action={deleteCertificacion.bind(null, c.id, id)}
                        confirmMessage={`¿Eliminar certificación #${c.numero}?`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Danger zone ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <h4 className="text-sm font-semibold text-destructive mb-2">Zona de peligro</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Eliminar la obra borrará también todos sus gastos, certificaciones y presupuestos.
        </p>
        <DeleteButton
          action={deleteObra.bind(null, obra.id)}
          label="Eliminar obra"
          confirmMessage={`¿Eliminar la obra "${obra.nombre}" y todos sus datos asociados? Esta acción es irreversible.`}
        />
      </div>
    </PageContainer>
  );
}
