-- Longhouse Tools Hub — full schema (fresh Supabase project only)
-- Run once in SQL Editor, then run seed.sql and configure Google OAuth (docs/SUPABASE_SETUP.md)

-- ========== 001_tools_hub.sql ==========
-- Longhouse Tools Hub schema

-- Roles
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User ↔ role assignments
create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

-- Tools registry
create table public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'wrench',
  url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tool ↔ role access
create table public.tool_roles (
  tool_id uuid not null references public.tools (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  primary key (tool_id, role_id)
);

-- Feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_id uuid not null references public.tools (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug = 'admin'
  );
$$;

-- RPC: tools visible to current user
create or replace function public.get_tools_for_user()
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  icon text,
  url text,
  sort_order int
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
    t.sort_order
  from public.tools t
  join public.tool_roles tr on tr.tool_id = t.id
  join public.user_roles ur on ur.role_id = tr.role_id
  where ur.user_id = auth.uid()
    and t.is_active = true
  order by t.sort_order asc, t.name asc;
$$;

grant execute on function public.get_tools_for_user() to authenticated;

-- RLS
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.tools enable row level security;
alter table public.tool_roles enable row level security;
alter table public.feedback enable row level security;

-- profiles
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- roles (read for authenticated; admins manage via service role / SQL)
create policy "Authenticated read roles"
  on public.roles for select
  to authenticated
  using (true);

-- user_roles
create policy "Users read own roles"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

-- tools (read via join in RPC; direct select for admins)
create policy "Users read permitted tools"
  on public.tools for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.tool_roles tr
      join public.user_roles ur on ur.role_id = tr.role_id
      where tr.tool_id = tools.id
        and ur.user_id = auth.uid()
    )
  );

-- tool_roles (read for authenticated)
create policy "Authenticated read tool_roles"
  on public.tool_roles for select
  to authenticated
  using (true);

-- feedback
create policy "Users insert own feedback"
  on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users read own feedback"
  on public.feedback for select
  using (auth.uid() = user_id or public.is_admin());

-- ========== 002_feature_requests.sql ==========
-- Feature requests, votes, and comments

create table public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.feature_request_votes (
  request_id uuid not null references public.feature_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create table public.feature_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.feature_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index feature_requests_tool_id_idx on public.feature_requests (tool_id);
create index feature_request_comments_request_id_idx on public.feature_request_comments (request_id);

-- User can access tool if they have a matching role (same logic as tools RLS)
create or replace function public.user_can_access_tool(p_tool_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.tool_roles tr
      join public.user_roles ur on ur.role_id = tr.role_id
      where tr.tool_id = p_tool_id
        and ur.user_id = auth.uid()
    );
$$;

create or replace function public.get_feature_requests(p_tool_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  created_at timestamptz,
  vote_count bigint,
  comment_count bigint,
  user_has_voted boolean,
  author_id uuid,
  author_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fr.id,
    fr.title,
    fr.description,
    fr.created_at,
    count(frv.user_id)::bigint as vote_count,
    (
      select count(*)::bigint
      from public.feature_request_comments c
      where c.request_id = fr.id
    ) as comment_count,
    exists (
      select 1 from public.feature_request_votes v
      where v.request_id = fr.id and v.user_id = auth.uid()
    ) as user_has_voted,
    fr.user_id as author_id,
    coalesce(p.display_name, p.email, 'Unknown') as author_name
  from public.feature_requests fr
  join public.profiles p on p.id = fr.user_id
  left join public.feature_request_votes frv on frv.request_id = fr.id
  where fr.tool_id = p_tool_id
    and public.user_can_access_tool(p_tool_id)
  group by fr.id, fr.title, fr.description, fr.created_at, fr.user_id, p.display_name, p.email
  order by vote_count desc, fr.created_at desc;
$$;

grant execute on function public.get_feature_requests(uuid) to authenticated;

create or replace function public.get_feature_request_comments(p_request_id uuid)
returns table (
  id uuid,
  message text,
  created_at timestamptz,
  author_id uuid,
  author_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.message,
    c.created_at,
    c.user_id as author_id,
    coalesce(p.display_name, p.email, 'Unknown') as author_name
  from public.feature_request_comments c
  join public.profiles p on p.id = c.user_id
  join public.feature_requests fr on fr.id = c.request_id
  where c.request_id = p_request_id
    and public.user_can_access_tool(fr.tool_id)
  order by c.created_at asc;
$$;

grant execute on function public.get_feature_request_comments(uuid) to authenticated;

-- RLS
alter table public.feature_requests enable row level security;
alter table public.feature_request_votes enable row level security;
alter table public.feature_request_comments enable row level security;

create policy "Read feature requests for accessible tools"
  on public.feature_requests for select
  to authenticated
  using (public.user_can_access_tool(tool_id));

create policy "Insert feature requests for accessible tools"
  on public.feature_requests for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.user_can_access_tool(tool_id)
  );

create policy "Read votes on accessible requests"
  on public.feature_request_votes for select
  to authenticated
  using (
    exists (
      select 1 from public.feature_requests fr
      where fr.id = request_id
        and public.user_can_access_tool(fr.tool_id)
    )
  );

create policy "Insert own votes on accessible requests"
  on public.feature_request_votes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feature_requests fr
      where fr.id = request_id
        and public.user_can_access_tool(fr.tool_id)
    )
  );

create policy "Delete own votes"
  on public.feature_request_votes for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Read comments on accessible requests"
  on public.feature_request_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.feature_requests fr
      where fr.id = request_id
        and public.user_can_access_tool(fr.tool_id)
    )
  );

create policy "Insert comments on accessible requests"
  on public.feature_request_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feature_requests fr
      where fr.id = request_id
        and public.user_can_access_tool(fr.tool_id)
    )
  );

-- ========== 003_departments_and_bugs.sql ==========
-- Departments, tool tagging, and bug reports

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  sort_order int not null default 0
);

insert into public.departments (slug, name, sort_order) values
  ('branding', 'Branding', 1),
  ('graphic-design', 'Graphic Design', 2),
  ('web-design', 'Web Design', 3),
  ('advertising', 'Advertising', 4),
  ('seo', 'SEO', 5),
  ('sales', 'Sales', 6),
  ('social-media', 'Social Media', 7),
  ('operations', 'Operations', 8),
  ('public-relations', 'Public Relations', 9)
on conflict (slug) do nothing;

create table public.tool_departments (
  tool_id uuid not null references public.tools (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  primary key (tool_id, department_id)
);

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_id uuid references public.tools (id) on delete set null,
  description text not null,
  console_logs text not null default '',
  screenshot_path text,
  page_url text,
  created_at timestamptz not null default now()
);

create index bug_reports_created_at_idx on public.bug_reports (created_at desc);

-- Replace get_tools_for_user to include department names
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
  departments text[]
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
    ) as departments
  from public.tools t
  join public.tool_roles tr on tr.tool_id = t.id
  join public.user_roles ur on ur.role_id = tr.role_id
  where ur.user_id = auth.uid()
    and t.is_active = true
  order by t.sort_order asc, t.name asc;
$$;

grant execute on function public.get_tools_for_user() to authenticated;

-- RLS
alter table public.departments enable row level security;
alter table public.tool_departments enable row level security;
alter table public.bug_reports enable row level security;

create policy "Authenticated read departments"
  on public.departments for select
  to authenticated
  using (true);

create policy "Authenticated read tool_departments"
  on public.tool_departments for select
  to authenticated
  using (true);

create policy "Users insert own bug reports"
  on public.bug_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users read own bug reports"
  on public.bug_reports for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins read all bug reports"
  on public.bug_reports for select
  using (public.is_admin());

-- Storage bucket for bug screenshots (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-screenshots',
  'bug-screenshots',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Users upload own bug screenshots"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bug-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users read own bug screenshots"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bug-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins read all bug screenshots"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bug-screenshots'
    and public.is_admin()
  );

-- ========== 004_tool_created_by.sql ==========
-- Tool creator attribution

alter table public.tools
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

create index if not exists tools_created_by_idx on public.tools (created_by);

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
  created_by_name text
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
    coalesce(creator.display_name, creator.email) as created_by_name
  from public.tools t
  join public.tool_roles tr on tr.tool_id = t.id
  join public.user_roles ur on ur.role_id = tr.role_id
  left join public.profiles creator on creator.id = t.created_by
  where ur.user_id = auth.uid()
    and t.is_active = true
  order by t.sort_order asc, t.name asc;
$$;

grant execute on function public.get_tools_for_user() to authenticated;

-- ========== 005_tool_thumbnails.sql ==========
-- Optional custom thumbnail URL per tool (overrides auto-generated preview)

alter table public.tools
  add column if not exists thumbnail_url text;

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
  join public.tool_roles tr on tr.tool_id = t.id
  join public.user_roles ur on ur.role_id = tr.role_id
  left join public.profiles creator on creator.id = t.created_by
  where ur.user_id = auth.uid()
    and t.is_active = true
  order by t.sort_order asc, t.name asc;
$$;

grant execute on function public.get_tools_for_user() to authenticated;


-- ========== 006_roles_v2.sql ==========
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
  thumbnail_url text,
  kind text
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
    t.thumbnail_url,
    t.kind
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

-- ========== 007_list_auth_users.sql ==========
-- Developers: list all Supabase Auth users for Manage access (syncs missing profiles)

create or replace function public.get_users_for_developer()
returns table (
  id uuid,
  email text,
  display_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_developer() then
    return;
  end if;

  insert into public.profiles (id, email, display_name, avatar_url)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
    u.raw_user_meta_data->>'avatar_url'
  from auth.users u
  where u.email is not null
    and not exists (select 1 from public.profiles p where p.id = u.id)
  on conflict (id) do nothing;

  return query
  select
    u.id,
    u.email::text,
    coalesce(
      p.display_name,
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email::text, '@', 1)
    )::text as display_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.email is not null
  order by u.email;
end;
$$;

grant execute on function public.get_users_for_developer() to authenticated;

-- ========== 008_tool_thumbnail_storage.sql ==========
-- Public storage bucket for tool card preview images (uploaded by Developers)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tool-thumbnails',
  'tool-thumbnails',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Developers upload tool thumbnails" on storage.objects;
drop policy if exists "Developers update tool thumbnails" on storage.objects;
drop policy if exists "Developers delete tool thumbnails" on storage.objects;
drop policy if exists "Public read tool thumbnails" on storage.objects;

create policy "Developers upload tool thumbnails"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tool-thumbnails'
    and public.is_developer()
  );

create policy "Developers update tool thumbnails"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'tool-thumbnails' and public.is_developer())
  with check (bucket_id = 'tool-thumbnails' and public.is_developer());

create policy "Developers delete tool thumbnails"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tool-thumbnails' and public.is_developer());

create policy "Public read tool thumbnails"
  on storage.objects for select
  to public
  using (bucket_id = 'tool-thumbnails');

-- ========== 009_feature_request_deletes.sql ==========
-- Users can delete their own feature requests and comments

drop policy if exists "Delete own feature requests" on public.feature_requests;
drop policy if exists "Delete own comments" on public.feature_request_comments;

create policy "Delete own feature requests"
  on public.feature_requests for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Delete own comments"
  on public.feature_request_comments for delete
  to authenticated
  using (auth.uid() = user_id);

grant delete on table public.feature_requests to authenticated;
grant delete on table public.feature_request_comments to authenticated;

-- ========== 010_tool_access_by_slug.sql ==========
-- Slug-based tool access check for external tool apps

create or replace function public.user_can_access_tool_by_slug(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tools t
    where t.slug = p_slug
      and t.is_active = true
      and public.user_can_access_tool(t.id)
  );
$$;

grant execute on function public.user_can_access_tool_by_slug(text) to authenticated;

-- ========== 011_tool_kind.sql ==========
-- Tool vs GPT classification for hub catalog filtering

alter table public.tools
  add column if not exists kind text not null default 'tool'
  check (kind in ('tool', 'gpt'));

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
  thumbnail_url text,
  kind text
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
    t.thumbnail_url,
    t.kind
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

-- ========== 012_creator_team.sql ==========
-- Team creator option (not tied to a user profile)

alter table public.tools
  add column if not exists creator_type text not null default 'user'
  check (creator_type in ('user', 'team'));

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
  thumbnail_url text,
  kind text
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
    case
      when t.creator_type = 'team' then 'Longhouse Team'
      else coalesce(creator.display_name, creator.email)
    end as created_by_name,
    t.thumbnail_url,
    t.kind
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

-- ========== 013_tool_favorites.sql ==========
-- Per-user tool favorites (heart) on the hub dashboard

create table if not exists public.user_tool_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_id uuid not null references public.tools (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);

create index if not exists user_tool_favorites_user_id_idx
  on public.user_tool_favorites (user_id, created_at asc);

alter table public.user_tool_favorites enable row level security;

drop policy if exists "Users read own tool favorites" on public.user_tool_favorites;
drop policy if exists "Users insert own tool favorites for accessible tools" on public.user_tool_favorites;
drop policy if exists "Users delete own tool favorites" on public.user_tool_favorites;

create policy "Users read own tool favorites"
  on public.user_tool_favorites for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own tool favorites for accessible tools"
  on public.user_tool_favorites for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.user_can_access_tool(tool_id)
  );

create policy "Users delete own tool favorites"
  on public.user_tool_favorites for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on table public.user_tool_favorites to authenticated;
