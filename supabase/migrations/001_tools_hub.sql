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
