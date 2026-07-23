# Handoff — run-app (stage 1: auth)

## What this is
Pilot web app "run" (run.snjv.club) — invite-only running community, distance matching,
health/mindfulness focus. Stack: **Astro + React islands**, **Supabase** (auth + Postgres),
deployed on **Cloudflare** (static assets) via git-push CI/CD. Repo: guru-ng/run-app.

## Already done
- Coming-soon page shipped, then replaced with the auth app.
- Cloudflare project `run-app`; custom domains `run.snjv.club` + `www.run.snjv.club` attached; CI/CD live.
- Supabase project: `https://zqvndrzmihxgvdhputkr.supabase.co`.
- `supabase/schema.sql` in repo: tables `profiles`, `runs`, `invite_codes`; RLS policies;
  `redeem_invite(invite_code, name)` security-definer function; seeded invite code `OSAKA2026`.
  (User should confirm this SQL ran with "Success" in the Supabase SQL editor.)
- Google OAuth: client created + app published; Supabase Google provider enabled with client
  id/secret; Auth URL config set (Site URL `https://run.snjv.club`, redirect URLs include
  `http://localhost:4321/**`). Callback: `https://zqvndrzmihxgvdhputkr.supabase.co/auth/v1/callback`.

## Stage 1 goal
Google login → invite gate (name + code) → "Welcome" dashboard placeholder.

## Key files
- `src/lib/supabase.ts` — client; now exports `configError` instead of throwing at import.
- `src/components/App.tsx` — auth flow (LoginScreen / InviteScreen / Dashboard) + ErrorBoundary.
- `src/pages/index.astro` — mounts `<App client:only="react" />` + global styles.
- `.env` — has `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (gitignored).

## RESOLVED (2026-07-23) — hydration bug
Root cause confirmed via Playwright console capture: `@astrojs/react@4.4.2` bundles its own
`vite@^6.4.1`, while `astro@7.1.3` uses `vite@^8.0.13` internally — two mismatched Vite copies.
Console showed: `SyntaxError: The requested module '/node_modules/react-dom/client.js' does not
provide an export named 'createRoot'` (Vite's CJS→ESM interop for react-dom broke under the
mismatched/duplicate Vite setup).

Fix: bumped `@astrojs/react` to `^6.0.1` (the version whose own `vite` dependency is `^8.0.13`,
matching astro 7.1.3) in `package.json`, then `npm install`.

**Gotcha:** Astro 7 dev server runs as a persistent background daemon (`astro dev status` /
`astro dev stop`) — killing the port listener does NOT stop it, so after any dependency change
run `npx astro dev stop` before `npm run dev` again, or you'll keep testing against the stale
process.

Verified with a headless Playwright check: button renders ("Continue with Google"), no console
errors, and clicking it correctly redirects to Google's real OAuth consent screen
(`accounts.google.com/...client_id=70887210227-...&redirect_uri=https://zqvndrzmihxgvdhputkr.supabase.co/auth/v1/callback`).
Button + OAuth wiring confirmed working end-to-end up to the Google consent screen.

## Next steps
1. Log in with a real Google account through the button → invite screen → name + `OSAKA2026` →
   should reach "Welcome, <name>." (Not yet tested — needs a real Google login + confirming
   `supabase/schema.sql` was actually run in the Supabase SQL editor.)
2. Commit the currently-untracked files (`src/components/App.tsx`, `src/lib/`, `supabase/`,
   `.env.example`, and the `package.json`/`package-lock.json` dependency bump) — nothing from
   this stage has been committed yet.

## After stage 1
Stage 2 = run logging (insert into `runs`) + distance-matching feed (query in schema.sql comments).
See `gorkhali-runners-pilot-design.md` (in the session outputs) for the full plan.
