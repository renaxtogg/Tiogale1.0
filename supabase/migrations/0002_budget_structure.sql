-- ================================================================
-- ConstruERP — Budget Structure Refactor
-- Run in Supabase SQL editor AFTER 0001_initial_schema.sql
-- ================================================================
-- New model separates:
--   BUDGETED COSTS  → presupuestos / capitulos / rubros / analisis_costo_items
--   REAL COSTS      → gastos (existing, extended)
-- ================================================================

-- CATALOGO_RUBROS: Library of reusable rubro templates.
-- The same rubro (e.g. "Excavación manual") can be instantiated across projects.
CREATE TABLE IF NOT EXISTS catalogo_rubros (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo         TEXT,
  nombre         TEXT          NOT NULL,
  unidad         TEXT          NOT NULL DEFAULT 'ml',
  tipo_ejecucion TEXT          NOT NULL DEFAULT 'propio'
                               CHECK (tipo_ejecucion IN ('propio', 'subcontratado')),
  activo         BOOLEAN       NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- CATALOGO_ACU_ITEMS: Default ACU items that come with a catalog rubro.
-- Copied into analisis_costo_items when the rubro is instantiated in a project.
CREATE TABLE IF NOT EXISTS catalogo_acu_items (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_rubro_id UUID          NOT NULL REFERENCES catalogo_rubros(id) ON DELETE CASCADE,
  tipo              TEXT          NOT NULL DEFAULT 'material'
                                  CHECK (tipo IN ('material', 'mano_obra', 'equipo', 'otro')),
  descripcion       TEXT          NOT NULL,
  unidad            TEXT          NOT NULL DEFAULT 'un',
  cantidad          NUMERIC(15,4) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario   NUMERIC(15,4) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  -- subtotal = cantidad * precio_unitario  (computed at application level)
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- PRESUPUESTOS: Budget document linked to a project.
-- Separates client-facing/contractual costs from real execution costs.
CREATE TABLE IF NOT EXISTS presupuestos (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id    UUID        NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nombre     TEXT        NOT NULL DEFAULT 'Presupuesto Principal',
  version    INTEGER     NOT NULL DEFAULT 1,
  estado     TEXT        NOT NULL DEFAULT 'borrador'
                         CHECK (estado IN ('borrador', 'aprobado')),
  notas      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CAPITULOS: Organizational chapters within a presupuesto.
-- Chapters group rubros — they do not have direct costs of their own.
CREATE TABLE IF NOT EXISTS capitulos (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID        NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  codigo         TEXT,
  nombre         TEXT        NOT NULL,
  orden          INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RUBROS: Measurable work items within a chapter.
-- Each rubro has a unit price that comes from its ACU analysis.
-- subtotal = cantidad * precio_unitario  (computed at application level)
CREATE TABLE IF NOT EXISTS rubros (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  capitulo_id       UUID          NOT NULL REFERENCES capitulos(id) ON DELETE CASCADE,
  catalogo_rubro_id UUID          REFERENCES catalogo_rubros(id) ON DELETE SET NULL,
  codigo            TEXT,
  nombre            TEXT          NOT NULL,
  unidad            TEXT          NOT NULL DEFAULT 'ml',
  cantidad          NUMERIC(15,4) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  -- precio_unitario = SUM(analisis_costo_items.subtotal) for this rubro.
  -- Updated by the application after each ACU item insert/update/delete.
  precio_unitario   NUMERIC(15,4) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  tipo_ejecucion    TEXT          NOT NULL DEFAULT 'propio'
                                  CHECK (tipo_ejecucion IN ('propio', 'subcontratado')),
  orden             INTEGER       NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ANALISIS_COSTO_ITEMS (ACU): Cost breakdown model for a rubro's unit price.
-- These are NOT real expenses. They are the estimation that determines precio_unitario.
-- Each item: subtotal = cantidad * precio_unitario  (computed at application level)
CREATE TABLE IF NOT EXISTS analisis_costo_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro_id        UUID          NOT NULL REFERENCES rubros(id) ON DELETE CASCADE,
  tipo            TEXT          NOT NULL DEFAULT 'material'
                                CHECK (tipo IN ('material', 'mano_obra', 'equipo', 'otro')),
  descripcion     TEXT          NOT NULL,
  unidad          TEXT          NOT NULL DEFAULT 'un',
  cantidad        NUMERIC(15,4) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(15,4) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Extend gastos with rubro link and unit breakdown ──────────────────────────
-- rubro_id: optional link to the specific rubro this expense relates to.
--           Enables per-rubro budget vs real comparison.
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS rubro_id       UUID          REFERENCES rubros(id) ON DELETE SET NULL;
-- Unit breakdown (all optional — a lump-sum monto can still be entered without them).
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS unidad         TEXT;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS cantidad       NUMERIC(15,4);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(15,4);

-- ── Triggers ──────────────────────────────────────────────────────────────────
CREATE TRIGGER catalogo_rubros_updated_at
  BEFORE UPDATE ON catalogo_rubros
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER presupuestos_updated_at
  BEFORE UPDATE ON presupuestos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER capitulos_updated_at
  BEFORE UPDATE ON capitulos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER rubros_updated_at
  BEFORE UPDATE ON rubros
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER analisis_costo_items_updated_at
  BEFORE UPDATE ON analisis_costo_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE catalogo_rubros      ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_acu_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE capitulos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubros               ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisis_costo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_catalogo_rubros"
  ON catalogo_rubros FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_catalogo_acu_items"
  ON catalogo_acu_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_presupuestos"
  ON presupuestos FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_capitulos"
  ON capitulos FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_rubros"
  ON rubros FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_analisis_costo_items"
  ON analisis_costo_items FOR ALL USING (auth.role() = 'authenticated');

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_presupuestos_obra     ON presupuestos(obra_id);
CREATE INDEX IF NOT EXISTS idx_capitulos_presupuesto ON capitulos(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_rubros_capitulo       ON rubros(capitulo_id);
CREATE INDEX IF NOT EXISTS idx_acu_rubro             ON analisis_costo_items(rubro_id);
CREATE INDEX IF NOT EXISTS idx_gastos_rubro_id       ON gastos(rubro_id);
