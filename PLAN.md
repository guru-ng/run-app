# Plan — roadmap

Forward-looking. "What's shipped" is a condensed pointer to git history, not
a duplicate changelog — `git log --oneline` is the real record. This file
exists to answer "what's next" without re-deriving it from conversation
memory each session.

## Shipped (condensed — see git log for full detail)

- Google + email login, invite-code-gated onboarding
- Manual run logging + distance-based matching feed
- Neuton font, plain-CSS "original" look (Tailwind redesign tried once,
  explicitly rejected, fully reverted)
- Shared availability calendar (`planned_runs`): post/edit/cancel a slot,
  hover tooltip shows everyone scheduled that day, opened to shared reads
- Site-wide latest-logs feed card → `/posts` page (card grid, one card/runner)
- Site-wide dark/light theme toggle
- Mobile tab-bar nav + swipe-to-dismiss card decks (Dashboard/Log/Schedule/Profile)
- Desktop sidebar rail + real routes for the same four destinations, wired
  through Astro's view-transition router so rail clicks don't reload the page
- Single-run detail page (`/run/?id=`), own runs only, read-only
- Schedule modal: Save/Cancel buttons, selectable popup text, 10-plan cap
- GPS run tracking tier A: "Track a run" stopwatch mode in the Log tab
  (`watchPosition` + Haversine, no map, no schema change) — merged via PR #2,
  confirmed tracking correctly on a real phone (2026-08-20)
- Gamification #1+#2: post-log pixel-art firework burst (seasonal palette,
  reskinned from an earlier confetti version same-day) + personal-best
  callouts (first run / new longest / Nth-run-this-week), pure CSS +
  client-computed, no schema change (2026-08-20)
- Gamification #3: forgiving logging streak badge on the Log tab — one
  skipped day forgiven per streak, computed from `runs`, no schema change
  (2026-08-20)

## Now

Nothing in progress. Working tree is clean, `main` is up to date with
`origin/main`.

## Up next: Gamification (decided 2026-08-20)

Ten options were laid out, ordered free → expensive (cost = ongoing
maintenance/infra burden, not just build time). **Starting with #1+#2**
since they're the highest ROI for zero schema change: right now
`LogRunForm.tsx`'s success path is silent, which is the #1 reason logging a
run doesn't feel rewarding. Explicit design note carried over from the
decision conversation: **don't ship more than one or two of these at once**
— stacking badges/streaks/leaderboards together dilutes all of them; each
is its own explicit decision, same rule as the GPS tiers below.

- **#1 — Post-log dopamine moment. Shipped, reskinned as pixel-art
  fireworks.** A firework burst right after a successful `insertRun()`.
  Pure CSS, no new dependency (radial burst faked by rotating each piece
  then translating along that axis — no JS math; sharp corners + a
  burst-then-fall arc + `steps()` timing for a blocky/8-bit feel instead of
  confetti's smooth rounded drift). Colors cycle through a palette picked by
  the current meteorological season (`src/lib/season.ts`) so "for this
  season" rotates automatically instead of being hardcoded to one month.
  Lives in `LogRunForm.tsx` + `global.css`.
- **#2 — Personal-best callouts. Shipped.** "Longest run yet" / "3rd run this
  week" / "first run ever" banner, computed client-side from the `runs` the
  user already has — no schema change. Surfaced at the moment of logging,
  not buried on a stats page. `src/lib/personalBests.ts`.
- **#3 — Streaks with forgiveness. Shipped.** One skipped day forgiven per
  streak (not per week — simpler to reason about and explain in the UI) —
  computed off `run_date` gaps, no new table. The gap between *today* and
  the most recent log doesn't consume the grace token (not having logged
  yet today/since yesterday is normal mid-streak state, not a skip) —
  deliberately generous over strict for a friend-group app. Shown as a
  badge above the Log tab's mode toggle. `src/lib/streaks.ts`.
- **#4 — Achievement badges.** Distance/consistency milestones, persisted in
  a new `badges_earned` table so a badge doesn't un-earn itself later.
  Pace them — unlocking a dozen in week one makes badge #13 meaningless. Not
  started.
- **#5 — Kudos/reactions on `/posts`.** A single 🔥 reaction (not full
  comments — no moderation surface needed for a friend group). New
  `run_reactions` table + RLS. Not started.
- **#6 — Weekly leaderboard.** Group-wide weekly distance, same query shape
  as `fetchMatches`, no new table. Must ship at least two categories (e.g.
  distance AND consistency) or make it opt-in — a single raw-distance
  ranking quietly shames the slowest runner every week in a group where
  everyone knows each other. Not started.
- **#7 — Weekly quests.** Hardcoded in a TS array first ("log 3 runs this
  week") — no database-driven quest authoring until rotating them by hand
  becomes actual friction. Not started.
- **#8 — Route photo per run.** First genuinely "expensive" tier: Supabase
  Storage bucket + RLS + client-side image compression before upload (skip
  the compression step and one uncompressed iPhone photo blows the feed
  load time and the storage bill). Not started.
- **#9 — Push notifications.** Needs a Supabase Edge Function + cron + Web
  Push subscriptions — this app is deliberately backend-less (RLS-only)
  today, so this is new always-on infra that can silently fail. Ship a kill
  switch and frequency cap from day one. Not started.
- **#10 — Seasonal events.** Themed monthly challenges/badges. The real cost
  isn't the ~1 day of dev, it's inventing a new theme every month forever
  afterward. Not started.

Each item is its own explicit decision — shipping #1+#2 doesn't commit to
#3-10. Update this section (and TODO.md) as more get built.

## Up next: GPS run tracking (decided 2026-08-19)

Four difficulty tiers were proposed; tier A is done, **starting with the
least difficult** and built as an *additional* entry point next to manual
logging (not a replacement — GPS isn't always available, indoor/poor-signal
runs still need manual entry). B/C/D remain future, separate decisions:

- **A — GPS stopwatch, no map. Shipped and verified on a real phone.**
  Browser `navigator.geolocation.watchPosition()` accumulates distance via
  the Haversine formula between fixes, a timer runs alongside it. Stop →
  prefills the existing log-run form with the tracked distance for review
  before save. No map, no stored route, no new dependency, no schema change
  (duration is shown live but not persisted in v1 — see KNOWLEDGE.md). Lives
  in `src/lib/geo.ts`, `src/lib/hooks/useGpsTracker.ts`,
  `src/components/runs/TrackRunPanel.tsx`, wired into `LogTab.tsx`'s new
  Manual/Track a run toggle.
- **B — same, + a simple line.** Adds a live path drawn on a bare
  canvas/SVG (relative coordinates, no map tiles). Still no external
  dependency. Not started; a later upgrade from A if wanted.
- **C — real map tracking.** Same GPS core as A, rendered on an actual map
  (Leaflet + OpenStreetMap tiles). New library dependency, more battery/data
  use. Not started; upgrade from B.
- **D — Strava import.** Skips building GPS entirely; pulls activities from
  users' Strava accounts instead. Needs a backend piece this app doesn't
  have yet (OAuth client secret → a Supabase Edge Function) and a Strava
  account per runner. Independent alternative, not a strict upgrade from
  A/B/C.

Each tier is its own explicit decision to move forward — shipping A doesn't
commit to B/C/D. Update this section (and TODO.md) as A gets built.

## Backlog / candidate next steps (not started, not committed to)

- Server-side enforcement of the 10-scheduled-runs cap (currently
  client-side only in `ScheduleModal.tsx`).
- Standalone launch path (own domain, drop invite gate) — described in
  design doc §10, triggered by pilot validating, not a near-term item.
