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
  pending real-phone verification (see TODO.md)

## Now

Nothing in progress. Working tree is clean; `main` is up to date with
`origin/main` (PR #2 merged).

## Up next: GPS run tracking (decided 2026-08-19)

Four difficulty tiers were proposed; tier A is done, **starting with the
least difficult** and built as an *additional* entry point next to manual
logging (not a replacement — GPS isn't always available, indoor/poor-signal
runs still need manual entry). B/C/D remain future, separate decisions:

- **A — GPS stopwatch, no map. Shipped, pending phone verification.**
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
