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
