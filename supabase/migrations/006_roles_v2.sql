-- Roles v2: hierarchical ranks, per-department assignments, tool access tiers

-- ---------------------------------------------------------------------------
-- Schema changes
-- ---------------------------------------------------------------------------

alter table public.roles add column if not exists rank int;

-- Remove legacy v1 access tables
drop policy if exists "Users read own roles" on public.user_roles;
drop table if exists public.user_roles cascade;

drop policy if exists "Authenticated read tool_roles" on public.tool_roles;
drop policy if exists "Users read permitted tools" on public.tools;
drop table if exists public.tool_roles cascade;

-- Reseed roles (clear FK-dependent data first in upgrade path)
delete from public.roles;

insert into public.roles (slug, name, rank) values
  ('specialist', 'Specialist', 1),
  ('results_manager', 'Results Manager', 2),
  ('department_head', 'Department Head', 3),
  ('leadership', 'Leadership', 4),
  ('developer', 'Developer', 5);

alter table public.roles alter column rank set not null;
create unique index if not exists roles_rank_unique on public.roles (rank);

-- One role per user per department
create table public.user_department_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, department_id)
);

create index user_department_roles_user_id_idx on public.user_department_roles (user_id);
create index user_department_roles_department_id_idx on public.user_department_roles (department_id);

-- Minimum access tiers selected per tool (cascade upward by rank)
create table public.tool_access_tiers (
  tool_id uuid not null references public.tools (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  primary key (tool_id, role_id)
);

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_max_role_rank()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(r.rank), 0)
  from public.user_department_roles udr
  join public.roles r on r.id = udr.role_id
  where udr.user_id = auth.uid();
$$;

create or replace function public.is_leadership_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_max_role_rank() >= 4;
$$;

create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_max_role_rank() >= 5;
$$;

-- Backward-compatible alias for existing policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_developer();
$$;

create or replace function public.user_can_access_tool(p_tool_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_leadership_or_above()
    or exists (
      select 1
      from public.user_department_roles udr
      join public.roles ur on ur.id = udr.role_id
      join public.tool_departments td on td.department_id = udr.department_id
      join public.tool_access_tiers tat on tat.tool_id = td.tool_id
      join public.roles tr on tr.id = tat.role_id
      where udr.user_id = auth.uid()
        and td.tool_id = p_tool_id
        and ur.rank >= tr.rank
    );
$$;

-- ---------------------------------------------------------------------------
-- Tools visible to current user
-- ---------------------------------------------------------------------------

drop function if exists public.get_tools_for_user();

create or replace function public.get_tools_for_user()
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  icon text,
  url text,
  sort_order int,
  departments text[],
  created_by_name text,
  thumbnail_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct
    t.id,
    t.slug,
    t.name,
    t.description,
    t.icon,
    t.url,
    t.sort_order,
    coalesce(
      (
        select array_agg(d.name order by d.sort_order, d.name)
        from public.tool_departments td
        join public.departments d on d.id = td.department_id
        where td.tool_id = t.id
      ),
      '{}'::text[]
    ) as departments,
    coalesce(creator.display_name, creator.email) as created_by_name,
    t.thumbnail_url
  from public.tools t
  left join public.profiles creator on creator.id = t.created_by
  where t.is_active = true
    and (
      public.is_leadership_or_above()
      or exists (
        select 1
        from public.user_department_roles udr
        join public.roles ur on ur.id = udr.role_id
        join public.tool_departments td on td.department_id = udr.department_id
          and td.tool_id = t.id
        join public.tool_access_tiers tat on tat.tool_id = t.id
        join public.roles tr on tr.id = tat.role_id
        where udr.user_id = auth.uid()
          and ur.rank >= tr.rank
      )
    )
  order by t.sort_order asc, t.name asc;
$$;

grant execute on function public.get_tools_for_user() to authenticated;
grant execute on function public.user_max_role_rank() to authenticated;
grant execute on function public.is_leadership_or_above() to authenticated;
grant execute on function public.is_developer() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: user_department_roles
-- ---------------------------------------------------------------------------

alter table public.user_department_roles enable row level security;

create policy "Users read own department roles"
  on public.user_department_roles for select
  using (auth.uid() = user_id or public.is_developer());

create policy "Developers manage department roles"
  on public.user_department_roles for all
  using (public.is_developer())
  with check (public.is_developer());

-- ---------------------------------------------------------------------------
-- RLS: tool_access_tiers
-- ---------------------------------------------------------------------------

alter table public.tool_access_tiers enable row level security;

create policy "Authenticated read tool access tiers"
  on public.tool_access_tiers for select
  to authenticated
  using (true);

create policy "Developers manage tool access tiers"
  on public.tool_access_tiers for all
  using (public.is_developer())
  with check (public.is_developer());

-- ---------------------------------------------------------------------------
-- RLS: tools (developers can insert/update/delete)
-- ---------------------------------------------------------------------------

drop policy if exists "Users read permitted tools" on public.tools;

create policy "Users read tools via RPC or developer"
  on public.tools for select
  to authenticated
  using (true);

create policy "Developers insert tools"
  on public.tools for insert
  to authenticated
  with check (public.is_developer());

create policy "Developers update tools"
  on public.tools for update
  to authenticated
  using (public.is_developer())
  with check (public.is_developer());

create policy "Developers delete tools"
  on public.tools for delete
  to authenticated
  using (public.is_developer());

-- ---------------------------------------------------------------------------
-- RLS: tool_departments (developers manage)
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated read tool_departments" on public.tool_departments;

create policy "Authenticated read tool_departments"
  on public.tool_departments for select
  to authenticated
  using (true);

create policy "Developers manage tool_departments"
  on public.tool_departments for all
  using (public.is_developer())
  with check (public.is_developer());

-- ---------------------------------------------------------------------------
-- RPC: current user access summary (for UI gating)
-- ---------------------------------------------------------------------------

create or replace function public.get_my_access()
returns table (
  max_rank int,
  is_developer boolean,
  is_leadership_or_above boolean,
  assignments jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    public.user_max_role_rank() as max_rank,
    public.is_developer() as is_developer,
    public.is_leadership_or_above() as is_leadership_or_above,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'department_id', udr.department_id,
            'department_name', d.name,
            'department_slug', d.slug,
            'role_id', udr.role_id,
            'role_slug', r.slug,
            'role_name', r.name,
            'role_rank', r.rank
          )
          order by d.sort_order, d.name
        )
        from public.user_department_roles udr
        join public.departments d on d.id = udr.department_id
        join public.roles r on r.id = udr.role_id
        where udr.user_id = auth.uid()
      ),
      '[]'::jsonb
    ) as assignments;
$$;

grant execute on function public.get_my_access() to authenticated;

-- Developers can list profiles for role manager
drop policy if exists "Users read own profile" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_developer());
