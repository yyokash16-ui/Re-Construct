create extension if not exists pgcrypto;

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('tasks','career','business','review','entertainment','spend')),
  title text not null check (char_length(trim(title)) between 1 and 200),
  details text not null default '',
  category text not null default '',
  status text not null default 'active' check (status in ('active','in_progress','completed','archived')),
  due_date date,
  amount numeric(12,2) check (amount is null or amount >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  rating numeric(2,1) check (rating is null or rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_user_module_created_idx on public.entries (user_id, module, created_at desc);
create index entries_user_due_date_idx on public.entries (user_id, due_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_set_updated_at
before update on public.entries
for each row execute function public.set_updated_at();

alter table public.entries enable row level security;

create policy "Users can view their own entries"
on public.entries for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own entries"
on public.entries for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own entries"
on public.entries for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own entries"
on public.entries for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.entries to authenticated;
