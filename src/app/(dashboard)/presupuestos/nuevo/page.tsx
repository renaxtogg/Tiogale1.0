import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { PresupuestoForm } from "@/components/forms/presupuesto-form";
import { createPresupuesto } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo Presupuesto" };
export const dynamic = "force-dynamic";

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ obra_id?: string }>;
}) {
  const { obra_id } = await searchParams;
  const supabase = await createClient();
  const { data: obras } = await supabase.from("obras").select("id, nombre").order("nombre");

  return (
    <PageContainer
      title="Nuevo Presupuesto"
      description="Cree un presupuesto contractual para una obra. Luego podrá agregar capítulos y rubros."
    >
      <div className="max-w-xl">
        <PresupuestoForm
          action={createPresupuesto}
          obras={obras ?? []}
          defaultObraId={obra_id}
        />
      </div>
    </PageContainer>
  );
}
