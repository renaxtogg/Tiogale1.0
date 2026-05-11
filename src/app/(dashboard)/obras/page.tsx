import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, FolderOpen, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calcularTotalGastos, calcularTotalCertificado } from "@/lib/calculations";
import { ESTADO_OBRA_LABELS, TIPO_CONTRATO_LABELS } from "@/types";
import type { EstadoObra } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Obras" };
export const dynamic = "force-dynamic";

const ESTADO_VARIANT: Record<EstadoObra, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  planning:  "secondary",
  active:    "success",
  paused:    "warning",
  completed: "outline",
  cancelled: "destructive",
};

export default async function ObrasPage() {
  const supabase = await createClient();

  const { data: obras, error } = await supabase
    .from("obras")
    .select(`
      id, nombre, tipo_contrato, estado, presupuesto_aprobado, fecha_inicio,
      entidades!obras_cliente_id_fkey (nombre),
      gastos (monto),
      certificaciones (monto, estado)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (obras ?? []).map((o) => {
    const gastos     = (o.gastos ?? []) as { monto: number }[];
    const certs      = (o.certificaciones ?? []) as { monto: number; estado: string }[];
    const totalGasto = calcularTotalGastos(gastos);
    const totalCert  = calcularTotalCertificado(certs);
    return {
      ...o,
      cliente_nombre: (o.entidades as unknown as { nombre: string } | null)?.nombre ?? null,
      total_gastos:       totalGasto,
      total_certificado:  totalCert,
      resultado:          totalCert - totalGasto,
    };
  });

  return (
    <PageContainer
      title="Obras"
      description="Gestión de proyectos de construcción."
      actions={
        <Button asChild size="sm">
          <Link href="/obras/nueva">
            <Plus className="h-4 w-4" />
            Nueva obra
          </Link>
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No hay obras registradas"
          description="Cree su primera obra para comenzar a gestionar proyectos de construcción."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Presupuesto</TableHead>
                <TableHead className="text-right">Gastos</TableHead>
                <TableHead className="text-right">Certificado</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((obra) => (
                <TableRow key={obra.id}>
                  <TableCell className="font-medium">
                    <div>{obra.nombre}</div>
                    {obra.cliente_nombre && (
                      <div className="text-xs text-muted-foreground">
                        {obra.cliente_nombre}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {TIPO_CONTRATO_LABELS[obra.tipo_contrato as import('@/types').TipoContrato]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ESTADO_VARIANT[obra.estado as EstadoObra]}>
                      {ESTADO_OBRA_LABELS[obra.estado as EstadoObra]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(Number(obra.presupuesto_aprobado))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(obra.total_gastos)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(obra.total_certificado)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm font-semibold ${
                      obra.resultado >= 0 ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {formatCurrency(obra.resultado)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/obras/${obra.id}`}>
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
