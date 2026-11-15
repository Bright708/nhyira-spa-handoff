-- Nhyira Spa: treatment-length-aware booking with room capacity.
-- Replaces "one booking per start time" with "at most N overlapping bookings".
-- Safe to run more than once (npm run migrate runs every file in order).

-- 1. Bookings get an end time ------------------------------------------------
alter table public.bookings add column if not exists end_at timestamptz;

update public.bookings b
   set end_at = b.start_at + make_interval(mins => t.duration_min)
  from public.treatments t
 where t.id = b.treatment_id
   and b.end_at is null;

alter table public.bookings alter column end_at set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_end_after_start') then
    alter table public.bookings add constraint bookings_end_after_start check (end_at > start_at);
  end if;
end $$;

-- 2. Old one-per-start-time rules can't express capacity or overlap ----------
drop index if exists public.bookings_one_paid_per_slot;
drop index if exists public.bookings_one_active_per_slot;

create index if not exists bookings_active_range_idx
  on public.bookings (start_at, end_at)
  where status in ('pending', 'paid');

-- 3. Peak concurrency -------------------------------------------------------
-- Most paid + live pending bookings running at the same moment inside
-- [p_start, p_end). Two bookings that overlap the window but not each other
-- need only one room, so this is what gets compared with the room count.
-- Concurrency only rises at a start time, so checking p_start and each
-- booking start inside the window is enough.
create or replace function public.peak_overlap(
  p_start        timestamptz,
  p_end          timestamptz,
  p_exclude      uuid,
  p_hold_minutes int
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with active as (
    select start_at, end_at
      from public.bookings
     where start_at < p_end
       and end_at   > p_start
       and (p_exclude is null or id <> p_exclude)
       and (status = 'paid'
            or (status = 'pending' and created_at > now() - make_interval(mins => p_hold_minutes)))
  ),
  points as (
    select p_start as t
    union
    select start_at from active where start_at > p_start
  )
  select coalesce(max((select count(*) from active a where a.start_at <= p.t and a.end_at > p.t)), 0)::int
    from points p;
$$;

-- 4. Place a hold atomically ------------------------------------------------
-- Locks the day, cancels the same customer's earlier hold on this start time
-- (they reopened the popup), checks peak room use over the treatment,
-- and inserts only if a room is free throughout. Raises SLOT_TAKEN otherwise.
create or replace function public.hold_slot(
  p_treatment_id text,
  p_start        timestamptz,
  p_end          timestamptz,
  p_name         text,
  p_whatsapp     text,
  p_email        text,
  p_total        int,
  p_deposit      int,
  p_reference    text,
  p_rooms        int,
  p_hold_minutes int
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_taken int;
  v_row   public.bookings;
begin
  perform pg_advisory_xact_lock(hashtext('nhyira-day:' || (p_start at time zone 'UTC')::date::text));

  update public.bookings
     set status = 'cancelled'
   where status = 'pending'
     and email = p_email
     and start_at = p_start;

  v_taken := public.peak_overlap(p_start, p_end, null, p_hold_minutes);

  if v_taken >= p_rooms then
    raise exception 'SLOT_TAKEN';
  end if;

  insert into public.bookings
    (treatment_id, start_at, end_at, customer_name, whatsapp, email, total_ghs, deposit_ghs, paystack_reference, status)
  values
    (p_treatment_id, p_start, p_end, p_name, p_whatsapp, p_email, p_total, p_deposit, p_reference, 'pending')
  returning * into v_row;

  return v_row;
end;
$$;

-- 5. Mark paid atomically ----------------------------------------------------
-- A live hold already reserved its room, so it always succeeds. A hold that
-- expired (or was cancelled) is revived only if a room is still free.
-- Returns: paid | already_paid | slot_conflict | not_found
create or replace function public.mark_booking_paid(
  p_reference    text,
  p_paid_at      timestamptz,
  p_rooms        int,
  p_hold_minutes int
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b     public.bookings;
  v_taken int;
begin
  select * into v_b from public.bookings where paystack_reference = p_reference;
  if not found then
    return 'not_found';
  end if;

  perform pg_advisory_xact_lock(hashtext('nhyira-day:' || (v_b.start_at at time zone 'UTC')::date::text));
  select * into v_b from public.bookings where paystack_reference = p_reference for update;

  if v_b.status = 'paid' then
    return 'already_paid';
  end if;

  if not (v_b.status = 'pending' and v_b.created_at > now() - make_interval(mins => p_hold_minutes)) then
    v_taken := public.peak_overlap(v_b.start_at, v_b.end_at, v_b.id, p_hold_minutes);
    if v_taken >= p_rooms then
      return 'slot_conflict';
    end if;
  end if;

  update public.bookings
     set status = 'paid', paid_at = coalesce(p_paid_at, now())
   where id = v_b.id;
  return 'paid';
end;
$$;

revoke all on function public.peak_overlap(timestamptz, timestamptz, uuid, int) from public, anon, authenticated;
grant execute on function public.peak_overlap(timestamptz, timestamptz, uuid, int) to service_role;
revoke all on function public.hold_slot(text, timestamptz, timestamptz, text, text, text, int, int, text, int, int) from public, anon, authenticated;
revoke all on function public.mark_booking_paid(text, timestamptz, int, int) from public, anon, authenticated;
grant execute on function public.hold_slot(text, timestamptz, timestamptz, text, text, text, int, int, text, int, int) to service_role;
grant execute on function public.mark_booking_paid(text, timestamptz, int, int) to service_role;

notify pgrst, 'reload schema';
