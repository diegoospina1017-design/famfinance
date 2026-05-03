# PlantCare AI — Arquitectura

## Visión general

```
┌────────────────────────┐         ┌────────────────────────┐
│  React Native (Expo)   │  HTTPS  │  Express API (Node 20) │
│  - Cámara / galería    │ ──────► │  /identify  /diagnose  │
│  - Auth (Supabase)     │         │  /plants    /feedback  │
│  - Push notifications  │         │                        │
│  - Storage upload      │         │  ┌──────────────────┐  │
└────────┬───────────────┘         │  │ Anthropic Claude │  │
         │ Supabase JS              │  │  (multimodal)    │  │
         ▼                          │  └──────────────────┘  │
┌────────────────────────┐         │                        │
│ Supabase                │ ◄───────│  Service-role client   │
│ - Postgres (RLS)        │         └────────────────────────┘
│ - Auth (email + Google) │
│ - Storage (plant-photos)│
└────────────────────────┘
```

### Por qué esta separación

- **El móvil no tiene la API key de Claude.** Toda llamada de IA pasa por el
  backend, que firma con la `ANTHROPIC_API_KEY`. Esto evita filtrar la key y
  permite hacer rate-limiting y auditoría.
- **Supabase RLS protege los datos** aunque la app tenga bugs: cada usuario
  solo puede leer/escribir sus propias plantas.
- **El backend es stateless**, así que se puede deployar igual en una VM, en
  Vercel/Lambda como serverless o en Fly.io.

---

## Modelo de datos

### `users`
Manejada por Supabase Auth. La tabla pública `profiles` solo extiende metadata.

| Campo            | Tipo        | Notas                                  |
|------------------|-------------|----------------------------------------|
| id               | uuid (PK)   | = `auth.users.id`                      |
| display_name     | text        |                                        |
| expo_push_token  | text        | para enviar notificaciones             |
| created_at       | timestamptz |                                        |

### `plants`
Una planta guardada por el usuario.

| Campo                 | Tipo        | Notas                                            |
|-----------------------|-------------|--------------------------------------------------|
| id                    | uuid (PK)   |                                                  |
| user_id               | uuid (FK)   | → `auth.users.id`                                |
| nickname              | text        | "La pothos del living"                           |
| common_name           | text        | viene de la IA                                   |
| scientific_name       | text        | viene de la IA                                   |
| confidence            | numeric     | 0..1                                             |
| description           | text        |                                                  |
| cover_photo_url       | text        | URL pública del bucket                           |
| watering_frequency_days | int       | normalizado por la IA                            |
| light                 | text        | "indirect-bright" \| "direct" \| ...             |
| temperature_min_c     | numeric     |                                                  |
| temperature_max_c     | numeric     |                                                  |
| humidity_preference   | int         | 0..100                                           |
| substrate             | text        |                                                  |
| fertilizer            | text        |                                                  |
| last_watered_at       | timestamptz |                                                  |
| next_watering_at      | timestamptz | calculado, ver §Algoritmo                        |
| last_health           | text        | "green" \| "yellow" \| "red"                     |
| created_at            | timestamptz |                                                  |
| updated_at            | timestamptz |                                                  |

### `plant_photos`
Histórico visual de la planta.

| Campo        | Tipo        | Notas                          |
|--------------|-------------|--------------------------------|
| id           | uuid (PK)   |                                |
| plant_id     | uuid (FK)   |                                |
| url          | text        |                                |
| taken_at     | timestamptz |                                |
| diagnosis_id | uuid (FK)   | nullable                       |

### `diagnoses`
Una entrada por análisis de IA.

| Campo               | Tipo        | Notas                                       |
|---------------------|-------------|---------------------------------------------|
| id                  | uuid (PK)   |                                             |
| plant_id            | uuid (FK)   |                                             |
| photo_url           | text        |                                             |
| severity            | text        | "low" \| "medium" \| "high"                 |
| health              | text        | "green" \| "yellow" \| "red"                |
| issues              | jsonb       | array de `{ key, label, detail, severity }` |
| summary             | text        | explicación en lenguaje simple              |
| low_confidence      | boolean     | true si la foto no es suficiente            |
| recommended_actions | jsonb       | array de `{ id, label, dueInDays }`         |
| avoid               | jsonb       | array de strings                            |
| created_at          | timestamptz |                                             |

### `reminders`

| Campo         | Tipo        | Notas                                              |
|---------------|-------------|----------------------------------------------------|
| id            | uuid (PK)   |                                                    |
| plant_id      | uuid (FK)   |                                                    |
| user_id       | uuid (FK)   |                                                    |
| type          | text        | "watering" \| "fertilizing" \| "pest-check"        |
| frequency_days| int         |                                                    |
| next_run_at   | timestamptz |                                                    |
| enabled       | boolean     | default true                                       |
| created_at    | timestamptz |                                                    |

### `notes`

| Campo     | Tipo        |
|-----------|-------------|
| id        | uuid (PK)   |
| plant_id  | uuid (FK)   |
| body      | text        |
| created_at| timestamptz |

### `feedback`

| Campo             | Tipo        | Notas                                                  |
|-------------------|-------------|--------------------------------------------------------|
| id                | uuid (PK)   |                                                        |
| user_id           | uuid (FK)   |                                                        |
| plant_id          | uuid (FK)   |                                                        |
| recommendation_id | text        | id estable que generó la IA (e.g. `water-3d`)          |
| helpful           | boolean     |                                                        |
| comment           | text        | opcional                                               |
| created_at        | timestamptz |                                                        |

Los feedbacks negativos se inyectan en el prompt del próximo `/diagnose` de
esa misma planta (ver `backend/src/prompts/plantAnalysis.ts`).

---

## Estados y navegación

```
RootNavigator
├─ AuthStack (si !user)
│  ├─ Onboarding
│  ├─ Login
│  └─ Signup
└─ MainTabs (si user)
   ├─ Home
   ├─ MyPlants
   ├─ Calendar
   └─ Settings
   (modal stack: Capture, Identification, Diagnosis, CarePlan, PlantDetail)
```

`AuthContext` mantiene `user`, `session`, `signIn`, `signUp`, `signOut`.
`PlantContext` mantiene la lista local de plantas + recordatorios y se
sincroniza con Supabase. Si `EXPO_PUBLIC_USE_MOCKS=true`, todo viene de
`lib/mockData.ts`.

---

## Algoritmo de próximo riego

```ts
function nextWatering({
  baseDays,            // wateringFrequencyDays sugerido por IA
  humidityPreference,  // 0..100
  lastWateredAt,       // Date
  now = new Date(),
}) {
  const month = now.getMonth() + 1;
  const seasonFactor =
    [12, 1, 2].includes(month) ? 1.2 :   // invierno HN: regar menos
    [6, 7, 8].includes(month) ? 0.85 :   // verano HN: regar más
    1.0;
  const humidityBoost = clamp((50 - humidityPreference) / 25, -1, 1);
  const adjustedDays = Math.max(1, baseDays * seasonFactor + humidityBoost);
  const next = new Date(lastWateredAt);
  next.setDate(next.getDate() + Math.round(adjustedDays));
  return next;
}
```

- `baseDays` es la fuente de verdad sugerida por la IA (validada).
- `humidityPreference` invierte la lógica: planta que ama humedad alta
  necesita regado más frecuente.
- El factor estacional asume hemisferio sur por default; se puede invertir
  con un setting de usuario.

El cálculo se hace tanto en backend (al crear/actualizar planta) como en el
móvil (para que la UI no espere round-trip).

---

## Loop de mejora con feedback

1. Cada recomendación de la IA viene con un `id` estable (`water-3d`,
   `light-bright-indirect`, ...).
2. En la UI, cada recomendación tiene 👍 / 👎.
3. El móvil llama `POST /feedback` con `{ recommendationId, plantId, helpful, comment }`.
4. El backend guarda en `feedback`.
5. En el próximo `POST /diagnose` de esa planta, el backend busca los
   feedbacks negativos recientes y los agrega al prompt:
   ```
   FEEDBACK PREVIO DEL USUARIO PARA ESTA PLANTA:
   - "regar cada 3 días" → marcado como NO útil. Comentario: "se pudrió la raíz"
   ```
6. Claude ajusta su recomendación con esa señal.

Esto crea un loop simple sin necesidad de fine-tuning.

---

## Errores y estados de carga

- Cada llamada al backend usa un `useApi` hook con `{ data, error, loading }`.
- Errores de red muestran un toast con botón de reintento.
- Errores 4xx muestran un mensaje específico.
- Si la imagen no es suficiente, se muestra un `EmptyState` con CTA "Tomar
  otra foto".
- Cuando `EXPO_PUBLIC_USE_MOCKS=true`, todos los hooks devuelven datos de
  `mockData.ts` con un delay simulado de 800ms.

---

## Notificaciones

- En `SettingsScreen`, el usuario puede pedir el `expoPushToken` con
  `Notifications.getExpoPushTokenAsync()`.
- El token se guarda en `profiles.expo_push_token`.
- Un cron del backend (no incluido en este repo) puede consultar
  `reminders` con `next_run_at <= now AND enabled` y mandar push via
  `https://exp.host/--/api/v2/push/send`.
- Para desarrollo local, se incluye `mobile/src/lib/notifications.ts` con
  `scheduleLocalReminder()` que dispara notificaciones locales sin servidor.
