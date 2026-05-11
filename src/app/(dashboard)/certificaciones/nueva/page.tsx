import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { CertificacionForm } from "@/components/forms/certificacion-form";
import { createCertificacion } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva Certificación" };
export const dynamic = "force-dynamic";

export default async function NuevaCertificacionPage({
  searchParams,
}: {
  searchParams: Promise<{ obra_id?: string }>;
}) {
  const { obra_id } = await searchParams;
  const supabase = await createClient();

  const { data: obras } = await supabase
    .from("obras")
    .select("id, nombre, tipo_contrato, presupuesto_aprobado")
    .in("estado", ["planning", "active", "paused"])
    .order("nombre");

  return (
    <PageContainer
      title="Nueva Certificación"
      description="Emita una certificación de avance de obra."
    >
      <div className="max-w-2xl">
        <CertificacionForm
          action={createCertificacion}
          obras={obras ?? []}
          defaultObraId={obra_id}
        />
      </div>
    </PageContainer>
  );
}
