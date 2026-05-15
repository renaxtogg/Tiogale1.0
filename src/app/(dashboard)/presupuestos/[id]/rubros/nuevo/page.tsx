import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layout/page-container";
import { RubroNuevoForm } from "./form";
import { createRubro } from "../../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo Rubro" };
export const dynamic = "force-dynamic";

export default async function NuevoRubroPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ capitulo_id?: string }>;
}) {
  const { id } = await params;
  const { capitulo_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: presupuesto }, { data: capitulos }] = await Promise.all([
    supabase.from("presupuestos").select("id, nombre").eq("id", id).single(),
    supabase
      .from("capitulos")
      .select("id, codigo, nombre")
      .eq("presupuesto_id", id)
      .order("orden"),
  ]);

  if (!presupuesto) notFound();

  return (
    <PageContainer
      title="Nuevo Rubro"
      description={`Presupuesto: ${presupuesto.nombre}`}
    >
      <div className="max-w-2xl">
        <RubroNuevoForm
          action={createRubro.bind(null, id)}
          capitulos={capitulos ?? []}
          defaultCapituloId={capitulo_id}
          presupuestoId={id}
        />
      </div>
    </PageContainer>
  );
}
