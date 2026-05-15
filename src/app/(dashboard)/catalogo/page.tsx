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
import { BookOpen, Plus } from "lucide-react";
import { TIPO_EJECUCION_LABELS } from "@/types";
import type { TipoEjecucion } from "@/types";
import { deleteCatalogoRubro } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catálogo de Rubros" };
export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const supabase = await createClient();

  const { data: rubros, error } = await supabase
    .from("catalogo_rubros")
    .select("*")
    .order("nombre");

  if (error) throw error;

  return (
    <PageContainer
      title="Catálogo de Rubros"
      description="Biblioteca de rubros reutilizables. Úselos como plantillas al armar presupuestos."
      actions={
        <Button asChild size="sm">
          <Link href="/catalogo/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo rubro
          </Link>
        </Button>
      }
    >
      {(rubros ?? []).length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Catálogo vacío"
          description="Agregue rubros reutilizables como Excavación, Mampostería, Topografía, etc."
          action={
            <Button asChild size="sm">
              <Link href="/catalogo/nuevo">
                <Plus className="h-4 w-4" />
                Nuevo rubro
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-20">Unidad</TableHead>
                <TableHead className="w-32">Tipo</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rubros ?? []).map((r) => (
                <TableRow key={r.id} className={!r.activo ? "opacity-50" : undefined}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.codigo ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">{r.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.unidad}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {TIPO_EJECUCION_LABELS[r.tipo_ejecucion as TipoEjecucion]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.activo ? "success" : "secondary"} className="text-xs">
                      {r.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      action={deleteCatalogoRubro.bind(null, r.id)}
                      confirmMessage={`¿Eliminar el rubro "${r.nombre}" del catálogo?`}
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
