-- Feature requests, votes, and comments

create table public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.feature_request_votes (
  request_id uuid not null references public.feature_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create table public.feature_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.feature_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index feature_requests_tool_id_idx on public.feature_requests (tool_id);
create index feature_request_comments_request_id_idx on public.feature_request_comments (request_id);

-- User can access tool if they have a matching role (same logic as tools RLS)
create or replace function public.user_can_access_tool(p_tool_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.tool_roles tr
      join public.user_roles ur on ur.role_id = tr.role_id
      where tr.tool_id = p_tool_id
        and ur.user_id = auth.uid()
    );
$$;

create or replace function public.get_feature_requests(p_tool_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  created_at timestamptz,
  vote_count bigint,
  user_has_voted boolean,
  author_id uuid,
  author_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fr.id,
    fr.title,
    fr.description,
    fr.created_at,
    count(frv.user_id)::bigint as vote_count,
    exists (
      select 1 from public.feature_request_votes v
      where v.request_id = fr.id and v.user_id = auth.uid()
    ) as user_has_voted,
    fr.user_id as author_id,
    coalesce(p.display_name, p.email, 'Unknown') as author_name
  from public.feature_requests fr
  join public.profiles p on p.id = fr.user_id
  left join public.feature_request_votes frv on frv.request_id = fr.id
  where fr.tool_id = p_tool_id
    and public.user_can_access_tool(p_tool_id)
  group by fr.id, fr.title, fr.description, fr.created_at, fr.user_id, p.display_name, p.email
  order by vote_count desc, fr.created_at desc;
$$;

grant execute on function public.get_feature_requests(uuid) to authenticated;

create or replace function public.get_feature_request_comments(p_request_id uuid)
returns table (
  id uuid,
  message text,
  created_at timestamptz,
  author_id uuid,
  author_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.message,
    c.created_at,
    c.user_id as author_id,
    coalesce(p.display_name, p.email, 'Unknown') as author_name
  from public.feature_request_comments c
  join public.profiles p on p.id = c.user_id
  join public.feature_requests fr on fr.id = c.request_id
  where c.request_id = p_request_id
    and public.user_can_access_tool(fr.tool_id)
  order by c.created_at asc;
$$;

grant execute on function public.get_feature_request_comments(uuid) to authenticated;

-- RLS
alter table public.feature_requests enable row level security;
alter table public.feature_request_votes enable row level security;
alter table public.feature_request_comments enable row level security;

create policy "Read feature requests for accessible tools"
  on public.feature_requests for select
  to authenticated
  using (public.user_can_access_tool(tool_id));

create policy "Insert feature requests for accessible tools"
  on public.feature_requests for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.user_can_access_tool(tool_id)
  );

create policy "Read votes on accessible requests"
  on public.feature_request_votes for select
  to authenticated
  using (
    exists (
      select 1 from public.feature_requests fr
      where fr.id = request_id
        and public.user_can_access_tool(fr.tool_id)
    )
  );

create policy "Insert own votes on accessible requests"
  on public.feature_request_votes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feature_requests fr
      where fr.id = request_id
        and public.user_can_access_tool(fr.tool_id)
    )
  );

create policy "Delete own votes"
  on public.feature_request_votes for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Read comments on accessible requests"
  on public.feature_request_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.feature_requests fr
      where fr.id = request_id
        and public.user_can_access_tool(fr.tool_id)
    )
  );

create policy "Insert comments on accessible requests"
  on public.feature_request_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feature_requests fr
      where fr.id = request_id
        and public.user_can_access_tool(fr.tool_id)
    )
  );
