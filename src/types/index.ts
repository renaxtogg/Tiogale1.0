export type {
  TipoContrato,
  EstadoObra,
  TipoEntidad,
  TipoEjecucion,
  TipoItem,
  CategoriaGasto,
  TipoCert,
  EstadoCert,
  TipoMovimiento,
  EstadoPresupuesto,
  ObraRow,
  EntidadRow,
  PartidaRow,
  PartidaItemRow,
  GastoRow,
  CertificacionRow,
  MovimientoRow,
  CatalogoRubroRow,
  CatalogoAcuItemRow,
  PresupuestoRow,
  CapituloRow,
  RubroRow,
  AnalisisCostoItemRow,
} from './supabase';

// ─── Server Action state ───────────────────────────────────────────────────────
export type FormState = {
  error?:       string;
  success?:     string;
  fieldErrors?: Partial<Record<string, string>>;
};

// ─── Enriched query result types (common join shapes) ─────────────────────────

export type ObraConTotales = {
  id:                   string;
  nombre:               string;
  tipo_contrato:        import('./supabase').TipoContrato;
  estado:               import('./supabase').EstadoObra;
  presupuesto_aprobado: number;
  fecha_inicio:         string | null;
  fecha_fin_estimada:   string | null;
  cliente_nombre:       string | null;
  total_gastos:         number;
  total_certificado:    number;
  resultado:            number;
};

export type GastoConRelaciones = import('./supabase').GastoRow & {
  obra_nombre:    string | null;
  entidad_nombre: string | null;
  rubro_nombre:   string | null;
};

export type CertificacionConObra = import('./supabase').CertificacionRow & {
  obra_nombre:          string | null;
  presupuesto_aprobado: number;
  tipo_contrato:        import('./supabase').TipoContrato;
};

// ─── Budget structure enriched types ──────────────────────────────────────────

export type AcuItemConSubtotal = import('./supabase').AnalisisCostoItemRow & {
  subtotal: number;
};

export type RubroConAcu = import('./supabase').RubroRow & {
  subtotal:            number;
  acu_total:           number;
  analisis_costo_items: AcuItemConSubtotal[];
};

export type CapituloConRubros = import('./supabase').CapituloRow & {
  subtotal: number;
  rubros:   RubroConAcu[];
};

export type PresupuestoConDetalle = import('./supabase').PresupuestoRow & {
  total:    number;
  obra_nombre: string;
  capitulos: CapituloConRubros[];
};

// ─── Budget vs Real comparison ────────────────────────────────────────────────

export type ComparacionRubro = {
  rubro_id:    string;
  rubro_nombre: string;
  presupuestado: number;
  real:          number;
  diferencia:    number;
  desviacion_pct: number;
};

export type ComparacionPresupuesto = {
  presupuesto_id:  string;
  obra_nombre:     string;
  total_presup:    number;
  total_real:      number;
  diferencia:      number;
  desviacion_pct:  number;
  rubros:          ComparacionRubro[];
};

// ─── Financial summary for a single obra ──────────────────────────────────────
export type ResumenFinanciero = {
  presupuesto_aprobado:  number;
  total_gastos:          number;
  total_certificado:     number;
  resultado:             number;
  desviacion_vs_presup:  number;
  margen_porcentaje:     number;
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export type PaginationState = {
  page:     number;
  pageSize: number;
  total:    number;
};

// ─── Generic API response wrapper ─────────────────────────────────────────────
export type ActionResult<T = void> = {
  data?:    T;
  error?:   string;
  code?:    string;
  success?: string;
};

// ─── Label helpers ────────────────────────────────────────────────────────────

export const ESTADO_OBRA_LABELS: Record<import('./supabase').EstadoObra, string> = {
  planning:  'Planificación',
  active:    'Activa',
  paused:    'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const TIPO_CONTRATO_LABELS: Record<import('./supabase').TipoContrato, string> = {
  cerrado: 'Precio Cerrado',
  abierto: 'Ajustable',
};

export const TIPO_ENTIDAD_LABELS: Record<import('./supabase').TipoEntidad, string> = {
  cliente:        'Cliente',
  proveedor:      'Proveedor',
  subcontratista: 'Subcontratista',
  empleado:       'Empleado',
};

export const CATEGORIA_GASTO_LABELS: Record<import('./supabase').CategoriaGasto, string> = {
  material:    'Materiales',
  mano_obra:   'Mano de Obra',
  subcontrato: 'Subcontrato',
  equipo:      'Equipos',
  otro:        'Otros',
};

export const ESTADO_CERT_LABELS: Record<import('./supabase').EstadoCert, string> = {
  borrador: 'Borrador',
  aprobada: 'Aprobada',
  cobrada:  'Cobrada',
};

export const TIPO_CERT_LABELS: Record<import('./supabase').TipoCert, string> = {
  normal:   'Normal',
  anticipo: 'Anticipo',
};

export const TIPO_EJECUCION_LABELS: Record<import('./supabase').TipoEjecucion, string> = {
  propio:        'Propio',
  subcontratado: 'Subcontratado',
};

export const TIPO_ITEM_LABELS: Record<import('./supabase').TipoItem, string> = {
  material:  'Material',
  mano_obra: 'Mano de Obra',
  equipo:    'Equipo',
  otro:      'Otro',
};

export const ESTADO_PRESUPUESTO_LABELS: Record<import('./supabase').EstadoPresupuesto, string> = {
  borrador: 'Borrador',
  aprobado: 'Aprobado',
};
