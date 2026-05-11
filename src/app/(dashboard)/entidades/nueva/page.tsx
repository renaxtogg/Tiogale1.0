import { PageContainer } from "@/components/layout/page-container";
import { EntidadForm } from "@/components/forms/entidad-form";
import { createEntidad } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva Entidad" };

export default function NuevaEntidadPage() {
  return (
    <PageContainer
      title="Nueva Entidad"
      description="Registre un cliente, proveedor, subcontratista o empleado."
    >
      <div className="max-w-2xl">
        <EntidadForm action={createEntidad} />
      </div>
    </PageContainer>
  );
}
