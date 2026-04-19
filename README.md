# famfinance

App móvil para manejar las finanzas en pareja. Registra gastos e ingresos, define presupuestos por categoría, divide gastos compartidos, y visualiza tus finanzas en un dashboard — todo sincronizado entre los dos.

## Stack

- **Expo SDK 51** + **React Native** + **TypeScript**
- **Supabase** (Postgres + Auth + RLS) como backend
- **React Navigation** (native-stack + bottom-tabs)
- **react-native-chart-kit** para gráficos
- **Zustand** para estado de auth

## Setup

### 1. Supabase

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En **Authentication → Providers**, habilita **Email** (con confirmación por correo opcional).
3. Abre el SQL Editor y corre `supabase/migrations/0001_init.sql`.
4. Copia el **Project URL** y la **anon public key** desde Settings → API.

### 2. App

```bash
npm install
cp .env.example .env
# edita .env con tus credenciales de Supabase
npm start
```

Escanea el QR con la app de Expo Go (iOS/Android) o corre `npm run ios` / `npm run android` con un simulador.

## Uso

1. **Crear cuenta** (correo + contraseña). Confirma en tu correo si tienes confirmación habilitada.
2. **Crear hogar** (o unirte con el código de invitación de tu pareja).
3. Compartir el **código de invitación** (pantalla Ajustes → Invitar) con tu pareja.
4. Registrar movimientos desde la pestaña **Movimientos** con el botón `+`.
5. Marcar como **Compartido** para que el gasto se divida 50/50 en la pestaña **Compartido**.
6. Editar categorías y presupuestos mensuales en la pestaña **Presupuestos**.
7. Ver el resumen y gráficos en la pestaña **Resumen**.

## Estructura

```
famfinance/
├── App.tsx, index.ts        # entrada Expo
├── app.json, package.json   # configuración Expo / deps
├── src/
│   ├── lib/                 # supabase client, tipos, tema, formateo
│   ├── stores/              # Zustand (auth)
│   ├── hooks/               # useTransactions, useCategories
│   ├── navigation/          # RootNavigator + TabsNavigator
│   └── screens/             # 8 pantallas
└── supabase/migrations/     # SQL schema + RLS + vista de balances
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Arranca el bundler de Expo |
| `npm run ios` | Abre en simulador iOS |
| `npm run android` | Abre en emulador Android |
| `npm run web` | Corre en navegador (modo dev) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint sobre `.ts`/`.tsx` |

## Notas de seguridad

- Las claves de Supabase que van al cliente son públicas por diseño (**anon key**). La seguridad real vive en las **políticas RLS** definidas en `0001_init.sql`. No agregues la `service_role` key al cliente.
- RLS garantiza que cada usuario solo ve datos de su propio hogar. Si cambias el esquema, revisa las políticas.

## Licencia

MIT.
