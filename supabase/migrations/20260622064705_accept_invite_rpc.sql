-- Pairing invite flow RPCs (Phase 5). Two SECURITY DEFINER functions wrap the
-- two sensitive operations so no client touches the trust anchor directly:
--   * create_invite(): the owner mints a single-use, expiring invite. The random
--     token is generated server-side, only its SHA-256 hash is stored, and the
--     plaintext is RETURNED ONCE to the caller to share out-of-band. The
--     plaintext is never persisted (spec: stored hashed, never plaintext).
--   * accept_invite(token): the follower submits the plaintext token. The
--     function hashes it, finds a matching unexpired/unused invite, and inserts
--     pairing(owner_id = invite.owner_id, follower_id = auth.uid(),
--     status = 'active') then marks the invite used -- atomically, server-side.
--
-- Why SECURITY DEFINER + locked search_path: pairing has NO client INSERT grant
-- or policy (the #30 migration), so the edge can be created only here. Running as
-- the function owner lets the insert bypass the (absent) client insert path while
-- the follower_id is still pinned to auth.uid(), closing the self-grant attack: a
-- caller cannot forge an edge for an owner they hold no valid token for, and
-- cannot set follower_id to anyone but themselves. search_path is pinned to
-- pg_catalog so the body cannot be hijacked by a caller-controlled search_path.
-- Hashing uses extensions.digest (pgcrypto); the hash is stored hex-encoded to
-- match the token_hash text column.

-- ----------------------------------------------------------------------------
-- create_invite: owner mints an invite. Returns the plaintext token (once) plus
-- its expiry. expires_in_hours defaults to 24h (spec decision).
-- ----------------------------------------------------------------------------
create function public.create_invite (expires_in_hours integer default 24) returns table (token text, expires_at timestamptz) language plpgsql security definer
set
  search_path = pg_catalog as $$
declare
  v_owner uuid := auth.uid();
  v_token text;
  v_hash text;
  v_expires timestamptz;
begin
  if v_owner is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if expires_in_hours is null or expires_in_hours <= 0 then
    raise exception 'expires_in_hours must be positive' using errcode = '22023';
  end if;

  -- 32 random bytes hex-encoded -> a high-entropy, copy-pasteable code.
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
  v_expires := now() + make_interval(hours => expires_in_hours);

  insert into public.invites (owner_id, token_hash, expires_at)
  values (v_owner, v_hash, v_expires);

  token := v_token;
  expires_at := v_expires;
  return next;
end;
$$;

revoke all on function public.create_invite (integer)
from
  public,
  anon;

grant
execute on function public.create_invite (integer) to authenticated;

-- ----------------------------------------------------------------------------
-- accept_invite: follower redeems a plaintext token. Validates (hash match,
-- unexpired, unused), inserts the active edge, marks the invite used. Returns the
-- new pairing id. Self-grant is impossible: follower_id is forced to auth.uid()
-- and owner_id is read from the invite row the caller must possess a token for.
-- ----------------------------------------------------------------------------
create function public.accept_invite (token text) returns uuid language plpgsql security definer
set
  search_path = pg_catalog as $$
declare
  v_follower uuid := auth.uid();
  v_hash text;
  v_invite public.invites%rowtype;
  v_pairing_id uuid;
begin
  if v_follower is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if token is null or length(token) = 0 then
    raise exception 'invalid invite token' using errcode = '22023';
  end if;

  v_hash := encode(extensions.digest(token, 'sha256'), 'hex');

  -- Lock the matching row so a concurrent accept of the same token cannot both
  -- pass the used/expiry checks.
  select * into v_invite
  from public.invites
  where token_hash = v_hash
  for update;

  if not found then
    raise exception 'invalid invite token' using errcode = '22023';
  end if;
  if v_invite.used_at is not null then
    raise exception 'invite already used' using errcode = '22023';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'invite expired' using errcode = '22023';
  end if;
  -- An owner cannot follow themselves (mirrors the pairing CHECK constraint).
  if v_invite.owner_id = v_follower then
    raise exception 'cannot pair with yourself' using errcode = '22023';
  end if;

  insert into public.pairing (owner_id, follower_id, status)
  values (v_invite.owner_id, v_follower, 'active')
  returning id into v_pairing_id;

  update public.invites
  set used_at = now()
  where id = v_invite.id;

  return v_pairing_id;
end;
$$;

revoke all on function public.accept_invite (text)
from
  public,
  anon;

grant
execute on function public.accept_invite (text) to authenticated;
