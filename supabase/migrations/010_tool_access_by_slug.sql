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
