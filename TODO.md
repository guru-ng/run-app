# Todo — live task list

Check and update this every session. Delete finished items rather than
leaving them checked — git history is the permanent record, this file is
just "what's left."

- [ ] Fast-forward local `main` to `origin/main` (PR #1 merged there via
      GitHub on 2026-07-31; local `main` is still 8 commits behind)
- [ ] User: verify live on `run.snjv.club` — desktop sidebar rail
      navigation, `/run/?id=` single-run page, mobile tab bar + swipe
      decks. These shipped in the desktop-sidebar-nav round but were never
      confirmed working in production (same recurring limitation: no
      headless Google OAuth, so authenticated UI needs manual verification)
- [ ] Build GPS tracking tier A (see PLAN.md "Up next"): a "Track a run"
      entry point beside "Log a run" that uses `watchPosition` + Haversine
      to live-accumulate distance/duration, then hands the distance off to
      the existing log-run form for review/save
      - [ ] Handle permission-denied / no-GPS gracefully — fall back to
            pointing the user at manual entry, don't dead-end
      - [ ] Filter GPS jitter (ignore fixes closer together than a small
            threshold, e.g. ~5-10m) so standing still doesn't add fake distance
      - [ ] Needs a real phone to verify — headless/emulated geolocation
            can fake coordinates but not realistic movement drift, so this
            round's testing will be more manual-verification-dependent than usual
