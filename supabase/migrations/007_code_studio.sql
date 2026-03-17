-- ============================================================
-- CODE STUDIO TABLES
-- Projects, Files, Deployments, Generation Logs
-- ============================================================

-- code_projects — one row per user project
create table if not exists public.code_projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  style         text not null default 'dark-modern',
  type          text not null default 'static',  -- static | react | landing | component
  is_public     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.code_projects enable row level security;

create policy "Users can manage their own projects"
  on public.code_projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists code_projects_user_id_idx on public.code_projects(user_id);

-- code_files — one row per file in a project
create table if not exists public.code_files (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.code_projects(id) on delete cascade,
  name          text not null,
  content       text not null default '',
  language      text not null default 'html',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (project_id, name)
);

alter table public.code_files enable row level security;

create policy "Users can manage files in their own projects"
  on public.code_files
  for all
  using (
    exists (
      select 1 from public.code_projects p
      where p.id = code_files.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.code_projects p
      where p.id = code_files.project_id
        and p.user_id = auth.uid()
    )
  );

create index if not exists code_files_project_id_idx on public.code_files(project_id);

-- code_deployments — record of every Vercel deployment
create table if not exists public.code_deployments (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid references public.code_projects(id) on delete set null,
  user_id             uuid not null references auth.users(id) on delete cascade,
  vercel_deployment_id text,
  url                 text,
  status              text not null default 'deploying',  -- deploying | ready | error
  created_at          timestamptz not null default now()
);

alter table public.code_deployments enable row level security;

create policy "Users can see their own deployments"
  on public.code_deployments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists code_deployments_user_id_idx on public.code_deployments(user_id);
create index if not exists code_deployments_project_id_idx on public.code_deployments(project_id);

-- code_generations — track AI usage per user
create table if not exists public.code_generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references public.code_projects(id) on delete set null,
  prompt      text,
  tokens_used integer,
  style       text,
  created_at  timestamptz not null default now()
);

alter table public.code_generations enable row level security;

create policy "Users can see their own generations"
  on public.code_generations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists code_generations_user_id_idx on public.code_generations(user_id);
