-- =========================================================================
-- BrewLog Database Schema & Row-Level Security (RLS)
-- Specialty Coffee Pour-Over Extraction Tracker
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Coffee Beans Table
create table if not exists public.beans (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  origin text not null,
  region text,
  farm_or_station text,
  varietal text,
  process text not null,
  roaster text not null,
  roast_level text not null,
  roast_date date not null,
  tasting_notes_package text[] default '{}',
  total_weight_grams numeric not null default 200,
  remaining_weight_grams numeric not null default 200,
  golden_log_id text,
  elevation_meters text,
  density text,
  price numeric,
  currency text default 'TWD',
  rating numeric,
  status text not null default 'active',
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Brew Logs Table
create table if not exists public.brew_logs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  bean_id text references public.beans(id) on delete cascade not null,
  brew_date timestamptz not null,
  days_off_roast integer not null,
  dripper text not null,
  filter_paper text,
  grinder text not null,
  grind_setting text not null,
  dose_grams numeric not null,
  water_grams numeric not null,
  ratio numeric not null,
  water_temp_celsius numeric not null,
  water_type text,
  bloom_water_grams numeric,
  bloom_duration_seconds integer,
  stages jsonb not null default '[]'::jsonb,
  total_time_seconds integer not null,
  drawdown_time_seconds integer,
  tds_percent numeric,
  extraction_yield_percent numeric,
  sensory jsonb not null,
  flavor_tags text[] default '{}',
  extraction_assessment text not null,
  dialin_adjustment_notes text,
  overall_score numeric not null,
  is_golden boolean default false not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for lightning fast queries by user and date
create index if not exists idx_beans_user_id on public.beans(user_id);
create index if not exists idx_brew_logs_user_id on public.brew_logs(user_id);
create index if not exists idx_brew_logs_bean_id on public.brew_logs(bean_id);
create index if not exists idx_brew_logs_brew_date on public.brew_logs(brew_date desc);

-- Auto-update updated_at timestamp trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_beans_updated_at on public.beans;
create trigger set_beans_updated_at
  before update on public.beans
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_brew_logs_updated_at on public.brew_logs;
create trigger set_brew_logs_updated_at
  before update on public.brew_logs
  for each row execute procedure public.handle_updated_at();

-- =========================================================================
-- Row Level Security (RLS) Policies
-- Ensures each user can only read, insert, update, or delete their own coffee records
-- =========================================================================
alter table public.beans enable row level security;
alter table public.brew_logs enable row level security;

-- Beans Policies
create policy "Users can select own beans"
  on public.beans for select
  using (auth.uid() = user_id);

create policy "Users can insert own beans"
  on public.beans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own beans"
  on public.beans for update
  using (auth.uid() = user_id);

create policy "Users can delete own beans"
  on public.beans for delete
  using (auth.uid() = user_id);

-- Brew Logs Policies
create policy "Users can select own brew logs"
  on public.brew_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own brew logs"
  on public.brew_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own brew logs"
  on public.brew_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own brew logs"
  on public.brew_logs for delete
  using (auth.uid() = user_id);

-- Enable Realtime for beans and brew_logs
alter publication supabase_realtime add table public.beans;
alter publication supabase_realtime add table public.brew_logs;
