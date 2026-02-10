create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "Users can view own audit logs" on public.audit_logs
for select using (user_id = auth.uid());

create policy "Users can insert own audit logs" on public.audit_logs
for insert with check (user_id = auth.uid());
