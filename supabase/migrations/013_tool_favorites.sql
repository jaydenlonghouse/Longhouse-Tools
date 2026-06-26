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
