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
