alter table public.entries
  add column if not exists task_horizon text,
  add column if not exists task_area text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'entries_task_horizon_check' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_task_horizon_check
      check (task_horizon is null or task_horizon in ('today','long_term'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'entries_task_area_check' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_task_area_check
      check (task_area is null or task_area in ('personal','professional'));
  end if;
end $$;

create index if not exists entries_task_sections_idx
  on public.entries (user_id, module, task_horizon, task_area, due_date)
  where module = 'tasks';
