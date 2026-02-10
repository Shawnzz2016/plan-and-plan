-- Enable extensions
create extension if not exists "pgcrypto";

-- Users profile table (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Schedules
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  color text,
  created_at timestamptz default now()
);

-- Events (courses)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  course_id uuid not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  teacher text,
  note text,
  share_code text,
  signature text,
  is_deleted boolean default false,
  created_at timestamptz default now()
);

create index if not exists events_schedule_id_idx on public.events(schedule_id);
create index if not exists events_course_id_idx on public.events(course_id);
create index if not exists events_share_code_idx on public.events(share_code);
create index if not exists events_signature_idx on public.events(signature);

-- Shares (share codes)
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  course_id uuid,
  token text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- RLS
alter table public.users enable row level security;
alter table public.schedules enable row level security;
alter table public.events enable row level security;
alter table public.shares enable row level security;

-- Users policies
create policy "Users can view own profile" on public.users
for select using (id = auth.uid());

create policy "Users can insert own profile" on public.users
for insert with check (id = auth.uid());

create policy "Users can update own profile" on public.users
for update using (id = auth.uid());

-- Schedules policies
create policy "Users can view own schedules" on public.schedules
for select using (user_id = auth.uid());

create policy "Users can insert own schedules" on public.schedules
for insert with check (user_id = auth.uid());

create policy "Users can update own schedules" on public.schedules
for update using (user_id = auth.uid());

create policy "Users can delete own schedules" on public.schedules
for delete using (user_id = auth.uid());

-- Events policies
create policy "Users can view own events" on public.events
for select using (
  exists (
    select 1 from public.schedules s
    where s.id = schedule_id and s.user_id = auth.uid()
  )
);

create policy "Users can insert own events" on public.events
for insert with check (
  exists (
    select 1 from public.schedules s
    where s.id = schedule_id and s.user_id = auth.uid()
  )
);

create policy "Users can update own events" on public.events
for update using (
  exists (
    select 1 from public.schedules s
    where s.id = schedule_id and s.user_id = auth.uid()
  )
);

create policy "Users can delete own events" on public.events
for delete using (
  exists (
    select 1 from public.schedules s
    where s.id = schedule_id and s.user_id = auth.uid()
  )
);

-- Shares policies
create policy "Users can view own shares" on public.shares
for select using (
  exists (
    select 1 from public.schedules s
    where s.id = schedule_id and s.user_id = auth.uid()
  )
);

create policy "Users can insert own shares" on public.shares
for insert with check (
  exists (
    select 1 from public.schedules s
    where s.id = schedule_id and s.user_id = auth.uid()
  )
);

create policy "Users can update own shares" on public.shares
for update using (
  exists (
    select 1 from public.schedules s
    where s.id = schedule_id and s.user_id = auth.uid()
  )
);

create policy "Users can delete own shares" on public.shares
for delete using (
  exists (
    select 1 from public.schedules s
    where s.id = schedule_id and s.user_id = auth.uid()
  )
);

-- Allow importing by token (read-only)
create policy "Anyone can read share by token" on public.shares
for select using (true);

create policy "Anyone can read shared events by share_code" on public.events
for select using (
  share_code is not null and exists (
    select 1 from public.shares sh
    where sh.token = share_code
      and (sh.expires_at is null or sh.expires_at > now())
  )
);
