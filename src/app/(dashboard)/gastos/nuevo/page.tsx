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
  searchParams: Promise<{ obra_id?: string; rubro_id?: string }>;
}) {
  const { obra_id, rubro_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: obras }, { data: entidades }, { data: rawRubros }] = await Promise.all([
    supabase.from("obras").select("id, nombre").order("nombre"),
    supabase.from("entidades").select("id, nombre, tipo").order("nombre"),
    supabase
      .from("rubros")
      .select("id, nombre, capitulos(nombre)")
      .order("nombre"),
  ]);

  // Flatten rubros with capitulo name
  const rubros = (rawRubros ?? []).map((r) => ({
    id:              r.id,
    nombre:          r.nombre,
    capitulo_nombre: (r.capitulos as unknown as { nombre: string } | null)?.nombre ?? "—",
  }));

  return (
    <PageContainer
      title="Registrar Gasto Real"
      description="Gastos reales de ejecución. Separados del presupuesto contractual."
    >
      <div className="max-w-2xl">
        <GastoForm
          action={createGasto}
          obras={obras ?? []}
          entidades={entidades ?? []}
          rubros={rubros}
          defaultObraId={obra_id}
          defaultRubroId={rubro_id}
        />
      </div>
    </PageContainer>
  );
}
