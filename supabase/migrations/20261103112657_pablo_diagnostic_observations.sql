create table public.pablo_observations (
  item smallint not null check (item between 0 and 13),
  phase smallint not null check (phase in (0,1)),
  answer text not null check (length(answer) between 1 and 480),
  reasoning text not null check (length(reasoning) between 1 and 900),
  confidence smallint not null check (confidence between 0 and 2),
  hints smallint not null check (hints between 0 and 2),
  recorded_at timestamptz not null default now(),
  primary key (item,phase)
);
alter table public.pablo_observations enable row level security;
revoke all on public.pablo_observations from public, anon, authenticated, service_role;
grant select,insert on public.pablo_observations to service_role;
