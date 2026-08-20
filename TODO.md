# Todo — live task list

Check and update this every session. Delete finished items rather than
leaving them checked — git history is the permanent record, this file is
just "what's left."

- [ ] User: verify live on `run.snjv.club` — desktop sidebar rail
      navigation, `/run/?id=` single-run page, mobile tab bar + swipe
      decks. These shipped in the desktop-sidebar-nav round but were never
      confirmed working in production (same recurring limitation: no
      headless Google OAuth, so authenticated UI needs manual verification)
- [ ] User: verify GPS tracking tier A on a real phone (`/log/` → "Track a
      run"). Code is in and builds clean, but headless testing can't exercise
      real GPS drift or the permission prompt — check: Start actually asks
      for location, distance climbs sensibly while walking/driving, Pause/
      Resume doesn't add a big jump, Stop & review hands the number to the
      manual form correctly, and denying permission falls back to manual
      entry instead of dead-ending
