# PlantCare AI 🌱

Una app móvil que identifica plantas a partir de una foto, diagnostica su salud
y genera un plan de cuidado personalizado con recordatorios push.

> Monorepo con tres workspaces:
> - `mobile/`   → App React Native (Expo)
> - `backend/`  → API Node.js / Express (también desplegable como serverless)
> - `supabase/` → Esquema SQL y seeds para la base de datos

---

## 1. Stack

| Capa             | Tecnología                                           |
|------------------|------------------------------------------------------|
| Frontend móvil   | React Native + Expo (SDK 50+, TypeScript)            |
| Navegación       | React Navigation (Stack + Bottom Tabs)               |
| Estado           | React Context + hooks                                |
| Backend          | Node.js 20 + Express (compatible con Vercel/Lambda)  |
| Base de datos    | Supabase (PostgreSQL + Row Level Security)           |
| Autenticación    | Supabase Auth (email/password + Google OAuth)        |
| Storage          | Supabase Storage (`plant-photos` bucket)             |
| IA multimodal    | Anthropic Claude (`claude-opus-4-7`) — vision        |
| Notificaciones   | Expo Push Notifications                              |
| Diseño           | Tema "wellness/nature" custom, sin librerías de UI   |

---

## 2. Cómo correr el proyecto localmente

### 2.1. Requisitos
- Node.js >= 20
- npm >= 10
- Expo Go (en el celular) o emulador iOS/Android
- Una cuenta gratuita de Supabase (opcional — la app funciona con mock data)
- Una API key de Anthropic (opcional — la app funciona con mock data)

### 2.2. Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tus claves (o déjalo vacío para usar mocks)
npm install
npm run dev          # http://localhost:4000
```

Variables de entorno (`backend/.env`):
```
PORT=4000
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
USE_MOCK_AI=false        # true para forzar respuestas simuladas
```

### 2.3. Base de datos

```bash
# En el dashboard de Supabase → SQL Editor, ejecutá:
supabase/schema.sql
supabase/seed.sql   # opcional, datos de ejemplo
```

Después creá un bucket público llamado `plant-photos` en Storage.

### 2.4. Mobile

```bash
cd mobile
cp .env.example .env
# Edita EXPO_PUBLIC_API_URL con la URL del backend
npm install
npm run start
# Escaneá el QR con Expo Go, o presioná i / a para emuladores
```

Variables de entorno (`mobile/.env`):
```
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_USE_MOCKS=false
```

> Si no configurás Supabase ni Anthropic, poné `EXPO_PUBLIC_USE_MOCKS=true`
> y `USE_MOCK_AI=true`. La app correrá end-to-end con datos simulados.

---

## 3. Modelo de datos

```
User ──┬── Plant ──┬── Diagnosis (N por planta, histórico)
       │          ├── PlantPhoto (N por planta)
       │          ├── Reminder (N por planta)
       │          └── Note (N por planta)
       └── Feedback (sobre una recomendación específica)
```

Detalles completos en [`ARCHITECTURE.md`](./ARCHITECTURE.md) y
[`supabase/schema.sql`](./supabase/schema.sql).

---

## 4. Flujo principal

1. **Onboarding** → tres slides de bienvenida.
2. **Login / Sign up** (email o Google).
3. **Home Dashboard** → próximos cuidados, plantas recientes, CTA "Tomar foto".
4. **Capture** → cámara o galería.
5. La foto sube a Storage y se manda al backend `/identify`.
6. El backend llama a Claude con un prompt multimodal y devuelve
   identificación + diagnóstico + plan de cuidado en una sola respuesta JSON.
7. **Identification → Diagnosis → CarePlan** muestran el resultado por pasos.
8. El usuario puede **Guardar planta** → se crean recordatorios automáticos.
9. **Mis plantas / Detalle / Calendario** muestran el histórico y los próximos
   cuidados pendientes.
10. **Settings** permite cerrar sesión, gestionar notificaciones y borrar datos.

---

## 5. Pantallas

| #  | Pantalla            | Archivo                                          |
|----|---------------------|--------------------------------------------------|
| 1  | Onboarding          | `mobile/src/screens/OnboardingScreen.tsx`        |
| 2  | Login               | `mobile/src/screens/LoginScreen.tsx`             |
| 3  | Sign up             | `mobile/src/screens/SignupScreen.tsx`            |
| 4  | Home Dashboard      | `mobile/src/screens/HomeScreen.tsx`              |
| 5  | Capture             | `mobile/src/screens/CaptureScreen.tsx`           |
| 6  | Identification      | `mobile/src/screens/IdentificationScreen.tsx`    |
| 7  | Diagnosis           | `mobile/src/screens/DiagnosisScreen.tsx`         |
| 8  | Care Plan           | `mobile/src/screens/CarePlanScreen.tsx`          |
| 9  | Mis plantas         | `mobile/src/screens/MyPlantsScreen.tsx`          |
| 10 | Detalle de planta   | `mobile/src/screens/PlantDetailScreen.tsx`       |
| 11 | Calendario          | `mobile/src/screens/CalendarScreen.tsx`          |
| 12 | Ajustes             | `mobile/src/screens/SettingsScreen.tsx`          |

---

## 6. Endpoints del backend

| Método | Ruta              | Descripción                                          |
|--------|-------------------|------------------------------------------------------|
| POST   | `/identify`       | Recibe `{ imageUrl }` → ID + diagnóstico + plan      |
| POST   | `/diagnose`       | Re-diagnóstico de una planta ya guardada             |
| POST   | `/feedback`       | Marcar recomendación como útil / no útil             |
| GET    | `/plants/:id`     | Detalle agregado de una planta                       |
| GET    | `/health`         | Healthcheck                                          |

---

## 7. Algoritmo de próximo riego

Implementado en `backend/src/utils/nextWatering.ts` y replicado en
`mobile/src/utils/nextWatering.ts` para uso offline:

```
baseDays      = cuidado.wateringFrequencyDays  (de la IA)
humidityBoost = clamp((50 - humidityPreference) / 25, -1, 1)
seasonFactor  = mes en {12,1,2} ? 1.2 : mes en {6,7,8} ? 0.85 : 1.0
adjustedDays  = baseDays * seasonFactor + humidityBoost
nextWatering  = lastWatering + adjustedDays días
```

Es un cálculo determinista, conservador y fácil de explicar al usuario.

---

## 8. Loop de mejora (feedback)

Cada recomendación tiene un id estable. El usuario puede tocar 👍 / 👎 en
`CarePlanScreen` y `PlantDetailScreen`. El backend persiste
`Feedback { recommendationId, plantId, helpful, comment? }` y, en el siguiente
diagnóstico de la misma planta, incluye los feedbacks negativos en el prompt
("El usuario reportó que regar cada 3 días era demasiado, ajustá").

---

## 9. Prompt de IA

El prompt completo está en `backend/src/prompts/plantAnalysis.ts`. Resumen:

- Se le pide a Claude que actúe como botánico + agrónomo.
- Recibe la imagen + (opcional) histórico de la planta y feedback previo.
- Devuelve **JSON estricto** validado por Zod.
- Si la imagen no permite diagnosticar, debe poner
  `lowConfidenceWarning: true` y explicar por qué.

---

## 10. Estructura de carpetas

```
.
├── README.md                ← este archivo
├── ARCHITECTURE.md
├── .gitignore
├── supabase/
│   ├── schema.sql
│   └── seed.sql
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts                      ← entrypoint Express
│       ├── routes/
│       │   ├── identify.ts
│       │   ├── diagnose.ts
│       │   ├── feedback.ts
│       │   └── plants.ts
│       ├── services/
│       │   ├── aiClient.ts               ← wrapper Anthropic
│       │   └── supabase.ts
│       ├── prompts/
│       │   └── plantAnalysis.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── error.ts
│       ├── utils/
│       │   └── nextWatering.ts
│       └── mocks/
│           └── analysis.ts
└── mobile/
    ├── package.json
    ├── app.json
    ├── babel.config.js
    ├── tsconfig.json
    ├── App.tsx
    ├── .env.example
    └── src/
        ├── api/                  ← cliente HTTP
        ├── components/           ← UI reutilizable
        ├── context/              ← AuthContext, PlantContext
        ├── hooks/
        ├── lib/                  ← supabase, notifications, mockData
        ├── navigation/
        ├── screens/              ← 12 pantallas
        ├── theme/                ← colors, typography, spacing
        ├── types/
        └── utils/
```

---

## 11. Roadmap corto

- [ ] Modo offline con caché optimista
- [ ] Comparación visual lado-a-lado del histórico
- [ ] Compartir plantas con la familia
- [ ] Localización (es / en / pt)

---

## Licencia
MIT
