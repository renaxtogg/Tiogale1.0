// ================================================================
// Supabase Database Types
// Replace with auto-generated output after running migrations:
//   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
// ================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ─── Enum types (mirror SQL CHECK constraints) ───────────────────────────────
export type TipoContrato   = 'cerrado' | 'abierto';
export type EstadoObra     = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
export type TipoEntidad    = 'cliente' | 'proveedor' | 'subcontratista' | 'empleado';
export type TipoEjecucion  = 'propio' | 'tercerizado';
export type TipoItem       = 'material' | 'mano_obra' | 'equipo' | 'otro';
export type CategoriaGasto = 'material' | 'mano_obra' | 'subcontrato' | 'equipo' | 'otro';
export type TipoCert       = 'normal' | 'anticipo';
export type EstadoCert     = 'borrador' | 'aprobada' | 'cobrada';
export type TipoMovimiento = 'ingreso' | 'egreso';

// ─── Row types (shape of DB rows returned by SELECT) ────────────────────────

export type EntidadRow = {
  id: string; nombre: string; tipo: TipoEntidad;
  cuit: string | null; email: string | null;
  telefono: string | null; direccion: string | null;
  activo: boolean; created_at: string; updated_at: string;
};

export type ObraRow = {
  id: string; nombre: string; descripcion: string | null;
  tipo_contrato: TipoContrato; estado: EstadoObra;
  presupuesto_aprobado: number;
  fecha_inicio: string | null; fecha_fin_estimada: string | null; fecha_fin_real: string | null;
  cliente_id: string | null; created_at: string; updated_at: string;
};

export type PartidaRow = {
  id: string; obra_id: string; parent_id: string | null;
  codigo: string | null; nombre: string;
  tipo_ejecucion: TipoEjecucion; costo_estimado: number; orden: number;
  created_at: string; updated_at: string;
};

export type PartidaItemRow = {
  id: string; partida_id: string; nombre: string;
  tipo: TipoItem; cantidad: number; unidad: string; precio_unitario: number;
  created_at: string;
};

export type GastoRow = {
  id: string; obra_id: string; partida_id: string | null; entidad_id: string | null;
  categoria: CategoriaGasto; descripcion: string; monto: number;
  fecha: string; comprobante: string | null; created_at: string; updated_at: string;
};

export type CertificacionRow = {
  id: string; obra_id: string; numero: number | null;
  tipo: TipoCert; estado: EstadoCert; monto: number;
  porcentaje_avance: number | null;
  fecha: string; fecha_aprobacion: string | null; fecha_cobro: string | null;
  observaciones: string | null; created_at: string; updated_at: string;
};

export type MovimientoRow = {
  id: string; obra_id: string | null; entidad_id: string | null;
  tipo: TipoMovimiento; concepto: string; monto: number; fecha: string;
  referencia_id: string | null; referencia_tipo: string | null; created_at: string;
};

// ─── Insert types (what we send on INSERT) ──────────────────────────────────

type EntidadInsert = {
  id?: string; nombre: string; tipo: TipoEntidad;
  cuit?: string | null; email?: string | null;
  telefono?: string | null; direccion?: string | null; activo?: boolean;
};

type ObraInsert = {
  id?: string; nombre: string; descripcion?: string | null;
  tipo_contrato: TipoContrato; estado?: EstadoObra;
  presupuesto_aprobado?: number;
  fecha_inicio?: string | null; fecha_fin_estimada?: string | null; fecha_fin_real?: string | null;
  cliente_id?: string | null;
};

type PartidaInsert = {
  id?: string; obra_id: string; parent_id?: string | null;
  codigo?: string | null; nombre: string;
  tipo_ejecucion?: TipoEjecucion; costo_estimado?: number; orden?: number;
};

type PartidaItemInsert = {
  id?: string; partida_id: string; nombre: string;
  tipo?: TipoItem; cantidad?: number; unidad?: string; precio_unitario?: number;
};

type GastoInsert = {
  id?: string; obra_id: string; partida_id?: string | null; entidad_id?: string | null;
  categoria: CategoriaGasto; descripcion: string; monto: number;
  fecha?: string; comprobante?: string | null;
};

type CertificacionInsert = {
  id?: string; obra_id: string; numero?: number | null;
  tipo?: TipoCert; estado?: EstadoCert; monto: number;
  porcentaje_avance?: number | null;
  fecha?: string; fecha_aprobacion?: string | null; fecha_cobro?: string | null;
  observaciones?: string | null;
};

type MovimientoInsert = {
  id?: string; obra_id?: string | null; entidad_id?: string | null;
  tipo: TipoMovimiento; concepto: string; monto: number; fecha?: string;
  referencia_id?: string | null; referencia_tipo?: string | null;
};

// ─── Database type (used to type the Supabase client) ───────────────────────

export type Database = {
  public: {
    Tables: {
      entidades: {
        Row:           EntidadRow;
        Insert:        EntidadInsert;
        Update:        Partial<EntidadInsert>;
        Relationships: [];
      };
      obras: {
        Row:           ObraRow;
        Insert:        ObraInsert;
        Update:        Partial<ObraInsert>;
        Relationships: [{ foreignKeyName: 'obras_cliente_id_fkey'; columns: ['cliente_id']; referencedRelation: 'entidades'; referencedColumns: ['id'] }];
      };
      partidas: {
        Row:           PartidaRow;
        Insert:        PartidaInsert;
        Update:        Partial<PartidaInsert>;
        Relationships: [
          { foreignKeyName: 'partidas_obra_id_fkey';   columns: ['obra_id'];   referencedRelation: 'obras';    referencedColumns: ['id'] },
          { foreignKeyName: 'partidas_parent_id_fkey'; columns: ['parent_id']; referencedRelation: 'partidas'; referencedColumns: ['id'] }
        ];
      };
      partida_items: {
        Row:           PartidaItemRow;
        Insert:        PartidaItemInsert;
        Update:        Partial<PartidaItemInsert>;
        Relationships: [{ foreignKeyName: 'partida_items_partida_id_fkey'; columns: ['partida_id']; referencedRelation: 'partidas'; referencedColumns: ['id'] }];
      };
      gastos: {
        Row:           GastoRow;
        Insert:        GastoInsert;
        Update:        Partial<GastoInsert>;
        Relationships: [
          { foreignKeyName: 'gastos_obra_id_fkey';    columns: ['obra_id'];    referencedRelation: 'obras';     referencedColumns: ['id'] },
          { foreignKeyName: 'gastos_entidad_id_fkey'; columns: ['entidad_id']; referencedRelation: 'entidades'; referencedColumns: ['id'] },
          { foreignKeyName: 'gastos_partida_id_fkey'; columns: ['partida_id']; referencedRelation: 'partidas';  referencedColumns: ['id'] }
        ];
      };
      certificaciones: {
        Row:           CertificacionRow;
        Insert:        CertificacionInsert;
        Update:        Partial<CertificacionInsert>;
        Relationships: [{ foreignKeyName: 'certificaciones_obra_id_fkey'; columns: ['obra_id']; referencedRelation: 'obras'; referencedColumns: ['id'] }];
      };
      movimientos_financieros: {
        Row:           MovimientoRow;
        Insert:        MovimientoInsert;
        Update:        Partial<MovimientoInsert>;
        Relationships: [];
      };
    };
    Views:     Record<string, never>;
    Functions: Record<string, never>;
    Enums:     Record<string, never>;
  };
};
