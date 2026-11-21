-- Store Coach: initial schema. Owner: Subh.
-- Shapes follow types/index.ts (the handshake contract). PLAN.md section 7 lists the tables.
-- Security model:
--   * RLS is on for every table.
--   * anon / authenticated may only SELECT, and only on tables the pages read.
--   * All writes go through the service role (local loader, /api/run, /api/card), which bypasses RLS.
--   * salesperson_metrics is server-only: no anon access at all.

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------
create table public.area_managers (
  area_manager_id     text primary key,
  name                text not null,
  city                text not null,
  max_alerts_per_week integer not null default 5 check (max_alerts_per_week > 0)
);

create table public.stores (
  store_id        text primary key,
  city            text not null,
  state           text not null,
  tier            text,
  opened_on       date,
  area_manager_id text
);
create index stores_area_manager_id_idx on public.stores (area_manager_id);

-- ---------------------------------------------------------------------------
-- Metrics (aggregates only, never customer IDs)
-- ---------------------------------------------------------------------------
create table public.store_metrics (
  store_id       text not null,
  as_of          date not null,
  "window"       text not null check ("window" in ('current_28d', 'baseline_mayjul', 'all_time')),
  footfall       integer not null check (footfall >= 0),
  bills          integer not null check (bills >= 0),
  conversion     double precision not null,
  ipb            double precision not null,
  discount_pct   double precision not null,
  repeat_rate    double precision,
  avg_bill_value double precision not null,
  presence       double precision,
  primary key (store_id, as_of, "window")
);
create index store_metrics_as_of_idx on public.store_metrics (as_of);

create table public.salesperson_metrics (
  salesperson_id       text not null,
  store_id             text not null,
  as_of                date not null,
  display_name         text not null,
  bills                integer not null check (bills >= 0),
  ipb                  double precision not null,
  discount_pct         double precision not null,
  repeat_rate          double precision,
  presence             double precision,
  pair_attach_sherwani double precision,
  pair_attach_kurta    double precision,
  last_active          date,
  inferred_left        boolean not null default false,
  primary key (salesperson_id, as_of)
);
create index salesperson_metrics_store_as_of_idx on public.salesperson_metrics (store_id, as_of);

-- ---------------------------------------------------------------------------
-- Issues, evidence, cards
-- Evidence lives inside issues.evidence (jsonb, type Evidence) so an issue and
-- the numbers behind it are always written together and can never drift apart.
-- ---------------------------------------------------------------------------
create table public.issues (
  id              text primary key, -- `${as_of}:${store_id}:${type}`
  as_of           date not null,
  store_id        text not null,
  area_manager_id text not null,
  lever           text not null check (lever in ('more_bills', 'bigger_baskets', 'more_repeat')),
  type            text not null check (type in (
                    'staff_absent_or_left', 'understaffed_busy_days', 'conversion_drop_footfall_steady',
                    'city_slowdown', 'missing_pair', 'discount_above_norm',
                    'category_avoidance', 'low_repeat', 'role_model')),
  rupees_at_stake double precision not null check (rupees_at_stake >= 0),
  rank            integer not null check (rank >= 1),
  cause           text not null,
  action          jsonb not null, -- IssueAction
  evidence        jsonb not null, -- Evidence
  followup        jsonb           -- Followup | null
);
create index issues_am_as_of_rank_idx on public.issues (area_manager_id, as_of, rank);
create index issues_store_as_of_idx on public.issues (store_id, as_of);
create index issues_as_of_type_idx on public.issues (as_of, type);

create table public.cards (
  id             text primary key default gen_random_uuid()::text,
  issue_id       text not null references public.issues (id) on delete cascade,
  audience       text not null check (audience in ('am', 'salesperson')),
  salesperson_id text,
  text           text not null,
  source         text not null check (source in ('gemini', 'template')),
  validation     jsonb not null, -- CardValidation
  rejected_draft text,
  created_at     timestamptz not null default now()
);
create index cards_issue_id_created_at_idx on public.cards (issue_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Data-quality flags (never alerted to area managers)
-- ---------------------------------------------------------------------------
create table public.dq_flags (
  id            text primary key,
  store_id      text,
  kind          text not null check (kind in (
                  'packaging_rows', 'bills_exceed_footfall', 'new_store_no_baseline',
                  'staff_no_exit_date', 'festival_dip')),
  detail        text not null,
  rows_affected integer not null default 0 check (rows_affected >= 0),
  alerted       boolean not null default false check (alerted = false)
);
create index dq_flags_store_id_idx on public.dq_flags (store_id);

-- ---------------------------------------------------------------------------
-- Run log (cron / manual / load)
-- ---------------------------------------------------------------------------
create table public.runs (
  id              text primary key default gen_random_uuid()::text,
  trigger         text not null check (trigger in ('cron', 'manual', 'load')),
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  as_of           date not null,
  rows_read       integer not null default 0,
  issues          integer not null default 0,
  cards           integer not null default 0,
  gemini_ok       integer not null default 0,
  gemini_fallback integer not null default 0,
  ok              boolean not null default false,
  error           text
);
create index runs_started_at_idx on public.runs (started_at desc);

-- ---------------------------------------------------------------------------
-- Row level security + grants
-- ---------------------------------------------------------------------------
alter table public.area_managers       enable row level security;
alter table public.stores              enable row level security;
alter table public.store_metrics       enable row level security;
alter table public.salesperson_metrics enable row level security;
alter table public.issues              enable row level security;
alter table public.cards               enable row level security;
alter table public.dq_flags            enable row level security;
alter table public.runs                enable row level security;

-- Start from zero for the public roles, then grant only reads.
revoke all on
  public.area_managers, public.stores, public.store_metrics, public.salesperson_metrics,
  public.issues, public.cards, public.dq_flags, public.runs
from anon, authenticated;

grant select on
  public.area_managers, public.stores, public.store_metrics,
  public.issues, public.cards, public.dq_flags, public.runs
to anon, authenticated;

-- The pages are public (no login), so every reader sees every row of the read tables.
create policy "public read" on public.area_managers for select to anon, authenticated using (true);
create policy "public read" on public.stores        for select to anon, authenticated using (true);
create policy "public read" on public.store_metrics for select to anon, authenticated using (true);
create policy "public read" on public.issues        for select to anon, authenticated using (true);
create policy "public read" on public.cards         for select to anon, authenticated using (true);
create policy "public read" on public.dq_flags      for select to anon, authenticated using (true);
create policy "public read" on public.runs          for select to anon, authenticated using (true);

-- salesperson_metrics: no grant and no policy for anon/authenticated on purpose (server-only).
-- The service role keeps full access to every table.
grant all on
  public.area_managers, public.stores, public.store_metrics, public.salesperson_metrics,
  public.issues, public.cards, public.dq_flags, public.runs
to service_role;
