-- Problem reports submitted by users
create table if not exists public.problem_reports (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete set null,
  email       text,
  display_name text,
  category    text not null default 'bug',   -- bug | feature | billing | other
  title       text not null,
  description text,
  status      text not null default 'open',  -- open | resolved
  created_at  timestamptz default now()
);

alter table public.problem_reports enable row level security;

-- Users can insert their own reports (no read needed client-side)
create policy "Users can submit problem reports"
  on public.problem_reports for insert
  with check (auth.uid() = user_id);
