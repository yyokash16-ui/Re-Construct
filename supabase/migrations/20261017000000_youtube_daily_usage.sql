create table if not exists public.youtube_daily_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  youtube_minutes integer not null default 0 check (youtube_minutes >= 0),
  shorts_minutes integer not null default 0 check (shorts_minutes >= 0),
  shorts_count integer not null default 0 check (shorts_count >= 0),
  regular_minutes integer generated always as (greatest(youtube_minutes - shorts_minutes, 0)) stored,
  source text not null default 'android_companion' check (source in ('android_companion','manual')),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, usage_date)
);
alter table public.youtube_daily_usage enable row level security;
create policy "Users can view their own YouTube usage" on public.youtube_daily_usage for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own YouTube usage" on public.youtube_daily_usage for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own YouTube usage" on public.youtube_daily_usage for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists youtube_daily_usage_user_date_idx on public.youtube_daily_usage(user_id, usage_date desc);
