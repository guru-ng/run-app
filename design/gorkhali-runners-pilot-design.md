# Running App — Pilot Design

A closed, invite-only web app where runners log runs and get **matched by distance**.
Focus is health, mindfulness, and community — not competition.
Built to run entirely on free tiers, deployed on the same Cloudflare pipeline as your portfolio.

**Pilot URL:** `run.snjv.club` (generic subdomain — keeps the future brand name private).
**Public brand name:** TBD (front-runner: _Takt_), decided at the standalone launch.

---

## 1. Scope of the pilot

**The one hypothesis we're testing:** do runners enjoy matching / comparing run distances with each other?

Deliberately in:

- Web app, responsive (works on any phone browser, no install)
- Login required (Supabase Auth: email + Google)
- Invite-code gated (closed to your runner friends)
- **Manual run entry** (type distance + date)
- **Distance matching** as the core screen
- **Shared scheduling calendar** — partners post when they're free to run together (see §7)

Deliberately out (for now):

- GPS / live tracking (Strava API is the planned fast-follow)
- Native iOS/Android app
- Public open registration
- Challenges, chat, social graph

---

## 2. Architecture (why it costs ~$0)

```
  Runner's phone browser
          │
          ▼
  run.snjv.club                 ← Astro static site on Cloudflare (free)
  (HTML/CSS/JS, no server)
          │  supabase-js in the browser
          ▼
  Supabase (free tier)          ← your entire backend
   ├── Auth        (login, sessions)
   ├── Postgres    (profiles, runs, invite_codes)
   └── RLS         (security rules on the data)
```

Key idea: **there is no server to run.** The Astro site is just static files on
Cloudflare's edge. All the "backend" work — login, saving runs, matching queries —
is done by the Supabase JavaScript SDK talking directly to Supabase from the browser.
Security comes from **Row Level Security (RLS)** rules in the database, not from a
server you maintain.

This is why it's free and why it deploys on the exact same `git push` pipeline you
already set up for the portfolio.

### Stack

| Layer    | Choice                            | Cost                     |
| -------- | --------------------------------- | ------------------------ |
| Frontend | Astro (+ a little client-side JS) | Free                     |
| Hosting  | Cloudflare (same as portfolio)    | Free                     |
| Domain   | `run.snjv.club` subdomain         | Free (you own snjv.club) |
| Auth     | Supabase Auth                     | Free                     |
| Database | Supabase Postgres                 | Free (50k MAU, 500 MB)   |
| CI/CD    | GitHub → Cloudflare auto-build    | Free                     |

---

## 3. Data model

Three tables. Matching is a **query**, not a stored table — keeps it simple.

### `profiles`

Extends Supabase's built-in `auth.users`. One row per user.

| column       | type        | notes                          |
| ------------ | ----------- | ------------------------------ |
| id           | uuid (PK)   | = auth.users.id                |
| display_name | text        | shown on leaderboard / matches |
| created_at   | timestamptz | default now()                  |

### `runs`

One row per logged run.

| column      | type                    | notes                     |
| ----------- | ----------------------- | ------------------------- |
| id          | uuid (PK)               | default gen_random_uuid() |
| user_id     | uuid (FK → profiles.id) | who ran                   |
| distance_km | numeric                 | the number we match on    |
| run_date    | date                    | when                      |
| notes       | text (nullable)         | optional ("morning 10k")  |
| created_at  | timestamptz             | default now()             |

### `invite_codes`

Controls who can register.

| column     | type           | notes                          |
| ---------- | -------------- | ------------------------------ |
| code       | text (PK)      | the secret string you hand out |
| active     | boolean        | flip off to disable a code     |
| max_uses   | int (nullable) | optional cap                   |
| uses       | int            | incremented on each signup     |
| created_at | timestamptz    | default now()                  |

### `availability`

Shared scheduling calendar — one row per person per planned slot. This is
separate from `runs`: `runs` records what already happened, `availability`
is what's being planned.

| column     | type                    | notes                                                          |
| ---------- | ----------------------- | -------------------------------------------------------------- |
| id         | uuid (PK)               | default gen_random_uuid()                                      |
| user_id    | uuid (FK → profiles.id) | whose slot this is                                             |
| plan_date  | date                    | the day                                                        |
| time_block | text (nullable)         | `'morning'` or `'evening'` — a loose part of day               |
| after_time | time (nullable)         | e.g. "free after 18:00" — an exact cutoff instead of a block   |
| status     | text                    | `'free'` \| `'undecided'` \| `'cancelled'` (see §7 for colors) |
| notes      | text (nullable)         | optional ("easy 5k, riverside route")                          |
| created_at | timestamptz             | default now()                                                  |
| updated_at | timestamptz             | default now(), bumped on edit                                  |

`time_block` and `after_time` are both nullable but mutually exclusive in
practice — the UI offers one or the other, never both, per slot. A `check`
constraint can enforce "at least one of the two is set" if you want to be strict.

---

## 4. Security — Row Level Security (RLS)

RLS = per-row rules the database enforces no matter who's asking. This is what makes
a browser-only app safe. Rules for the pilot:

- **runs**: anyone logged in can **read all** runs (needed to match/compare).
  Users can **insert/update/delete only their own** (`user_id = auth.uid()`).
- **profiles**: readable by all logged-in users; editable only by the owner.
- **invite_codes**: not readable or writable from the browser at all — only checked
  server-side during signup (see below).
- **availability**: same shape as `runs` — anyone logged in can **read all** slots
  (that's the point, it's a _shared_ calendar), but you can only **insert/update/
  delete your own** slots (`user_id = auth.uid()`). This is what lets you edit or
  cancel your own entries while seeing everyone else's.

---

## 5. Invite-code flow

Signup page asks for: email/Google + an **invite code**.

**Simple version (fine for a friends pilot):** a Supabase RPC/edge function
`redeem_invite(code)` runs server-side, checks the code is `active` and under
`max_uses`, increments `uses`, and only then allows the profile to be created.
Because it runs on Supabase's side, the valid codes are never exposed to the browser.

You hand one code (e.g. `GORKHALI2026`) to your running group's chat. Flip `active`
to false when the pilot ends. To open registration publicly later, just remove the
code check.

---

## 6. The core screen — distance matching

1. Runner logs a run: distance + date. → insert into `runs`.
2. App shows a **feed / leaderboard** of everyone's runs.
3. Runs **close to yours in distance** (e.g. within ±0.5 km, same week) are
   highlighted as "matches."

Matching is just a Postgres query — no extra tables, no cron jobs:

```sql
-- runners who ran a similar distance to mine this week
select p.display_name, r.distance_km, r.run_date
from runs r
join profiles p on p.id = r.user_id
where r.run_date >= date_trunc('week', now())
  and abs(r.distance_km - :my_distance) <= 0.5
  and r.user_id <> auth.uid()
order by abs(r.distance_km - :my_distance);
```

Start even simpler if you like: a weekly leaderboard (everyone sorted by total km).
Add the proximity highlight once the basics work.

---

## 7. Shared scheduling calendar

Where distance matching answers "who runs like me," the calendar answers "when
can we actually run together." It's a lightweight, shared availability board —
not a full calendar app — that every partner in the pilot can see and post to.

### What it looks like

A simple month or week grid. Each day can carry one or more colored slots,
one per partner who's posted availability for that day:

| Status        | Color                       | Meaning                                                                                            |
| ------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| **Free**      | 🟢 green                    | "I'm available and would like company"                                                             |
| **Undecided** | 🟠 orange                   | "Possibly available, not committed yet"                                                            |
| _(cancelled)_ | greyed out / struck through | Was posted, then withdrawn — kept visible briefly so partners see the change, not silently deleted |

Tapping a day opens that day's slots — who posted, their status, and the time.

### Posting a slot

When a partner adds themselves to a day, they choose exactly one of two ways
to express _when_:

1. **A loose block** — "morning" or "evening." Simple, no exact time needed.
2. **A precise cutoff** — "free after 18:00." For someone who knows their day
   frees up at a specific hour but not the general shape of it.

Then they pick a status: **free** (green) or **undecided** (orange). That's
the whole form — day, one time choice, one status.

### Editing and cancelling

Because RLS only allows you to write your own `availability` rows (see §4),
each partner can freely:

- **Edit** their own slot — change the day, switch morning ↔ evening ↔ a
  precise time, or flip free ↔ undecided as plans firm up.
- **Cancel** their own slot — sets `status = 'cancelled'` rather than deleting
  outright, so partners who were coordinating around it see it went away
  instead of it just vanishing. A cleanup job (or just letting old rows age
  out of the visible range) keeps the table tidy over time.

Nobody can edit or cancel _someone else's_ slot — the database enforces that,
not just the UI.

### Why this is still "just a query"

Like distance matching, this needs no extra infrastructure — a calendar is
just `availability` rows grouped by `plan_date`:

```sql
-- everyone's posted slots for a given week, newest edit first
select p.display_name, a.plan_date, a.time_block, a.after_time, a.status, a.notes
from availability a
join profiles p on p.id = a.user_id
where a.plan_date between :week_start and :week_end
  and a.status <> 'cancelled'
order by a.plan_date, a.updated_at desc;
```

The month/week grid is purely a frontend concern — a small calendar
component (or a simple hand-rolled grid, given the phone-first design) that
groups these rows by date and colors them by `status`.

---

## 8. Deployment — same free pipeline

Identical to how snjv.club works now:

1. New GitHub repo (e.g. `gorkhali-runners`).
2. New Cloudflare project → connect the repo → framework preset **Astro**.
3. Add a `wrangler.jsonc` for static assets (same as the portfolio fix).
4. **Settings → Domains & Routes → Custom Domain →** `run.snjv.club`.
5. Add Supabase env vars: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
   (the anon key is _designed_ to be public — RLS protects the data).
6. `git push` → auto-build → live.

Every push deploys itself. Same CI/CD story you can put on your resume.

---

## 9. Suggested build order

1. Create the Supabase project; add the tables (`profiles`, `runs`, `invite_codes`) + RLS rules.
2. Scaffold the Astro app; wire up `supabase-js`; get login working.
3. Add the invite-code check to signup.
4. Build "log a run" (insert) + "see all runs" (list).
5. Add the distance-match highlight.
6. Deploy to `run.snjv.club`.
7. Add the `availability` table + RLS; build the calendar grid, the post/edit/cancel form.
8. Hand the invite code to 5–10 runner friends. Watch, listen, iterate.

---

## 10. Path to the standalone launch (later)

When the pilot validates: lock in the public brand name (front-runner _Takt_), buy
its domain (e.g. `takt.run` / `takt.app` / `gettakt.com`), point it at the same
project, open registration (drop the invite gate), and 301-redirect `run.snjv.club`
to it. No re-architecture — same Supabase, same code. Pay only when you outgrow free
tiers (~$25/mo Supabase Pro), which won't happen at pilot scale.

Keeping the pilot on a generic `run.snjv.club` means the brand name never appears in
public certificate logs before launch — it stays yours to claim.
