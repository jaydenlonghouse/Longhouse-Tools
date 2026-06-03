-- Run after setup_all.sql (includes 006_roles_v2).
-- Roles are defined in migration 006; this seeds tools, departments, and access tiers.

-- Sample tools (placeholder URLs)
insert into public.tools (slug, name, description, icon, url, sort_order) values
  (
    'ads-dashboard',
    'Ads Dashboard',
    'Campaign performance, KPIs, and linked deals.',
    'bar-chart-3',
    'https://longhouse.co',
    1
  ),
  (
    'partner-onboarding',
    'Partner Onboarding',
    'Generate and manage partner onboarding materials.',
    'users',
    'https://longhouse.co',
    2
  ),
  (
    'internal-wiki',
    'Internal Wiki',
    'Team documentation and process guides.',
    'book-open',
    'https://longhouse.co',
    3
  )
on conflict (slug) do nothing;

-- Department tags per tool
insert into public.tool_departments (tool_id, department_id)
select t.id, d.id
from public.tools t
cross join public.departments d
where t.slug = 'ads-dashboard' and d.slug in ('advertising', 'operations')
on conflict do nothing;

insert into public.tool_departments (tool_id, department_id)
select t.id, d.id
from public.tools t
cross join public.departments d
where t.slug = 'partner-onboarding' and d.slug in ('sales', 'operations')
on conflict do nothing;

insert into public.tool_departments (tool_id, department_id)
select t.id, d.id
from public.tools t
cross join public.departments d
where t.slug = 'internal-wiki' and d.slug in ('operations', 'branding')
on conflict do nothing;

-- Access tiers (Specialist = lowest selected tier; users at that rank and above in matching dept get access)
-- Ads Dashboard: Specialist tier → all dept members Specialist through Developer
insert into public.tool_access_tiers (tool_id, role_id)
select t.id, r.id
from public.tools t
cross join public.roles r
where t.slug = 'ads-dashboard' and r.slug = 'specialist'
on conflict do nothing;

-- Partner Onboarding: Results Manager tier → RM, DH, Leadership, Developer (not Specialist)
insert into public.tool_access_tiers (tool_id, role_id)
select t.id, r.id
from public.tools t
cross join public.roles r
where t.slug = 'partner-onboarding' and r.slug = 'results_manager'
on conflict do nothing;

-- Internal Wiki: Department Head only → DH, Leadership, Developer
insert into public.tool_access_tiers (tool_id, role_id)
select t.id, r.id
from public.tools t
cross join public.roles r
where t.slug = 'internal-wiki' and r.slug = 'department_head'
on conflict do nothing;
