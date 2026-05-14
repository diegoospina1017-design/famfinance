-- PlantCare AI — esquema completo para Supabase / Postgres
-- Ejecutar en SQL Editor o vía `supabase db push`.

-- =========================================================================
-- 1. Extensiones
-- =========================================================================
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 2. profiles  (extiende auth.users)
-- =========================================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  expo_push_token text,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner upsert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- Cuando se crea un usuario en auth, creamos su profile vacío.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 3. plants
-- =========================================================================
create table if not exists public.plants (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  nickname                 text,
  common_name              text not null,
  scientific_name          text,
  confidence               numeric check (confidence between 0 and 1),
  description              text,
  cover_photo_url          text,
  watering_frequency_days  int  not null default 7,
  light                    text,
  temperature_min_c        numeric,
  temperature_max_c        numeric,
  humidity_preference      int  check (humidity_preference between 0 and 100),
  substrate                text,
  fertilizer               text,
  last_watered_at          timestamptz,
  next_watering_at         timestamptz,
  last_health              text check (last_health in ('green','yellow','red')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists plants_user_id_idx on public.plants(user_id);

alter table public.plants enable row level security;

create policy "plants: owner select" on public.plants
  for select using (auth.uid() = user_id);
create policy "plants: owner insert" on public.plants
  for insert with check (auth.uid() = user_id);
create policy "plants: owner update" on public.plants
  for update using (auth.uid() = user_id);
create policy "plants: owner delete" on public.plants
  for delete using (auth.uid() = user_id);

-- =========================================================================
-- 4. plant_photos
-- =========================================================================
create table if not exists public.plant_photos (
  id           uuid primary key default uuid_generate_v4(),
  plant_id     uuid not null references public.plants(id) on delete cascade,
  url          text not null,
  taken_at     timestamptz not null default now(),
  diagnosis_id uuid
);

create index if not exists plant_photos_plant_id_idx on public.plant_photos(plant_id);

alter table public.plant_photos enable row level security;

create policy "plant_photos: owner select" on public.plant_photos
  for select using (
    exists (select 1 from public.plants p where p.id = plant_id and p.user_id = auth.uid())
  );
create policy "plant_photos: owner insert" on public.plant_photos
  for insert with check (
    exists (select 1 from public.plants p where p.id = plant_id and p.user_id = auth.uid())
  );
create policy "plant_photos: owner delete" on public.plant_photos
  for delete using (
    exists (select 1 from public.plants p where p.id = plant_id and p.user_id = auth.uid())
  );

-- =========================================================================
-- 5. diagnoses
-- =========================================================================
create table if not exists public.diagnoses (
  id                   uuid primary key default uuid_generate_v4(),
  plant_id             uuid not null references public.plants(id) on delete cascade,
  photo_url            text,
  severity             text check (severity in ('low','medium','high')),
  health               text check (health in ('green','yellow','red')),
  issues               jsonb not null default '[]',
  summary              text,
  low_confidence       boolean not null default false,
  recommended_actions  jsonb not null default '[]',
  avoid                jsonb not null default '[]',
  created_at           timestamptz not null default now()
);

create index if not exists diagnoses_plant_id_idx on public.diagnoses(plant_id);

alter table public.diagnoses enable row level security;

create policy "diagnoses: owner select" on public.diagnoses
  for select using (
    exists (select 1 from public.plants p where p.id = plant_id and p.user_id = auth.uid())
  );
create policy "diagnoses: owner insert" on public.diagnoses
  for insert with check (
    exists (select 1 from public.plants p where p.id = plant_id and p.user_id = auth.uid())
  );

-- =========================================================================
-- 6. reminders
-- =========================================================================
create table if not exists public.reminders (
  id             uuid primary key default uuid_generate_v4(),
  plant_id       uuid not null references public.plants(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           text not null check (type in ('watering','fertilizing','pest-check')),
  frequency_days int  not null check (frequency_days > 0),
  next_run_at    timestamptz not null,
  enabled        boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists reminders_user_id_idx on public.reminders(user_id);
create index if not exists reminders_next_run_idx on public.reminders(next_run_at) where enabled;

alter table public.reminders enable row level security;

create policy "reminders: owner all" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================================
-- 7. notes
-- =========================================================================
create table if not exists public.notes (
  id         uuid primary key default uuid_generate_v4(),
  plant_id   uuid not null references public.plants(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_plant_id_idx on public.notes(plant_id);

alter table public.notes enable row level security;

create policy "notes: owner all" on public.notes
  for all using (
    exists (select 1 from public.plants p where p.id = plant_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.plants p where p.id = plant_id and p.user_id = auth.uid())
  );

-- =========================================================================
-- 8. feedback
-- =========================================================================
create table if not exists public.feedback (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  plant_id          uuid not null references public.plants(id) on delete cascade,
  recommendation_id text not null,
  helpful           boolean not null,
  comment           text,
  created_at        timestamptz not null default now()
);

create index if not exists feedback_plant_id_idx on public.feedback(plant_id);

alter table public.feedback enable row level security;

create policy "feedback: owner all" on public.feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================================
-- 9. trigger updated_at
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists plants_set_updated_at on public.plants;
create trigger plants_set_updated_at
  before update on public.plants
  for each row execute function public.set_updated_at();
