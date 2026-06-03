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
