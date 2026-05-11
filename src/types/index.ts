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
  ObraRow,
  EntidadRow,
  PartidaRow,
  PartidaItemRow,
  GastoRow,
  CertificacionRow,
  MovimientoRow,
} from './supabase';

// ─── Server Action state ───────────────────────────────────────────────────────
export type FormState = {
  error?:       string;
  success?:     string;
  fieldErrors?: Partial<Record<string, string>>;
};

// ─── Enriched query result types (common join shapes) ─────────────────────────

/** Obra with aggregated financial totals (computed from related rows) */
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
  resultado:            number; // total_certificado - total_gastos
};

/** Gasto with obra name and entidad name for display */
export type GastoConRelaciones = import('./supabase').GastoRow & {
  obra_nombre:    string | null;
  entidad_nombre: string | null;
};

/** Certificacion with obra name for display */
export type CertificacionConObra = import('./supabase').CertificacionRow & {
  obra_nombre:          string | null;
  presupuesto_aprobado: number;
  tipo_contrato:        import('./supabase').TipoContrato;
};

// ─── Financial summary for a single obra ──────────────────────────────────────
export type ResumenFinanciero = {
  presupuesto_aprobado:  number;
  total_gastos:          number;
  total_certificado:     number;
  resultado:             number;  // certified - spent
  desviacion_vs_presup:  number;  // gastos - presupuesto (positive = over budget)
  margen_porcentaje:     number;  // resultado / presupuesto * 100
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export type PaginationState = {
  page:     number;
  pageSize: number;
  total:    number;
};

// ─── Generic API response wrapper ─────────────────────────────────────────────
export type ActionResult<T = void> = {
  data?:  T;
  error?: string;
};

// ─── Label helpers for enum values ───────────────────────────────────────────
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
