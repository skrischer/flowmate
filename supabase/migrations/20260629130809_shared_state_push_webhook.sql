-- DB webhook: shared_state phase change -> push-dispatcher Edge Function (issue #251).
--
-- The missing DB-side half of the Mate-push path (spec-mate-push.md). When the
-- owner's derived `current_phase` transitions, this trigger POSTs a discreet
-- webhook to the push-dispatcher function over the instance-internal Kong route.
-- The function (verify_jwt off) authenticates the call by a shared secret it
-- also holds as PUSH_WEBHOOK_SECRET; here that secret is read from Vault, never
-- hard-coded, so no secret value lives in this committed migration.
--
-- Constitution: the webhook body carries ONLY owner_id + current_phase (the two
-- fields SharedStateRecord declares) -- never next_period_date or any raw date,
-- so no raw health data crosses the wire or lands in pg_net's request log.
--
-- Fires ONLY on a real current_phase transition (WHEN ... IS DISTINCT FROM); the
-- dispatcher re-checks old vs new as the authoritative spam guard.
--
-- Safe on an unconfigured stack: if the Vault secret is absent (e.g. a local
-- `supabase start` with no seed) the function no-ops and returns NEW, so
-- shared_state writes never fail for want of push wiring. The dispatcher URL
-- defaults to the internal gateway and is overridable via the Vault secret
-- `push_dispatcher_url`.

create or replace function public.notify_shared_state_phase_change()
  returns trigger
  language plpgsql
  security definer
  set search_path = pg_catalog
as $$
declare
  v_secret text;
  v_url text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'push_webhook_secret';

  -- Unconfigured stack: no secret -> no dispatch, the write proceeds normally.
  if v_secret is null then
    return new;
  end if;

  v_url := coalesce(
    (select decrypted_secret from vault.decrypted_secrets where name = 'push_dispatcher_url'),
    'http://kong:8000/functions/v1/push-dispatcher'
  );

  -- The push webhook must never break the Flower's core logging: a pg_net
  -- failure is downgraded to a warning so the shared_state write still commits.
  begin
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'owner_id', new.owner_id,
          'current_phase', new.current_phase
        ),
        'old_record', jsonb_build_object(
          'owner_id', old.owner_id,
          'current_phase', old.current_phase
        )
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_secret
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    raise warning 'push-dispatcher webhook enqueue failed (owner_id=%): %', new.owner_id, sqlerrm;
  end;

  return new;
end;
$$;

create trigger shared_state_phase_change_webhook
  after update on public.shared_state
  for each row
  when (old.current_phase is distinct from new.current_phase)
  execute function public.notify_shared_state_phase_change();
