# CLAUDE.md

Guía para asistentes de IA (Claude Code y similares) trabajando en este repositorio.

## Project overview

**famfinance** es una app móvil (iOS/Android vía Expo) para que dos personas —típicamente pareja— gestionen finanzas compartidas: gastos, ingresos, categorías, presupuestos mensuales, división de gastos compartidos, y un dashboard con gráficos. Backend: Supabase (Postgres + Auth + RLS).

Estado actual: **MVP funcional** (auth, onboarding de hogar, CRUD de transacciones, categorías + presupuestos, balance compartido, dashboard con charts, ajustes).

## Stack

| Capa | Tecnología |
|---|---|
| Cliente | Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9 |
| Navegación | `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` |
| Estado | Zustand (solo para auth; el resto usa hooks + fetch directo a Supabase) |
| Charts | `react-native-chart-kit` + `react-native-svg` |
| Storage auth | `@react-native-async-storage/async-storage` |
| Backend | Supabase (Postgres 15, PostgREST, Auth, RLS) |

## Repository layout

```
famfinance/
├── App.tsx                     # Raíz: NavigationContainer + SafeAreaProvider + bootstrap auth
├── index.ts                    # registerRootComponent + url polyfill
├── app.json                    # Expo config (name, bundle ids, extra)
├── package.json                # deps y scripts
├── tsconfig.json               # paths @/* → src/*
├── babel.config.js             # babel-preset-expo + module-resolver (@ alias)
├── .env.example                # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
├── src/
│   ├── lib/
│   │   ├── supabase.ts         # cliente Supabase (lee env o app.json extra)
│   │   ├── database.types.ts   # tipos Row/Insert/Update para Profile, Household, Category, Transaction
│   │   ├── theme.ts            # paleta + spacing + radius
│   │   └── format.ts           # formatCurrency, formatDate, monthKey helpers
│   ├── stores/
│   │   └── useAuthStore.ts     # Zustand: session, profile, bootstrap, signIn/Up/Out, refreshProfile
│   ├── hooks/
│   │   ├── useTransactions.ts  # lista transacciones por household + mes con join a categoría
│   │   └── useCategories.ts    # lista categorías del household
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # gate: auth / onboarding / app principal
│   │   └── TabsNavigator.tsx   # 5 tabs: Dashboard, Transactions, Budgets, Shared, Settings
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── SignupScreen.tsx
│       ├── HouseholdOnboardingScreen.tsx   # crear o unirse con invite_code; siembra categorías default
│       ├── DashboardScreen.tsx             # 3 cards + PieChart categorías + BarChart 6 meses
│       ├── TransactionsScreen.tsx          # lista mes actual + FAB + borrar con long-press
│       ├── AddTransactionScreen.tsx        # modal: kind, split, amount, categoría, fecha, nota
│       ├── BudgetsScreen.tsx               # categorías con barra de progreso vs presupuesto
│       ├── SharedBalanceScreen.tsx         # lee vista `shared_balances` + perfiles del hogar
│       └── SettingsScreen.tsx              # perfil, código de invitación (Share), cerrar sesión
└── supabase/
    └── migrations/
        └── 0001_init.sql       # schema + RLS + función is_household_member + vista shared_balances
```

## Modelo de datos

Tablas en `public`:

- **households** (`id`, `name`, `invite_code`, `created_at`) — espacio compartido. El `invite_code` se autogenera.
- **profiles** (`id` FK → `auth.users`, `household_id`, `display_name`) — un perfil por usuario, ligado a su hogar.
- **categories** (`id`, `household_id`, `name`, `color`, `budget_monthly`) — categorías del hogar con presupuesto mensual opcional.
- **transactions** (`id`, `household_id`, `user_id`, `category_id`, `kind`, `split`, `amount`, `date`, `note`) — `kind ∈ {expense, income}`, `split ∈ {personal, shared}`.

Vista:

- **shared_balances** — agrupa gastos compartidos por `household_id` y `user_id`, calcula `paid`, `fair_share` y `net`. Usada por `SharedBalanceScreen`.

Seguridad: todas las tablas tienen **RLS** activo. La función `is_household_member(uuid)` (SECURITY DEFINER) es la base de todas las políticas — solo miembros del hogar leen/escriben sus datos.

## Development workflow

### Install / bootstrap

```bash
npm install
cp .env.example .env     # añade URL y anon key de Supabase
```

Antes de correr la app: crea el proyecto en Supabase y ejecuta `supabase/migrations/0001_init.sql` en el SQL Editor.

### Run locally

```bash
npm start           # Metro bundler + QR para Expo Go
npm run ios         # simulador iOS
npm run android     # emulador Android
npm run web         # modo web (útil para iterar UI rápido)
```

### Typecheck y lint

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint sobre .ts y .tsx
```

No hay tests aún.

### Build

Expo EAS no está configurado todavía. Para builds de producción:

```bash
npx eas build --platform ios
npx eas build --platform android
```

## Convenciones de código

- **TypeScript estricto**. Todos los componentes son funciones con props tipadas.
- **Alias `@/`** apunta a `src/` (ver `tsconfig.json` y `babel.config.js`). Úsalo siempre en imports entre módulos de `src`.
- **Estilos**: `StyleSheet.create` co-ubicado al final del archivo. Los colores vienen de `@/lib/theme`.
- **Idioma UI**: **español** (es-CO). Los copys visibles para el usuario se escriben en español; el código y los identificadores, en inglés.
- **Formato monetario**: `formatCurrency(n)` en `@/lib/format` (default COP, sin decimales).
- **Estado**:
  - Auth global → Zustand (`useAuthStore`).
  - Datos del hogar → hooks locales que hacen fetch a Supabase (`useTransactions`, `useCategories`). Sin react-query todavía; cada pantalla hace pull-to-refresh.
- **RLS primero**: si agregas una tabla o columna, actualiza `0001_init.sql` y añade la política antes de tocar el cliente.

## Git conventions

- Rama default: `main`.
- Feature branches `claude/<slug>` para sesiones de Claude Code.
- Commits nuevos — no amendar commits publicados.
- Nunca `--no-verify` ni force-push a `main`.
- Primera subida de rama: `git push -u origin <branch>`.
- Pull requests **solo cuando el usuario los pida explícitamente**.

## Convenciones para asistentes de IA

- **Mantén este archivo al día.** Si agregas dependencias, pantallas, tablas o scripts, actualiza la sección correspondiente en el mismo commit.
- **No inventes stack.** Si el usuario quiere cambiar de framework o agregar una librería grande, pregunta antes.
- **Prefiere editar sobre crear.** Añade archivos solo cuando la tarea lo requiera.
- **Sin emojis** en código ni docs, salvo que el usuario los pida (los íconos de tabs usan emojis intencionalmente por ser UI del producto).
- **Comentarios mínimos.** Solo cuando el *por qué* no sea obvio.
- **Validación en bordes.** No agregues validación entre funciones internas — confía en los tipos. Valida en inputs del usuario y en respuestas de Supabase.
- **RLS es la fuente de verdad**. No filtres por `household_id` en el cliente como defensa — las políticas ya lo hacen. Filtrar en el cliente es solo para ergonomía (que la consulta devuelva menos datos).
- **Secretos.** La anon key va al cliente por diseño. La `service_role` key **nunca** debe entrar al repo.

## Próximos pasos razonables (si el usuario los pide)

1. Tests: Jest + `@testing-library/react-native` para screens, y pruebas SQL contra una instancia local de Supabase (`supabase start`).
2. Migrar a `@tanstack/react-query` para caché y reintentos.
3. Real-time: suscripciones de Supabase para ver cambios de la pareja al instante.
4. Date picker nativo (`@react-native-community/datetimepicker`) en lugar de input YYYY-MM-DD.
5. Exportar CSV mensual.
6. EAS Build + distribución TestFlight / Play Internal.
