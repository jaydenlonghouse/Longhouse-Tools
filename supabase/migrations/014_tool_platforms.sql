-- Platform registry + per-tool platform links (Leadership/Developer visibility on hub)

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tool_platforms (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id) on delete cascade,
  platform_id uuid not null references public.platforms (id) on delete restrict,
  label text not null default '',
  link_url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tool_id, platform_id)
);

create index if not exists tool_platforms_tool_id_idx on public.tool_platforms (tool_id);

insert into public.platforms (slug, name, icon_path, sort_order)
values
  ('github', 'GitHub', '/platform-icons/github.png', 1),
  ('supabase', 'Supabase', '/platform-icons/supabase.png', 2),
  ('vercel', 'Vercel', '/platform-icons/vercel.png', 3),
  ('netlify', 'Netlify', '/platform-icons/netlify.png', 4)
on conflict (slug) do update set
  name = excluded.name,
  icon_path = excluded.icon_path,
  sort_order = excluded.sort_order;

alter table public.platforms enable row level security;
alter table public.tool_platforms enable row level security;

drop policy if exists "Authenticated read platforms" on public.platforms;
drop policy if exists "Developers manage platforms" on public.platforms;
drop policy if exists "Developers read tool_platforms" on public.tool_platforms;
drop policy if exists "Developers manage tool_platforms" on public.tool_platforms;

create policy "Authenticated read platforms"
  on public.platforms for select
  to authenticated
  using (true);

create policy "Developers manage platforms"
  on public.platforms for all
  to authenticated
  using (public.is_developer())
  with check (public.is_developer());

create policy "Developers read tool_platforms"
  on public.tool_platforms for select
  to authenticated
  using (public.is_developer());

create policy "Developers manage tool_platforms"
  on public.tool_platforms for all
  to authenticated
  using (public.is_developer())
  with check (public.is_developer());

grant select on table public.platforms to authenticated;
grant select, insert, update, delete on table public.platforms to authenticated;
grant select, insert, update, delete on table public.tool_platforms to authenticated;

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
  kind text,
  platforms jsonb
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
    t.kind,
    case
      when public.is_leadership_or_above() then
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'slug', p.slug,
                'name', p.name,
                'icon_path', p.icon_path,
                'label', tp.label,
                'link_url', tp.link_url
              )
              order by tp.sort_order, p.sort_order, p.name
            )
            from public.tool_platforms tp
            join public.platforms p on p.id = tp.platform_id
            where tp.tool_id = t.id
          ),
          '[]'::jsonb
        )
      else '[]'::jsonb
    end as platforms
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
