# Knowledge — operational gotchas and non-obvious facts

Things that aren't decisions (that's `CLAUDE.md`) and aren't spec (that's
`SPEC.md`) — just facts that cost time to (re)discover once and shouldn't
cost time again.

## Astro dev server

Astro 7's dev server is a **persistent background daemon**. Killing the
port listener does not stop it. After any dependency or config change:
`npx astro dev stop` before relaunching `npm run dev`, or you'll test
against a stale process.

## The hydration bug (already fixed, don't reintroduce)

`@astrojs/react@4.2.0` bundles a Vite version that mismatches Astro 7's own
Vite 8 → `SyntaxError: ... react-dom/client.js does not provide an export
named 'createRoot'`, and every `client:only="react"` island silently fails
to hydrate (page looks static/empty where a component should render).
Fixed by pinning `@astrojs/react` to `^6.0.1`+. Keep it there.

## Cloudflare env vars

`PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` must be set under
Cloudflare's **Build variables and secrets**, not just runtime Worker
variables — Astro bakes `PUBLIC_*` vars in at *build* time, so a
runtime-only var never reaches the client bundle.

## Supabase OAuth redirect

If Google login lands on `http://localhost:3000/#access_token=...` instead
of the real site, it's Supabase's default **Site URL** (often pre-filled to
`localhost:3000`) not having been updated — it's the fallback used when the
actual `redirectTo` isn't in the allowed list. Fix in Supabase dashboard →
Authentication → URL Configuration: Site URL → `https://run.snjv.club`;
Redirect URLs → add `https://run.snjv.club/**` and `http://localhost:4321/**`.

## `supabase/` is gitignored on purpose

Migrations live as `.sql` files there but are **not** committed. The
workflow is: write the migration file, tell the user exactly what to run,
they paste it into the Supabase SQL editor and report back
success/failure. There is no automated migration runner in this project —
don't assume one and don't try to apply SQL directly.

## I can't complete real Google OAuth headlessly

Every authenticated-flow UI check (dashboard, calendar tooltip, modal
buttons, posts grid, theme toggle *inside* the signed-in app) needs the
user to verify manually. Playwright in this project is only used for what
doesn't require a real session: build output, console errors, unauthenticated
redirects (e.g. `/posts` → `/` when signed out), and the login screen itself.
Don't claim to have verified authenticated UI — say plainly that it wasn't
checked and needs the user to look.

## Design doc has drifted from the real schema

`design/gorkhali-runners-pilot-design.md` is the original pitch, not living
documentation. Known divergence: it describes an `availability` table
(`plan_date`, `time_block`/`after_time`, `status`: free/undecided/cancelled).
That was never built. What actually shipped is `planned_runs`
(`planned_date`, `time_of_day` enum, `run_type` enum, no cancelled-status —
cancellation is a hard delete). Trust `SPEC.md` and `supabase/*.sql` over
the design doc for anything schema-shaped.

## GPS tracking (tier A) — things to know before building it

- `navigator.geolocation` requires a **secure context**: HTTPS or
  `localhost`. Works fine on `run.snjv.club` and on the Astro dev server,
  would silently fail over plain HTTP on a LAN IP (e.g. testing from a
  phone against your machine's local IP instead of `localhost`).
- Raw GPS fixes drift even standing still — summing Haversine distance
  between *every* fix without a minimum-movement filter will overcount.
  Needs a small threshold (discard fixes closer than ~5-10m from the last
  accepted one) before accumulating.
- `watchPosition` drains battery noticeably faster than normal browsing —
  worth surfacing that expectation somewhere in the UI, not a bug to fix.
- iOS Safari and Android Chrome both prompt for location permission on
  first use and behave slightly differently on denial — the app must
  handle a denied/unavailable permission by degrading to "use manual entry"
  rather than a dead-end error.
- v1 (tier A) does not persist `duration_seconds` — the `runs` table has no
  such column, and adding one is a migration decision, not a given. Track
  duration live in the UI only until/unless persisting it is explicitly
  decided.
- Can't be verified by me end-to-end: headless Playwright can override
  `navigator.geolocation` with fixed/scripted coordinates, but that doesn't
  exercise real-world drift, permission prompts, or on-device battery/GPS
  behavior. This one leans on the user testing on an actual phone more than
  most past features.

## A second Claude Code session edits this repo independently

At least one other session (likely the IDE extension) has made unprompted
changes in this repo before (e.g. `maxLength` additions, a Prettier
reformat, a `.gitignore` addition). Don't reflexively revert unfamiliar
diffs found at the start of a session — check whether they look intentional
first, and only flag/ask if something looks wrong.
