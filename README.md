# run

A quiet running community — log runs, match distances, run together.
For health and mindfulness, not competition.

Pilot lives at **run.snjv.club** (invite-only). Public brand name TBD.

## Stack

- [Astro](https://astro.build) + React islands
- Deployed on Cloudflare (static assets) via `git push` CI/CD
- Supabase (auth + Postgres) — added in a later phase

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

## Deploy

Every push to `main` triggers a Cloudflare build that publishes `dist/`.
