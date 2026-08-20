# Spec — what the app actually is (current state)

This is the **as-built** technical spec — the source of truth for what
exists today. Where it disagrees with `design/gorkhali-runners-pilot-design.md`
(the original pitch doc), this file wins: the design doc is the pitch,
not documentation, and has drifted (see KNOWLEDGE.md).

For *why* a decision was made and locked, see `CLAUDE.md` — this file says
what's true, `CLAUDE.md` says what's frozen and why.

## Product scope

Closed, invite-only running log for a friend group. Runners log runs
manually (no GPS), get matched with others who ran a similar distance
recently, and post shared availability so partners can plan to run together.

## Stack

| Layer    | Choice                                            |
| -------- | -------------------------------------------------- |
| Frontend | Astro 7 (static build) + React 19 islands (`client:only="react"`) |
| Hosting  | Cloudflare Workers assets (`wrangler.jsonc`, `assets.directory: "./dist"`) |
| Auth     | Supabase Auth (email + Google OAuth) |
| Database | Supabase Postgres, secured entirely by RLS (no backend server) |
| Styling  | Plain CSS (`src/styles/global.css`, single stylesheet, no Tailwind) |
| Fonts    | Neuton (serif, body text) |

## Routes

| Route         | Astro page              | Notes                                    |
| ------------- | ------------------------ | ----------------------------------------- |
| `/`           | `src/pages/index.astro`  | Dashboard                                 |
| `/log/`       | `src/pages/log.astro`    | Log a run (desktop rail destination)      |
| `/schedule/`  | `src/pages/schedule.astro` | Availability calendar (desktop rail)    |
| `/profile/`   | `src/pages/profile.astro`  | Profile/settings (desktop rail)         |
| `/run/?id=`   | `src/pages/run.astro`    | Single run detail, own runs only, read-only |
| `/posts/`     | `src/pages/posts.astro`  | Site-wide feed, card grid, one card/runner |

Mobile uses only `/` and switches tabs via local state (`Dashboard.tsx`);
desktop uses all four rail routes as real navigations. Full rationale for
this split is locked in `CLAUDE.md` — don't re-derive it here.

## Data model (as built — see `supabase/schema.sql` + migrations)

### `profiles`
`id` (= `auth.users.id`) · `display_name` (1–60 chars) · `created_at`

### `runs`
`id` · `user_id` → profiles · `distance_km` (numeric, 0–1000) ·
`run_date` (2020-01-01..tomorrow) · `notes` (≤300 chars, nullable) · `created_at`

### `invite_codes`
`code` (PK) · `active` · `max_uses` (nullable) · `uses` · `created_at`
No RLS policies at all — unreachable from the browser, only touched by the
`redeem_invite(invite_code, name)` security-definer function.

### `planned_runs` (the "Schedule Run" feature — not the same shape as the
design doc's `availability` table; see KNOWLEDGE.md)
`id` · `user_id` → profiles · `planned_date` ·
`time_of_day` (enum: morning/afternoon/evening) ·
`run_type` (enum: Base Run/Long Run/Intervals/Recovery) · `created_at`

Client-side only: capped at **10 active plans per user** (`ScheduleModal.tsx`,
`MAX_SCHEDULED_RUNS`) — not a DB constraint/trigger. Known trade-off, not
currently worth a migration for a friends-pilot scale.

## RLS summary

| Table          | Read                  | Write                          |
| -------------- | ---------------------- | ------------------------------- |
| `profiles`     | all authenticated       | own row only                    |
| `runs`         | all authenticated       | own rows only                   |
| `invite_codes` | nobody (browser)        | nobody (browser) — RPC only     |
| `planned_runs` | all authenticated (migration 004) | own rows only        |

`planned_runs` started own-read-only (`003_planned_runs.sql`) and was opened
to shared reads by `004_share_availability.sql` — "we want others to see the
availability at least."

## Deployment

- `npm run build` → `dist/` → `npx wrangler deploy`, or GitHub → Cloudflare
  auto-build on push to `main`.
- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` must be set as
  Cloudflare **Build variables** (baked in at build time), not just runtime
  Worker vars.
- `supabase/` is gitignored on purpose — migrations are `.sql` files run
  manually by the user in the Supabase SQL editor, reported back here.

## Desktop nav / view-transition architecture, single-run page, mobile
swipe-deck rules

All locked and detailed in `CLAUDE.md` — don't duplicate here, read that
file for the how/why.

## GPS run tracking (tier A — shipped, verified on a real phone)

`LogTab` now has a Manual / Track a run toggle. Tracking uses
`navigator.geolocation.watchPosition()` + Haversine distance (`src/lib/geo.ts`,
`src/lib/hooks/useGpsTracker.ts`) shown live in `TrackRunPanel.tsx`; "Stop &
review" hands the distance to the existing `LogRunForm` as a prefill — no new
table, no new column. `runs` is still exactly the manual-entry shape above;
duration is shown live during tracking but not persisted (no
`duration_seconds` column exists). See `PLAN.md` "Up next" for the B/C/D
upgrade path and `KNOWLEDGE.md` for the GPS gotchas (jitter filtering,
permission handling, secure-context requirement).
