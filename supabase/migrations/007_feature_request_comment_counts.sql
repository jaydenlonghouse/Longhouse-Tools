-- Include comment counts in feature request list RPC

create or replace function public.get_feature_requests(p_tool_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  created_at timestamptz,
  vote_count bigint,
  comment_count bigint,
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
    (
      select count(*)::bigint
      from public.feature_request_comments c
      where c.request_id = fr.id
    ) as comment_count,
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
