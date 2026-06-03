-- Users can delete their own feature requests and comments

drop policy if exists "Delete own feature requests" on public.feature_requests;
drop policy if exists "Delete own comments" on public.feature_request_comments;

create policy "Delete own feature requests"
  on public.feature_requests for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Delete own comments"
  on public.feature_request_comments for delete
  to authenticated
  using (auth.uid() = user_id);

grant delete on table public.feature_requests to authenticated;
grant delete on table public.feature_request_comments to authenticated;
