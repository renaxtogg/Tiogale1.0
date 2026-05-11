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
import { Plus, Award } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ESTADO_CERT_LABELS,
  TIPO_CERT_LABELS,
  TIPO_CONTRATO_LABELS,
} from "@/types";
import type { EstadoCert, TipoCert } from "@/types";
import { deleteCertificacion, updateEstadoCertificacion } from "./actions";
import { CertEstadoButton } from "./cert-estado-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Certificaciones" };
export const dynamic = "force-dynamic";

const ESTADO_VARIANT: Record<EstadoCert, "secondary" | "success" | "outline"> = {
  borrador: "secondary",
  aprobada: "success",
  cobrada:  "outline",
};

export default async function CertificacionesPage() {
  const supabase = await createClient();

  const { data: certs, error } = await supabase
    .from("certificaciones")
    .select(`
      *,
      obras (nombre, tipo_contrato, presupuesto_aprobado)
    `)
    .order("fecha", { ascending: false });

  if (error) throw error;

  const rows = (certs ?? []).map((c) => ({
    ...c,
    obra_nombre:          (c.obras as unknown as { nombre: string } | null)?.nombre ?? "—",
    presupuesto_aprobado: (c.obras as unknown as { presupuesto_aprobado: number } | null)?.presupuesto_aprobado ?? 0,
    tipo_contrato:        (c.obras as unknown as { tipo_contrato: string } | null)?.tipo_contrato ?? "cerrado",
  }));

  const totalAprobado = rows
    .filter((c) => c.estado !== "borrador")
    .reduce((s, c) => s + Number(c.monto), 0);

  const totalCobrado = rows
    .filter((c) => c.estado === "cobrada")
    .reduce((s, c) => s + Number(c.monto), 0);

  return (
    <PageContainer
      title="Certificaciones"
      description="Gestión de certificaciones de obra para facturación al cliente."
      actions={
        <Button asChild size="sm">
          <Link href="/certificaciones/nueva">
            <Plus className="h-4 w-4" />
            Nueva certificación
          </Link>
        </Button>
      }
    >
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total certificado</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalAprobado)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total cobrado</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalCobrado)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {formatCurrency(totalAprobado - totalCobrado)}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No hay certificaciones registradas"
          description="Genere certificaciones de avance de obra para gestionar la facturación a clientes."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nro</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Avance</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    #{cert.numero ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{cert.obra_nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {TIPO_CONTRATO_LABELS[cert.tipo_contrato as "cerrado" | "abierto"]}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {TIPO_CERT_LABELS[cert.tipo as TipoCert]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(cert.fecha)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cert.porcentaje_avance != null ? `${cert.porcentaje_avance}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(Number(cert.monto))}
                  </TableCell>
                  <TableCell>
                    <CertEstadoButton cert={cert} />
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      action={deleteCertificacion.bind(null, cert.id)}
                      confirmMessage={`¿Eliminar certificación #${cert.numero}?`}
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
