import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, Plus, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calcularTotalPresupuesto, enrichCapitulos, enrichRubros } from "@/lib/budget";
import { totalGastos } from "@/lib/expenses";
import { diferenciaColorClass } from "@/lib/comparisons";
import {
  ESTADO_PRESUPUESTO_LABELS,
  TIPO_CONTRATO_LABELS,
} from "@/types";
import type { EstadoPresupuesto, RubroRow, CapituloRow, AnalisisCostoItemRow } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Presupuestos" };
export const dynamic = "force-dynamic";

export default async function PresupuestosPage() {
  const supabase = await createClient();

  const { data: presupuestos, error } = await supabase
    .from("presupuestos")
    .select(`
      id, nombre, version, estado,
      obras (id, nombre, tipo_contrato,
        gastos (monto)
      ),
      capitulos (
        id, presupuesto_id, codigo, nombre, orden, created_at, updated_at,
        rubros (
          id, capitulo_id, catalogo_rubro_id, codigo, nombre,
          unidad, cantidad, precio_unitario, tipo_ejecucion, orden,
          created_at, updated_at,
          analisis_costo_items (
            id, rubro_id, tipo, descripcion, unidad,
            cantidad, precio_unitario, created_at, updated_at
          )
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (presupuestos ?? []).map((p) => {
    const obra       = p.obras as unknown as { id: string; nombre: string; tipo_contrato: string; gastos: { monto: number }[] } | null;
    const gastosList = obra?.gastos ?? [];

    const capitulos = (p.capitulos ?? []) as unknown as (CapituloRow & {
      rubros: (RubroRow & { analisis_costo_items: AnalisisCostoItemRow[] })[];
    })[];

    // Build lookup maps for enrichment
    const acuMap = new Map<string, AnalisisCostoItemRow[]>();
    const rubroMap = new Map<string, ReturnType<typeof enrichRubros>[number][]>();

    for (const cap of capitulos) {
      for (const r of cap.rubros) {
        acuMap.set(r.id, r.analisis_costo_items);
      }
      const enrichedRubros = enrichRubros(cap.rubros as RubroRow[], acuMap);
      rubroMap.set(cap.id, enrichedRubros);
    }

    const enrichedCaps = enrichCapitulos(capitulos as CapituloRow[], rubroMap);
    const total        = calcularTotalPresupuesto(enrichedCaps);
    const realTotal    = totalGastos(gastosList);
    const diferencia   = total - realTotal;

    return {
      id:           p.id,
      nombre:       p.nombre,
      version:      p.version,
      estado:       p.estado as EstadoPresupuesto,
      obra_id:      obra?.id ?? null,
      obra_nombre:  obra?.nombre ?? "—",
      tipo_contrato: obra?.tipo_contrato ?? "cerrado",
      total,
      real_total:   realTotal,
      diferencia,
    };
  });

  return (
    <PageContainer
      title="Presupuestos"
      description="Presupuestos contractuales separados del costo real de ejecución."
      actions={
        <Button asChild size="sm">
          <Link href="/presupuestos/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </Link>
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay presupuestos"
          description="Cree un presupuesto para comenzar a estructurar capítulos, rubros y análisis de costos."
          action={
            <Button asChild size="sm">
              <Link href="/presupuestos/nuevo">
                <Plus className="h-4 w-4" />
                Nuevo presupuesto
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total presupuestado</TableHead>
                <TableHead className="text-right">Gastos reales</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.obra_nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.nombre} v{row.version}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TIPO_CONTRATO_LABELS[row.tipo_contrato as "cerrado" | "abierto"]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.estado === "aprobado" ? "success" : "secondary"}>
                      {ESTADO_PRESUPUESTO_LABELS[row.estado]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(row.total)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.real_total)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm font-semibold ${diferenciaColorClass(row.diferencia)}`}>
                    {row.diferencia >= 0 ? "+" : ""}{formatCurrency(row.diferencia)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/presupuestos/${row.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
