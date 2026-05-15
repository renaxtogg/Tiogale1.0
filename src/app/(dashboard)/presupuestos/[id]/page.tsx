import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { ChevronLeft } from "lucide-react";
import { enrichRubros, enrichCapitulos, calcularTotalPresupuesto } from "@/lib/budget";
import { PresupuestoEditor } from "@/components/presupuestos/presupuesto-editor";
import { deletePresupuesto } from "./actions";
import type {
  RubroRow, CapituloRow, AnalisisCostoItemRow,
  CatalogoRubroRow, CatalogoAcuItemRow,
} from "@/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("presupuestos")
    .select("nombre, obras(nombre)")
    .eq("id", id)
    .single();
  const obraNombre = (data?.obras as unknown as { nombre: string } | null)?.nombre;
  return { title: data ? `${data.nombre} — ${obraNombre ?? ""}` : "Presupuesto" };
}

export default async function PresupuestoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch presupuesto + nested data in parallel
  const [
    { data: presupuesto, error },
    { data: rawCapitulos },
    { data: catalogoRubros },
  ] = await Promise.all([
    supabase
      .from("presupuestos")
      .select("*, obras(id, nombre, tipo_contrato)")
      .eq("id", id)
      .single(),
    supabase
      .from("capitulos")
      .select(`
        id, presupuesto_id, codigo, nombre, orden, created_at, updated_at,
        rubros (
          id, capitulo_id, catalogo_rubro_id, codigo, nombre,
          unidad, cantidad, precio_unitario, tipo_ejecucion, orden,
          created_at, updated_at,
          analisis_costo_items (
            id, rubro_id, tipo, descripcion, unidad,
            cantidad, precio_unitario, created_at, updated_at
          )
        )
      `)
      .eq("presupuesto_id", id)
      .order("orden"),
    supabase
      .from("catalogo_rubros")
      .select("*, catalogo_acu_items(*)")
      .eq("activo", true)
      .order("nombre"),
  ]);

  if (error || !presupuesto) notFound();

  const obra = presupuesto.obras as unknown as {
    id: string; nombre: string; tipo_contrato: string;
  } | null;

  // Enrich chapters → rubros → ACU for calculations
  const capitulos = (rawCapitulos ?? []) as unknown as (CapituloRow & {
    rubros: (RubroRow & { analisis_costo_items: AnalisisCostoItemRow[] })[];
  })[];

  const acuMap   = new Map<string, AnalisisCostoItemRow[]>();
  const rubroMap = new Map<string, ReturnType<typeof enrichRubros>[number][]>();

  for (const cap of capitulos) {
    for (const r of cap.rubros ?? []) acuMap.set(r.id, r.analisis_costo_items ?? []);
    rubroMap.set(cap.id, enrichRubros((cap.rubros ?? []) as RubroRow[], acuMap));
  }

  const enrichedCaps   = enrichCapitulos(capitulos as CapituloRow[], rubroMap);
  const totalPresupuestado = calcularTotalPresupuesto(enrichedCaps);

  // Build catalog with ACU items for the editor
  const catalogo = (catalogoRubros ?? []).map((c) => ({
    ...(c as unknown as CatalogoRubroRow),
    acu_items: (c.catalogo_acu_items ?? []) as unknown as CatalogoAcuItemRow[],
  }));

  return (
    <main className="flex-1 p-4 lg:p-6 space-y-4">
      {/* Breadcrumb + danger zone trigger */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/presupuestos">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Presupuestos
          </Link>
        </Button>
        <DeleteButton
          action={deletePresupuesto.bind(null, id)}
          label="Eliminar presupuesto"
          confirmMessage={`¿Eliminar "${presupuesto.nombre}" y todos sus datos?`}
        />
      </div>

      {/* Main interactive editor */}
      <PresupuestoEditor
        presupuesto={presupuesto}
        capitulos={enrichedCaps}
        totalPresupuestado={totalPresupuestado}
        obraNombre={obra?.nombre ?? "Sin obra"}
        catalogo={catalogo}
      />
    </main>
  );
}
