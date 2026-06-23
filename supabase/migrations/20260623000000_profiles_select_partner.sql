-- ADDITIVE SELECT policy on public.profiles (issue #112).
--
-- A user may read the profile row of their ACTIVE paired partner. Name is
-- identity, not health data; both parties consented by completing the pairing
-- flow. The existing `profiles_select_own` policy is untouched -- this is a
-- second, independent SELECT policy that Postgres evaluates as OR.
--
-- Covers BOTH edge directions:
--   * owner_id = auth.uid() AND id = follower_id  (the owner reads their Mate)
--   * follower_id = auth.uid() AND id = owner_id  (the Mate reads their owner)
--
-- Only ACTIVE edges grant access; a `revoked` edge stops matching immediately,
-- mirroring the shared_state cut-off on revoke. No write path is added.
-- Only profiles.id and profiles.display_name are relevant; no raw health data
-- lives on the profiles table (it has no health columns).

create policy "profiles_select_active_partner"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.pairing p
      where p.status = 'active'
        and (
          (p.owner_id = auth.uid() and p.follower_id = profiles.id)
          or
          (p.follower_id = auth.uid() and p.owner_id = profiles.id)
        )
    )
  );
