# Todo — live task list

Check and update this every session. Delete finished items rather than
leaving them checked — git history is the permanent record, this file is
just "what's left."

- [ ] User: verify gamification #1+#2+#3 live — log a run and confirm the
      pixel firework burst + personal-best banner show up, and that the
      streak badge above the mode toggle reads correctly (can't be checked
      headlessly, same recurring limitation as any authenticated UI)
- [ ] User: run `supabase/005_badges.sql` in the Supabase SQL editor
      (creates `badges_earned` + RLS) — until this is applied, badges just
      won't persist or show on the Profile shelf (the fetch error is caught
      and logged to the console, not shown as a page-blocking error banner)
- [ ] User: after running the migration, verify gamification #4 live — log
      a run that crosses a badge (first run is the easy one to check) and
      confirm the celebration shows it, then check the Profile tab's Badges
      shelf reflects it too
