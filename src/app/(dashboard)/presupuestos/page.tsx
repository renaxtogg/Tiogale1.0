import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calcularTotalGastos, calcularPorcentajeCertificado, calcularTotalCertificado } from "@/lib/calculations";
import { ESTADO_OBRA_LABELS } from "@/types";
import type { EstadoObra } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Presupuestos" };
export const dynamic = "force-dynamic";

export default async function PresupuestosPage() {
  const supabase = await createClient();

  const { data: obras, error } = await supabase
    .from("obras")
    .select(`
      id, nombre, estado, tipo_contrato, presupuesto_aprobado,
      gastos (monto),
      certificaciones (monto, estado),
      partidas (costo_estimado)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (obras ?? []).map((o) => {
    const gastos     = (o.gastos ?? []) as { monto: number }[];
    const certs      = (o.certificaciones ?? []) as { monto: number; estado: string }[];
    const totalGasto = calcularTotalGastos(gastos);
    const totalCert  = calcularTotalCertificado(certs);
    const pctCert    = calcularPorcentajeCertificado(Number(o.presupuesto_aprobado), totalCert);
    const totalPartidas = (o.partidas ?? []).reduce((s: number, p: { costo_estimado: number }) => s + Number(p.costo_estimado), 0);

    return {
      id:                   o.id,
      nombre:               o.nombre,
      estado:               o.estado as EstadoObra,
      tipo_contrato:        o.tipo_contrato,
      presupuesto_aprobado: Number(o.presupuesto_aprobado),
      total_partidas:       totalPartidas,
      total_gastos:         totalGasto,
      total_certificado:    totalCert,
      pct_certificado:      pctCert,
      desviacion:           totalGasto - Number(o.presupuesto_aprobado),
    };
  });

  return (
    <PageContainer
      title="Presupuestos"
      description="Control presupuestario por obra — presupuesto vs. ejecución real."
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay obras creadas"
          description="Cree obras para comenzar a gestionar presupuestos."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Presupuesto</TableHead>
                <TableHead className="text-right">Gastos reales</TableHead>
                <TableHead className="text-right">Desvío</TableHead>
                <TableHead className="text-right">Certificado</TableHead>
                <TableHead className="text-right">% certif.</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ESTADO_OBRA_LABELS[row.estado]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.presupuesto_aprobado)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.total_gastos)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm font-semibold ${
                      row.desviacion > 0 ? "text-destructive" : "text-emerald-600"
                    }`}
                  >
                    {row.desviacion > 0 ? "+" : ""}
                    {formatCurrency(row.desviacion)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.total_certificado)}
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm font-semibold ${
                      row.pct_certificado > 100 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {row.pct_certificado.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/obras/${row.id}`}>
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
