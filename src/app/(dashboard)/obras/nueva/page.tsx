import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { ObraForm } from "@/components/forms/obra-form";
import { createObra } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva Obra" };
export const dynamic = "force-dynamic";

export default async function NuevaObraPage() {
  const supabase = await createClient();

  // Only clients are relevant in the obra form
  const { data: clientes } = await supabase
    .from("entidades")
    .select("id, nombre")
    .eq("tipo", "cliente")
    .eq("activo", true)
    .order("nombre");

  return (
    <PageContainer
      title="Nueva Obra"
      description="Complete los datos para registrar un nuevo proyecto."
    >
      <div className="max-w-2xl">
        <ObraForm action={createObra} clientes={clientes ?? []} />
      </div>
    </PageContainer>
  );
}
