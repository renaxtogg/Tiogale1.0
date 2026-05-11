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
import { Plus, Users } from "lucide-react";
import { TIPO_ENTIDAD_LABELS } from "@/types";
import type { TipoEntidad } from "@/types";
import { deleteEntidad } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Entidades" };
export const dynamic = "force-dynamic";

const TIPO_VARIANT: Record<TipoEntidad, "default" | "secondary" | "success" | "warning"> = {
  cliente:        "default",
  proveedor:      "secondary",
  subcontratista: "warning",
  empleado:       "success",
};

export default async function EntidadesPage() {
  const supabase = await createClient();

  const { data: entidades, error } = await supabase
    .from("entidades")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  if (error) throw error;

  return (
    <PageContainer
      title="Entidades"
      description="Clientes, proveedores y subcontratistas."
      actions={
        <Button asChild size="sm">
          <Link href="/entidades/nueva">
            <Plus className="h-4 w-4" />
            Nueva entidad
          </Link>
        </Button>
      }
    >
      {(entidades ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay entidades registradas"
          description="Registre clientes, proveedores y subcontratistas para vincularlos a sus obras."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CUIT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entidades ?? []).map((entidad) => (
                <TableRow key={entidad.id}>
                  <TableCell className="font-medium">{entidad.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={TIPO_VARIANT[entidad.tipo as TipoEntidad]}>
                      {TIPO_ENTIDAD_LABELS[entidad.tipo as TipoEntidad]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entidad.cuit ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entidad.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entidad.telefono ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      action={deleteEntidad.bind(null, entidad.id)}
                      confirmMessage={`¿Eliminar "${entidad.nombre}"? Esta acción no se puede deshacer.`}
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
