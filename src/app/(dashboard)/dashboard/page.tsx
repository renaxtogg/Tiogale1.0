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
import {
  FolderOpen, Receipt, Award, TrendingUp, TrendingDown, Plus, Eye,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcularStatsDashboard, calcularTotalCertificado } from "@/lib/calculations";
import { ESTADO_OBRA_LABELS } from "@/types";
import type { EstadoObra } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const ESTADO_VARIANT: Record<EstadoObra, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  planning: "secondary", active: "success", paused: "warning",
  completed: "outline",  cancelled: "destructive",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: obras },
    { data: gastosRecientes },
    { data: certsRecientes },
  ] = await Promise.all([
    supabase
      .from("obras")
      .select(`
        id, nombre, estado, presupuesto_aprobado,
        gastos (monto),
        certificaciones (monto, estado)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("gastos")
      .select("id, descripcion, monto, fecha, obras(nombre)")
      .order("fecha", { ascending: false })
      .limit(5),
    supabase
      .from("certificaciones")
      .select("id, numero, monto, estado, fecha, obras(nombre)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = calcularStatsDashboard(
    (obras ?? []).map((o) => ({
      estado:           o.estado,
      gastos:           (o.gastos ?? []) as { monto: number }[],
      certificaciones:  (o.certificaciones ?? []) as { monto: number; estado: string }[],
    }))
  );

  const kpis = [
    {
      label:   "Obras activas",
      value:   stats.totalObrasActivas,
      icon:    FolderOpen,
      format:  "count" as const,
      color:   "text-blue-600",
    },
    {
      label:   "Total gastos",
      value:   stats.totalGastos,
      icon:    Receipt,
      format:  "currency" as const,
      color:   "text-destructive",
    },
    {
      label:   "Total certificado",
      value:   stats.totalCertificado,
      icon:    Award,
      format:  "currency" as const,
      color:   "text-emerald-600",
    },
    {
      label:   "Resultado global",
      value:   stats.resultadoGlobal,
      icon:    stats.resultadoGlobal >= 0 ? TrendingUp : TrendingDown,
      format:  "currency" as const,
      color:   stats.resultadoGlobal >= 0 ? "text-emerald-600" : "text-destructive",
    },
  ];

  return (
    <PageContainer title="Dashboard" description="Resumen financiero del sistema.">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, format, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${color}`}>
                {format === "currency" ? formatCurrency(value as number) : value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Obras list + recent activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Obras overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Obras</CardTitle>
              <CardDescription>Estado financiero por proyecto</CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href="/obras/nueva">
                <Plus className="h-4 w-4" />
                Nueva
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(obras ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay obras creadas aún.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Cert.</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(obras ?? []).slice(0, 8).map((obra) => {
                    const certs = (obra.certificaciones ?? []) as { monto: number; estado: string }[];
                    const gastos = (obra.gastos ?? []) as { monto: number }[];
                    const totalCert = calcularTotalCertificado(certs);
                    const totalGasto = gastos.reduce((s, g) => s + Number(g.monto), 0);
                    return (
                      <TableRow key={obra.id}>
                        <TableCell className="font-medium text-sm">
                          {obra.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ESTADO_VARIANT[obra.estado as EstadoObra]}>
                            {ESTADO_OBRA_LABELS[obra.estado as EstadoObra]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(totalCert)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(totalGasto)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/obras/${obra.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Últimos gastos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(gastosRecientes ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin gastos recientes.</p>
              ) : (
                (gastosRecientes ?? []).map((g) => (
                  <div key={g.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{g.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        {(g.obras as unknown as { nombre: string } | null)?.nombre ?? "—"} · {formatDate(g.fecha)}
                      </p>
                    </div>
                    <p className="text-sm font-mono font-medium text-destructive shrink-0">
                      {formatCurrency(Number(g.monto))}
                    </p>
                  </div>
                ))
              )}
              <Button variant="ghost" size="sm" className="w-full mt-1" asChild>
                <Link href="/gastos">Ver todos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Últimas certificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(certsRecientes ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin certificaciones recientes.</p>
              ) : (
                (certsRecientes ?? []).map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {(c.obras as unknown as { nombre: string } | null)?.nombre ?? "—"} — #{c.numero}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(c.fecha)}</p>
                    </div>
                    <p className="text-sm font-mono font-medium text-emerald-600 shrink-0">
                      {formatCurrency(Number(c.monto))}
                    </p>
                  </div>
                ))
              )}
              <Button variant="ghost" size="sm" className="w-full mt-1" asChild>
                <Link href="/certificaciones">Ver todas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
