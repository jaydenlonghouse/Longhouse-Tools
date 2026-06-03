-- Run AFTER first Google sign-in (creates profiles row).
-- Replace YOUR_EMAIL@longhouse.co with your @longhouse.co address.

-- 1) Developer role in Advertising (sees all tools + admin UI)
insert into public.user_department_roles (user_id, department_id, role_id)
select p.id, d.id, r.id
from public.profiles p
cross join public.departments d
cross join public.roles r
where p.email = 'YOUR_EMAIL@longhouse.co'
  and d.slug = 'advertising'
  and r.slug = 'developer'
on conflict (user_id, department_id) do update set role_id = excluded.role_id;

-- 2) Optional: extra assignment to test dept-scoped access (uncomment to use)
-- insert into public.user_department_roles (user_id, department_id, role_id)
-- select p.id, d.id, r.id
-- from public.profiles p
-- cross join public.departments d
-- cross join public.roles r
-- where p.email = 'YOUR_EMAIL@longhouse.co'
--   and d.slug = 'seo'
--   and r.slug = 'specialist'
-- on conflict (user_id, department_id) do update set role_id = excluded.role_id;

-- Verify
select
  p.email,
  d.name as department,
  r.name as role,
  r.rank
from public.profiles p
join public.user_department_roles udr on udr.user_id = p.id
join public.departments d on d.id = udr.department_id
join public.roles r on r.id = udr.role_id
where p.email = 'YOUR_EMAIL@longhouse.co';
