create table if not exists public.mobile_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique check (char_length(token) between 20 and 200 and token like 'ExponentPushToken[%]'),
  platform text not null check (platform in ('ios','android')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists mobile_push_tokens_user_idx on public.mobile_push_tokens(user_id);
grant select, insert, delete on public.mobile_push_tokens to authenticated;
grant all on public.mobile_push_tokens to service_role;
alter table public.mobile_push_tokens enable row level security;
drop policy if exists "own tokens select" on public.mobile_push_tokens;
create policy "own tokens select" on public.mobile_push_tokens for select to authenticated using (user_id = auth.uid());
drop policy if exists "own tokens insert" on public.mobile_push_tokens;
create policy "own tokens insert" on public.mobile_push_tokens for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "own tokens delete" on public.mobile_push_tokens;
create policy "own tokens delete" on public.mobile_push_tokens for delete to authenticated using (user_id = auth.uid());

-- Moves a device token to the current user (device changed accounts) atomically.
create or replace function public.register_mobile_push_token(_token text, _platform text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.mobile_push_tokens(user_id, token, platform)
  values (auth.uid(), _token, _platform)
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, created_at = now();
end $$;
revoke all on function public.register_mobile_push_token(text, text) from public, anon;
grant execute on function public.register_mobile_push_token(text, text) to authenticated;