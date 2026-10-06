-- Initial Easy Exchange schema: enums, tables, constraints, RLS, and auth profile bootstrap.

create type public.cd_condition as enum ('MINT', 'VERY_GOOD', 'GOOD', 'FAIR');
create type public.trade_status as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.cds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  musicbrainz_release_group_id uuid not null,
  artist text not null,
  album_title text not null,
  genre text not null,
  condition public.cd_condition not null,
  description text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id),
  recipient_id uuid not null references public.profiles (id),
  offered_cd_id uuid not null references public.cds (id),
  requested_cd_id uuid not null references public.cds (id),
  status public.trade_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trades_requester_recipient_distinct check (requester_id <> recipient_id),
  constraint trades_offered_requested_cd_distinct check (offered_cd_id <> requested_cd_id)
);

create index cds_owner_id_idx on public.cds (owner_id);
create index cds_is_available_idx on public.cds (is_available);
create index cds_artist_idx on public.cds (artist);
create index cds_album_title_idx on public.cds (album_title);
create index trades_requester_id_idx on public.trades (requester_id);
create index trades_recipient_id_idx on public.trades (recipient_id);
create index trades_status_idx on public.trades (status);
create index trades_offered_cd_id_idx on public.trades (offered_cd_id);
create index trades_requested_cd_id_idx on public.trades (requested_cd_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cds_set_updated_at
  before update on public.cds
  for each row
  execute function public.set_updated_at();

create trigger trades_set_updated_at
  before update on public.trades
  for each row
  execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.cds enable row level security;
alter table public.trades enable row level security;

create policy "profiles_select_public"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "cds_select_public"
  on public.cds
  for select
  to anon, authenticated
  using (true);

create policy "cds_insert_own"
  on public.cds
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "cds_update_own"
  on public.cds
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "cds_delete_own"
  on public.cds
  for delete
  to authenticated
  using (owner_id = auth.uid());

create policy "trades_select_participant"
  on public.trades
  for select
  to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

create policy "trades_insert_as_requester"
  on public.trades
  for insert
  to authenticated
  with check (requester_id = auth.uid());

grant select on table public.profiles to anon, authenticated;
grant update on table public.profiles to authenticated;

grant select on table public.cds to anon, authenticated;
grant insert, update, delete on table public.cds to authenticated;

grant select, insert on table public.trades to authenticated;
