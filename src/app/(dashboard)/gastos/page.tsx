import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/shared/delete-button";
import { Plus, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORIA_GASTO_LABELS } from "@/types";
import type { CategoriaGasto } from "@/types";
import { deleteGasto } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gastos" };
export const dynamic = "force-dynamic";

const CAT_VARIANT: Record<CategoriaGasto, "default" | "secondary" | "warning" | "success" | "outline"> = {
  material:    "default",
  mano_obra:   "success",
  subcontrato: "warning",
  equipo:      "secondary",
  otro:        "outline",
};

export default async function GastosPage() {
  const supabase = await createClient();

  const { data: gastos, error } = await supabase
    .from("gastos")
    .select(`
      *,
      obras (nombre),
      entidades (nombre)
    `)
    .order("fecha", { ascending: false })
    .limit(200);

  if (error) throw error;

  const rows = (gastos ?? []).map((g) => ({
    ...g,
    obra_nombre:    (g.obras as unknown as { nombre: string } | null)?.nombre ?? "—",
    entidad_nombre: (g.entidades as unknown as { nombre: string } | null)?.nombre ?? "—",
  }));

  // Compute totals for summary cards
  const totalMes = rows
    .filter((g) => {
      const d = new Date(g.fecha);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((s, g) => s + Number(g.monto), 0);

  const totalAll = rows.reduce((s, g) => s + Number(g.monto), 0);

  return (
    <PageContainer
      title="Gastos"
      description="Registro y control de gastos por obra."
      actions={
        <Button asChild size="sm">
          <Link href="/gastos/nuevo">
            <Plus className="h-4 w-4" />
            Registrar gasto
          </Link>
        </Button>
      }
    >
      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Este mes</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalMes)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total acumulado</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalAll)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Registros totales</p>
          <p className="mt-1 text-2xl font-bold">{rows.length}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No hay gastos registrados"
          description="Registre los gastos de cada obra para hacer seguimiento del presupuesto consumido."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((gasto) => (
                <TableRow key={gasto.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(gasto.fecha)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {gasto.obra_nombre}
                  </TableCell>
                  <TableCell>
                    <Badge variant={CAT_VARIANT[gasto.categoria as CategoriaGasto]}>
                      {CATEGORIA_GASTO_LABELS[gasto.categoria as CategoriaGasto]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {gasto.descripcion}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {gasto.entidad_nombre}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {formatCurrency(Number(gasto.monto))}
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      action={deleteGasto.bind(null, gasto.id)}
                      confirmMessage={`¿Eliminar el gasto "${gasto.descripcion}"?`}
                    />
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
