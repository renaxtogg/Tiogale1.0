import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { GastoForm } from "@/components/forms/gasto-form";
import { createGasto } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Registrar Gasto" };
export const dynamic = "force-dynamic";

export default async function NuevoGastoPage({
  searchParams,
}: {
  searchParams: Promise<{ obra_id?: string }>;
}) {
  const { obra_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: obras }, { data: entidades }] = await Promise.all([
    supabase.from("obras").select("id, nombre").order("nombre"),
    supabase.from("entidades").select("id, nombre, tipo").order("nombre"),
  ]);

  return (
    <PageContainer
      title="Registrar Gasto"
      description="Registre un gasto real de ejecución."
    >
      <div className="max-w-2xl">
        <GastoForm
          action={createGasto}
          obras={obras ?? []}
          entidades={entidades ?? []}
          defaultObraId={obra_id}
        />
      </div>
    </PageContainer>
  );
}
