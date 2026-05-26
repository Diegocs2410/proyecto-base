# Proyecto Base — SaaS multi-tenant

Base reutilizable de SaaS para vender por suscripción a PYMES colombianas. Un solo producto multi-tenant donde cada organización activa los módulos que necesita (ventas, agenda, CRM, etc.).

> **Stack:** Next.js 16 (App Router, React 19, Tailwind 4) · Supabase (PostgreSQL + Auth + RLS) · TypeScript · Zod · React Hook Form · Sonner

## Estado

Base lista (~95%): auth + recuperar contraseña, multi-tenant, roles, RLS, invitaciones con email, audit log, UI shell, emails (Resend), billing Wompi (trial 14d + límites por plan), formateadores y datos geográficos CO, validadores NIT/cédula/teléfono, infraestructura de módulos activables, **landing pública**, observabilidad (Sentry + PostHog opcionales), logging estructurado (pino), tests E2E (Playwright), CI (GitHub Actions). Pendiente: conectar Vercel y construir módulos de negocio reales (Agenda recomendada). Plan completo en `C:\Users\diego\.claude\plans\`.

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables y rellenar
cp .env.example .env.local
#   - Supabase: project URL + claves (Settings → API)
#   - APP_URL: http://localhost:3000

# 3. (Opcional) Linkear CLI de Supabase al proyecto remoto
supabase login
supabase link --project-ref <ref>

# 4. Aplicar migraciones a tu Supabase
supabase db push

# 5. (Opcional) Datos demo (4 usuarios, 3 tenants, audit logs, invitaciones)
SEED_DEMO_TENANTS=true npm run seed

# 6. Arrancar
npm run dev
# → http://localhost:3000
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir build local |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run seed` | Cargar datos demo (idempotente, requiere `SEED_DEMO_TENANTS=true`) |
| `npm run gen:types` | Regenerar `src/lib/supabase/database.types.ts` |

Regenera los tipos cada vez que cambies el schema en Supabase.

## Estructura

```
src/
├── app/                    Rutas Next.js (App Router)
│   ├── auth/               Login, registro, recuperar
│   ├── onboarding/         Wizard de primera org
│   ├── org/[slug]/         Dashboard por organización
│   ├── unirme/[token]/     Aceptar invitación
│   └── (rutas globales)    organizaciones, miembros, auditoria, etc.
├── components/             UI compartida (layout, ui primitives)
├── lib/
│   ├── supabase/           Clientes server/browser/admin tipados
│   ├── auth/               TenantContext
│   ├── security/           permissions.ts + require.ts (guards)
│   ├── audit/              logAudit helper
│   └── data/               Queries de dominio
├── modules/                (Fase 4) Módulos activables por tenant
└── proxy.ts                Next 16 proxy (antes "middleware")
supabase/
└── migrations/             SQLs versionados
scripts/
└── seed.ts                 Datos demo opcionales
```

> **Next 16:** El archivo `src/proxy.ts` es lo que antes se llamaba `middleware.ts`. Next.js 16 lo renombró; la convención está documentada en `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.

## Multi-tenant

- Cada usuario pertenece a una o más organizaciones vía `tenant_users` (role: `tenant_owner`, `tenant_admin`, `member`, `viewer`, o `platform_admin` global).
- Las rutas `/org/[slug]/*` están aisladas por organización.
- RLS habilitado en todas las tablas usando `app_private.is_tenant_member()` y `app_private.is_platform_admin()`.
- Permisos en código: `can(context, "members.manage")` desde `src/lib/security/permissions.ts`. Para verificar contra una org específica en server actions usa `requirePermission(tenantId, permission)` de `src/lib/security/require.ts`.

## Auditoría

Todas las acciones críticas se registran en `audit_logs` vía el helper `logAudit()` en `src/lib/audit/log.ts`. Visualízalas en `/auditoria` (global) o `/org/[slug]` (por organización).

## Módulos activables

Cada negocio activa solo los módulos que necesita (Agenda, POS, CRM, Notas, …). La infraestructura vive en `src/modules/` y `src/lib/modules/`:

- `tenant_features (enabled boolean)` es la tabla que persiste qué módulo está activo por org.
- `src/modules/registry.ts` lista los módulos disponibles. Cada módulo aporta un `ModuleManifest` (`key`, `name`, `icon`, `navItems`, `minPlanCode`).
- `OrgSidebar` lee `getEnabledModules(tenantId)` y renderiza los `navItems` de los manifests activos.
- Las páginas de cada módulo llaman `requireModuleEnabled(slug, moduleKey)` al inicio; si el módulo no está activo redirige a `/configuracion/modulos`.
- `/org/[slug]/configuracion/modulos` muestra todos los módulos disponibles con toggles (requiere permiso `modules.manage`), bloqueados cuando el plan no alcanza al `minPlanCode`.

### Agregar un módulo nuevo

1. `src/modules/<key>/manifest.ts` — exporta un `ModuleManifest`
2. Agregar el manifest a `src/modules/registry.ts`
3. `src/app/org/[slug]/(modules)/<key>/page.tsx` — wrapper 5 líneas que llama el guard y renderiza el componente del módulo
4. Lógica del módulo (queries, actions, componentes) bajo `src/modules/<key>/`
5. Si requiere tablas, agregar migración numerada en `supabase/migrations/`

El módulo `notas` en `src/modules/notas/` sirve como referencia mínima funcional.

## Facturación (Wompi)

Pagos vía [Wompi](https://docs.wompi.co) (Bancolombia) usando Web Checkout hosted:

- **Schema:** tabla `subscriptions` (una por tenant) + `payment_events` (bitácora idempotente de webhooks).
- **Trial:** cada org nueva arranca 14 días en `trialing`.
- **Upgrade:** `/org/[slug]/billing` → botón "Contratar" genera URL Wompi firmada con `signature:integrity` y redirige al usuario. Cuando Wompi confirma vía webhook, se activa la suscripción.
- **Webhook:** `POST /api/webhooks/wompi` verifica HMAC SHA256 contra `WOMPI_EVENTS_SECRET` y deduplica por `signature.checksum`.
- **Límites:** `verificarLimite(tenantId, "users")` bloquea invitaciones cuando se llega al cupo del plan (suma activos + pendientes).
- **Cancelar:** `cancel_at_period_end=true` mantiene acceso hasta el fin del período; reactivable.

**Configuración Wompi en .env.local:**
- `WOMPI_ENV=sandbox` (cambiar a `production` en prod)
- `WOMPI_PUBLIC_KEY` (Wompi dashboard → Comercios → Llaves API)
- `WOMPI_PRIVATE_KEY`
- `WOMPI_EVENTS_SECRET` (firma de webhooks)
- `WOMPI_INTEGRITY_SECRET` (firma de checkout)

**Webhook URL para configurar en Wompi:** `https://tu-dominio.com/api/webhooks/wompi`. En dev usa ngrok o cloudflared para exponer localhost.

> **Aplica la migración antes de usar:** `supabase db push && npm run gen:types`

## Emails transaccionales (Resend)

Los emails se envían vía [Resend](https://resend.com) desde `src/lib/email/`:

- `BienvenidaEmail` — tras crear la primera organización.
- `InvitacionEmail` — tras invitar a un miembro.
- `RecuperarClaveEmail` — template para usar en Supabase Studio si quieres unificar el diseño del email de reset.

Si `RESEND_API_KEY` no está configurada, los envíos hacen log en consola (modo dry-run) y no fallan.

**Para que funcione el reset de contraseña**, configura el redirect URL en Supabase Studio → Authentication → URL Configuration → Site URL + Redirect URLs:

- Site URL: `http://localhost:3000` (dev) o tu dominio (prod)
- Redirect URLs: agrega `http://localhost:3000/auth/confirm` y tu equivalente prod

En Supabase Studio → Authentication → Email Templates → "Reset Password", asegúrate que el enlace use `{{ .ConfirmationURL }}` (Supabase ya genera la URL correcta con `?next=/auth/nueva-clave`).

## Observabilidad y logging

- **Sentry** — server + edge en `src/instrumentation.ts`, client en `src/instrumentation-client.ts`. Si `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` están vacíos no envía nada (modo no-op). `withSentryConfig` en `next.config.ts` sube source maps si hay `SENTRY_AUTH_TOKEN` en build.
- **PostHog** — `src/components/providers/posthog-provider.tsx` envuelve el árbol y captura pageviews + autocapture. Sin `NEXT_PUBLIC_POSTHOG_KEY` el provider hace passthrough sin cargar el SDK.
- **Logger** — `src/lib/log.ts` exporta `log` (pino) y `logger("scope")`. Redacta automáticamente `password`, `token`, `authorization`, etc. JSON en prod, pretty en dev.

## Tests E2E

Playwright en `tests/e2e/`. Arranque:
```bash
npx playwright install chromium
npx playwright test
```
El test smoke verifica que la landing carga y los CTAs llevan a login/registro. Tests con auth real se agregan a medida que se construyan módulos.

## CI/CD

GitHub Actions en `.github/workflows/ci.yml` corre lint + typecheck + build en cada push a `master` y en PRs. Requiere los secretos:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- (Opcional) `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` para subir source maps

## Deploy

Recomendado: **Vercel**. Conecta el repo, configura las variables del `.env.example`, deploy automático en cada push. Para Wompi y Resend el dominio debe estar verificado antes de prod.

## Docs locales de Next.js 16

Hay varios breaking changes vs versiones anteriores. **Antes de escribir código nuevo** consulta los docs locales:

```
node_modules/next/dist/docs/01-app/
```

Cambios notables: `middleware` → `proxy`, params async (`await params`), nuevas APIs de cache, etc.
