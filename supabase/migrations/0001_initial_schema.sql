-- ================================================================
-- ConstruERP — Initial Schema
-- Run this in your Supabase SQL editor or via Supabase CLI migrations
-- ================================================================

-- ENTIDADES must be created first (referenced by obras)
CREATE TABLE IF NOT EXISTS entidades (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT        NOT NULL,
  tipo          TEXT        NOT NULL DEFAULT 'proveedor'
                            CHECK (tipo IN ('cliente', 'proveedor', 'subcontratista', 'empleado')),
  cuit          TEXT,
  email         TEXT,
  telefono      TEXT,
  direccion     TEXT,
  activo        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OBRAS — core project entity
CREATE TABLE IF NOT EXISTS obras (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               TEXT           NOT NULL,
  descripcion          TEXT,
  -- cerrado = fixed-price, certifications cannot exceed budget
  -- abierto  = adjustable, budget can grow with addendas
  tipo_contrato        TEXT           NOT NULL DEFAULT 'cerrado'
                                      CHECK (tipo_contrato IN ('cerrado', 'abierto')),
  estado               TEXT           NOT NULL DEFAULT 'planning'
                                      CHECK (estado IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
  presupuesto_aprobado NUMERIC(15,2)  NOT NULL DEFAULT 0 CHECK (presupuesto_aprobado >= 0),
  fecha_inicio         DATE,
  fecha_fin_estimada   DATE,
  fecha_fin_real       DATE,
  cliente_id           UUID           REFERENCES entidades(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- PARTIDAS — hierarchical budget structure within a project
CREATE TABLE IF NOT EXISTS partidas (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id          UUID          NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  -- self-reference allows multi-level hierarchy (chapter → section → item)
  parent_id        UUID          REFERENCES partidas(id) ON DELETE CASCADE,
  codigo           TEXT,
  nombre           TEXT          NOT NULL,
  -- propio = executed by own workforce, tercerizado = subcontracted
  tipo_ejecucion   TEXT          NOT NULL DEFAULT 'propio'
                                 CHECK (tipo_ejecucion IN ('propio', 'tercerizado')),
  costo_estimado   NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (costo_estimado >= 0),
  orden            INTEGER       NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- PARTIDA_ITEMS — line items that make up a partida's cost
CREATE TABLE IF NOT EXISTS partida_items (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id       UUID          NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  nombre           TEXT          NOT NULL,
  tipo             TEXT          NOT NULL DEFAULT 'material'
                                 CHECK (tipo IN ('material', 'mano_obra', 'equipo', 'otro')),
  cantidad         NUMERIC(15,4) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  unidad           TEXT          NOT NULL DEFAULT 'un',
  precio_unitario  NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  -- total is computed at query time to avoid sync issues
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- GASTOS — real execution costs (what the project actually spends)
CREATE TABLE IF NOT EXISTS gastos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id     UUID          NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  partida_id  UUID          REFERENCES partidas(id) ON DELETE SET NULL,
  entidad_id  UUID          REFERENCES entidades(id) ON DELETE SET NULL,
  categoria   TEXT          NOT NULL DEFAULT 'material'
              CHECK (categoria IN ('material', 'mano_obra', 'subcontrato', 'equipo', 'otro')),
  descripcion TEXT          NOT NULL,
  monto       NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  fecha       DATE          NOT NULL DEFAULT CURRENT_DATE,
  comprobante TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- CERTIFICACIONES — billing milestones against the client
CREATE TABLE IF NOT EXISTS certificaciones (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id           UUID          NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  numero            INTEGER,
  -- normal = progress billing, anticipo = upfront advance payment
  tipo              TEXT          NOT NULL DEFAULT 'normal'
                                  CHECK (tipo IN ('normal', 'anticipo')),
  -- borrador = draft (not counted), aprobada = approved, cobrada = collected
  estado            TEXT          NOT NULL DEFAULT 'borrador'
                                  CHECK (estado IN ('borrador', 'aprobada', 'cobrada')),
  monto             NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  porcentaje_avance NUMERIC(5,2)  CHECK (porcentaje_avance BETWEEN 0 AND 100),
  fecha             DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_aprobacion  DATE,
  fecha_cobro       DATE,
  observaciones     TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- MOVIMIENTOS_FINANCIEROS — cash-flow ledger (payments in / payments out)
CREATE TABLE IF NOT EXISTS movimientos_financieros (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id         UUID          REFERENCES obras(id) ON DELETE CASCADE,
  entidad_id      UUID          REFERENCES entidades(id) ON DELETE SET NULL,
  tipo            TEXT          NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  concepto        TEXT          NOT NULL,
  monto           NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  fecha           DATE          NOT NULL DEFAULT CURRENT_DATE,
  -- optional polymorphic link to source document (certificacion, gasto, etc.)
  referencia_id   UUID,
  referencia_tipo TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ================================================================
-- updated_at trigger
-- ================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER obras_updated_at
  BEFORE UPDATE ON obras
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER entidades_updated_at
  BEFORE UPDATE ON entidades
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER partidas_updated_at
  BEFORE UPDATE ON partidas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER gastos_updated_at
  BEFORE UPDATE ON gastos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER certificaciones_updated_at
  BEFORE UPDATE ON certificaciones
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ================================================================
-- Row Level Security
-- MVP: any authenticated user can read/write everything.
-- Add per-organisation or per-user policies in a future sprint.
-- ================================================================
ALTER TABLE obras                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE entidades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE partida_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificaciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_financieros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_obras"
  ON obras FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_entidades"
  ON entidades FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_partidas"
  ON partidas FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_partida_items"
  ON partida_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_gastos"
  ON gastos FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_certificaciones"
  ON certificaciones FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_movimientos"
  ON movimientos_financieros FOR ALL USING (auth.role() = 'authenticated');

-- ================================================================
-- Useful indexes
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_obras_estado         ON obras(estado);
CREATE INDEX IF NOT EXISTS idx_gastos_obra_id       ON gastos(obra_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha         ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_certificaciones_obra ON certificaciones(obra_id);
CREATE INDEX IF NOT EXISTS idx_partidas_obra        ON partidas(obra_id);
CREATE INDEX IF NOT EXISTS idx_partidas_parent      ON partidas(parent_id);
