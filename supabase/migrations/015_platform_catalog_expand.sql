-- Additional platform types (Claude, Gemini, ChatGPT, Airtable)

insert into public.platforms (slug, name, icon_path, sort_order)
values
  ('chatgpt', 'ChatGPT', '/platform-icons/chatgpt.png', 5),
  ('claude', 'Claude', '/platform-icons/claude.png', 6),
  ('gemini', 'Gemini', '/platform-icons/gemini.png', 7),
  ('airtable', 'Airtable', '/platform-icons/airtable.png', 8)
on conflict (slug) do update set
  name = excluded.name,
  icon_path = excluded.icon_path,
  sort_order = excluded.sort_order;
