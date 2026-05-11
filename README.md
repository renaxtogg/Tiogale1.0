# ConstruERP

Sistema de gestión ERP para empresas constructoras. Desarrollado con Next.js 15, TypeScript, Tailwind CSS, shadcn/ui y Supabase.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v3 + shadcn/ui |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (email/password) |
| Deployment | Vercel |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/              # Rutas de autenticación (login, register)
│   ├── (dashboard)/         # Rutas protegidas con layout compartido
│   │   ├── dashboard/
│   │   ├── obras/
│   │   ├── presupuestos/
│   │   ├── gastos/
│   │   ├── certificaciones/
│   │   └── entidades/
│   ├── api/auth/callback/   # Handler de OAuth/magic-link de Supabase
│   └── layout.tsx           # Root layout
├── components/
│   ├── layout/              # Sidebar, Navbar, PageContainer
│   ├── shared/              # DataTable, EmptyState, LoadingSpinner
│   └── ui/                  # Componentes shadcn/ui
├── hooks/
│   └── use-auth.ts          # Hook para estado de auth en Client Components
├── lib/
│   └── supabase/
│       ├── client.ts        # createBrowserClient (Client Components)
│       ├── server.ts        # createServerClient (Server Components / Actions)
│       └── actions.ts       # Server Actions de autenticación
└── types/
    ├── index.ts             # Tipos de dominio del ERP
    └── supabase.ts          # Tipos generados por Supabase CLI
```

---

## Variables de entorno

Copie `.env.local.example` a `.env.local` y complete los valores:

```bash
cp .env.local.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key del proyecto |
| `NEXT_PUBLIC_SITE_URL` | URL del sitio (http://localhost:3000 en desarrollo) |

---

## Configuración de Supabase

1. Cree un proyecto en [supabase.com](https://supabase.com).
2. En **Settings → Authentication → URL Configuration**, agregue:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/api/auth/callback`
3. Copie las credenciales a `.env.local`.

### Generar tipos TypeScript desde las tablas

Una vez que cree tablas en Supabase, regenere los tipos:

```bash
npx supabase gen types typescript \
  --project-id <tu-project-id> \
  --schema public \
  > src/types/supabase.ts
```

---

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# → edite .env.local con sus credenciales de Supabase

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Deployment en Vercel

1. Haga push del repositorio a GitHub.
2. Importe el proyecto en [vercel.com](https://vercel.com).
3. En **Settings → Environment Variables**, agregue las mismas variables de `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (ej: `https://mi-app.vercel.app`)
4. En Supabase, agregue la URL de Vercel a los **Redirect URLs** de autenticación.
5. Haga deploy. Vercel detecta Next.js automáticamente.

---

## Próximos pasos recomendados

### 1. Crear las tablas en Supabase

Empezar con el módulo de Obras como núcleo del sistema:

```sql
-- obras
create table obras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  estado text default 'planning',
  fecha_inicio date,
  fecha_fin_estimada date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- habilitar RLS
alter table obras enable row level security;
create policy "Usuarios autenticados pueden leer obras"
  on obras for select using (auth.role() = 'authenticated');
```

### 2. Agregar un nuevo módulo

Cada módulo sigue el mismo patrón:

```
src/app/(dashboard)/<modulo>/
├── page.tsx        # Listado principal (Server Component)
├── [id]/page.tsx   # Detalle / edición
├── loading.tsx     # Skeleton automático
└── error.tsx       # Error boundary
```

Las Server Actions van en `src/app/(dashboard)/<modulo>/actions.ts`.

### 3. Implementar formularios con validación

Instalar [Zod](https://zod.dev/) para validación y [react-hook-form](https://react-hook-form.com/) para el manejo de formularios:

```bash
npm install zod react-hook-form @hookform/resolvers
```

### 4. Añadir Row Level Security (RLS)

Habilitar RLS en todas las tablas de Supabase y definir políticas por usuario o por rol.

### 5. Internacionalización (opcional)

El sistema está preparado para español. Para múltiples idiomas, integrar [next-intl](https://next-intl.dev/).

---

## Comandos útiles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción
npm run lint      # Linter ESLint
```
