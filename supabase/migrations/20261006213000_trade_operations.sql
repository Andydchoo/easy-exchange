-- Trade operations: SECURITY DEFINER functions enforcing authorization,
-- transition rules, and atomic acceptance. The trades table intentionally
-- has no general UPDATE policy; state transitions are only possible through
-- these functions, which authorize the caller via auth.uid().

create or replace function public.create_trade(
  p_offered_cd_id uuid,
  p_requested_cd_id uuid
)
returns public.trades
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_offered public.cds;
  v_requested public.cds;
  v_trade public.trades;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_offered_cd_id is null or p_requested_cd_id is null then
    raise exception 'offered_cd_id and requested_cd_id are required' using errcode = '22004';
  end if;

  if p_offered_cd_id = p_requested_cd_id then
    raise exception 'offered and requested CDs must differ' using errcode = '22023';
  end if;

  select * into v_offered from public.cds where id = p_offered_cd_id;
  if v_offered.id is null then
    raise exception 'offered CD not found' using errcode = 'P0002';
  end if;

  select * into v_requested from public.cds where id = p_requested_cd_id;
  if v_requested.id is null then
    raise exception 'requested CD not found' using errcode = 'P0002';
  end if;

  if v_offered.owner_id <> v_caller then
    raise exception 'offered CD does not belong to caller' using errcode = '42501';
  end if;

  if v_requested.owner_id = v_caller then
    raise exception 'cannot trade with yourself' using errcode = '42501';
  end if;

  if not v_offered.is_available then
    raise exception 'offered CD is not available' using errcode = '22023';
  end if;

  if not v_requested.is_available then
    raise exception 'requested CD is not available' using errcode = '22023';
  end if;

  insert into public.trades (requester_id, recipient_id, offered_cd_id, requested_cd_id)
  values (v_caller, v_requested.owner_id, p_offered_cd_id, p_requested_cd_id)
  returning * into v_trade;

  return v_trade;
end;
$$;


create or replace function public.accept_trade(p_trade_id uuid)
returns public.trades
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_trade public.trades;
  v_first_cd uuid;
  v_second_cd uuid;
  v_offered_available boolean;
  v_requested_available boolean;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_trade from public.trades where id = p_trade_id for update;
  if v_trade.id is null then
    raise exception 'trade not found' using errcode = 'P0002';
  end if;

  if v_trade.recipient_id <> v_caller then
    raise exception 'only the recipient may accept this trade' using errcode = '42501';
  end if;

  if v_trade.status <> 'PENDING' then
    raise exception 'trade is not pending' using errcode = '22023';
  end if;

  -- Lock both CD rows in a deterministic order to avoid deadlocks between
  -- concurrent acceptances that share a CD.
  if v_trade.offered_cd_id < v_trade.requested_cd_id then
    v_first_cd := v_trade.offered_cd_id;
    v_second_cd := v_trade.requested_cd_id;
  else
    v_first_cd := v_trade.requested_cd_id;
    v_second_cd := v_trade.offered_cd_id;
  end if;

  perform 1 from public.cds where id = v_first_cd for update;
  perform 1 from public.cds where id = v_second_cd for update;

  select is_available into v_offered_available from public.cds where id = v_trade.offered_cd_id;
  select is_available into v_requested_available from public.cds where id = v_trade.requested_cd_id;

  if not v_offered_available then
    raise exception 'offered CD is no longer available' using errcode = '22023';
  end if;

  if not v_requested_available then
    raise exception 'requested CD is no longer available' using errcode = '22023';
  end if;

  update public.trades
    set status = 'ACCEPTED'
    where id = v_trade.id
    returning * into v_trade;

  update public.cds
    set is_available = false
    where id in (v_trade.offered_cd_id, v_trade.requested_cd_id);

  update public.trades
    set status = 'CANCELLED'
    where status = 'PENDING'
      and id <> v_trade.id
      and (
        offered_cd_id in (v_trade.offered_cd_id, v_trade.requested_cd_id)
        or requested_cd_id in (v_trade.offered_cd_id, v_trade.requested_cd_id)
      );

  return v_trade;
end;
$$;


create or replace function public.decline_trade(p_trade_id uuid)
returns public.trades
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_trade public.trades;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_trade from public.trades where id = p_trade_id for update;
  if v_trade.id is null then
    raise exception 'trade not found' using errcode = 'P0002';
  end if;

  if v_trade.recipient_id <> v_caller then
    raise exception 'only the recipient may decline this trade' using errcode = '42501';
  end if;

  if v_trade.status <> 'PENDING' then
    raise exception 'trade is not pending' using errcode = '22023';
  end if;

  update public.trades
    set status = 'DECLINED'
    where id = v_trade.id
    returning * into v_trade;

  return v_trade;
end;
$$;


create or replace function public.cancel_trade(p_trade_id uuid)
returns public.trades
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_trade public.trades;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_trade from public.trades where id = p_trade_id for update;
  if v_trade.id is null then
    raise exception 'trade not found' using errcode = 'P0002';
  end if;

  if v_trade.requester_id <> v_caller then
    raise exception 'only the requester may cancel this trade' using errcode = '42501';
  end if;

  if v_trade.status <> 'PENDING' then
    raise exception 'trade is not pending' using errcode = '22023';
  end if;

  update public.trades
    set status = 'CANCELLED'
    where id = v_trade.id
    returning * into v_trade;

  return v_trade;
end;
$$;


create or replace function public.complete_trade(p_trade_id uuid)
returns public.trades
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_trade public.trades;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_trade from public.trades where id = p_trade_id for update;
  if v_trade.id is null then
    raise exception 'trade not found' using errcode = 'P0002';
  end if;

  if v_trade.requester_id <> v_caller and v_trade.recipient_id <> v_caller then
    raise exception 'only a participant may complete this trade' using errcode = '42501';
  end if;

  if v_trade.status <> 'ACCEPTED' then
    raise exception 'trade is not accepted' using errcode = '22023';
  end if;

  update public.trades
    set status = 'COMPLETED'
    where id = v_trade.id
    returning * into v_trade;

  return v_trade;
end;
$$;


-- Revoke the default PUBLIC EXECUTE grant and expose these functions only to
-- authenticated users. Anonymous callers cannot invoke them.
revoke execute on function public.create_trade(uuid, uuid) from public;
revoke execute on function public.accept_trade(uuid) from public;
revoke execute on function public.decline_trade(uuid) from public;
revoke execute on function public.cancel_trade(uuid) from public;
revoke execute on function public.complete_trade(uuid) from public;

revoke execute on function public.create_trade(uuid, uuid) from anon;
revoke execute on function public.accept_trade(uuid) from anon;
revoke execute on function public.decline_trade(uuid) from anon;
revoke execute on function public.cancel_trade(uuid) from anon;
revoke execute on function public.complete_trade(uuid) from anon;

grant execute on function public.create_trade(uuid, uuid) to authenticated;
grant execute on function public.accept_trade(uuid) to authenticated;
grant execute on function public.decline_trade(uuid) to authenticated;
grant execute on function public.cancel_trade(uuid) to authenticated;
grant execute on function public.complete_trade(uuid) to authenticated;
