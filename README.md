# HUNTER SQUAD: OLYMPUS ASCENDANT

A dark, premium two-hunter training dashboard in the spirit of ancient Greek myth and a hunter-system RPG. Built local-first: every mission check-off, streak, XP award and schedule edit persists in the browser. The Supabase boundary is prepared but deliberately **not** pretending to be connected.

> **Delivered with this project environment:** React + Vite + Tailwind CSS. This scaffold is required by the build environment and produces a **fully static** site (`dist/index.html`) that works on GitHub Pages. There is no server, database connection, API key or build-time backend in the published result. The application behaviour is exactly the requested static-first product.

---

## 1. What is included

| Requested file | Delivered file |
| --- | --- |
| `index.html` | `index.html` (Vite entry) |
| `missions.html` | hash route `#/missions` → `src/pages/Missions.tsx` |
| `squad.html` | hash route `#/squad` → `src/pages/Squad.tsx` |
| `profile.html` | hash route `#/profile` → `src/pages/Profile.tsx` |
| `css/style.css` | `src/index.css` (design tokens, atmosphere, components) |
| `js/app.js` | `src/App.tsx`, `src/components/Layout.tsx`, `src/lib/router.ts` |
| `js/dashboard.js` | `src/pages/Dashboard.tsx` |
| `js/missions.js` | `src/pages/Missions.tsx` |
| `js/workout.js` | `src/pages/Workout.tsx` |
| `js/squad.js` | `src/pages/Squad.tsx` |
| `js/profile.js` | `src/pages/Profile.tsx` |
| `js/storage.js` | `src/lib/storage.ts` (+ `src/lib/store.tsx` data actions) |
| `js/supabase.js` | `src/lib/supabase.ts` |
| `assets` | Inline SVG heraldry and icons; no external image dependencies |

Hash routes are used on purpose so direct links and refreshes work on GitHub Pages without server rewrite rules.

### Design language

- Obsidian and charcoal surfaces, hairline bronze borders, antique gold typography and controlled orange accents.
- Cinzel display type, Inter interface type, JetBrains Mono numerics.
- Meander (Greek key) borders, laurel-and-temple emblem, rank seals, ascent rings.
- Responsive at **Xiaomi Pad 7 landscape**, Android phone widths and desktop. No horizontal scrolling; a fixed bottom navigation is used below 1024 px.
- Decorative elements stay out of the way of the training data.

---

## 2. Run it locally

Requirements: Node.js 20+ (the project was built with Node 22) and npm.

```bash
npm install
npm run dev
# open the URL Vite prints, usually http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

The production output is a self-contained `dist/index.html` (JavaScript and CSS inlined). Google Fonts are loaded from Google's CDN; the CSS has a sensible serif/sans fallback if offline.

---

## 3. Publish on GitHub Pages

### A. Put the source on GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Hunter Squad: Olympus Ascendant"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hunter-squad.git
git push -u origin main
```

### B. Enable GitHub Pages — automated build (recommended)

This repository includes `.github/workflows/deploy.yml`. If you fork/upload the source:

1. Open the repository **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main`. The workflow installs dependencies, builds, and publishes `dist`.
4. Your site appears at `https://YOUR-USERNAME.github.io/hunter-squad/`.

No `base` path change is needed for this build because `vite-plugin-singlefile` inlines the app into one HTML file and the app uses hash routing.

### C. Manual alternative

```bash
npm run build
```

Upload the contents of the generated `dist/` directory to a `gh-pages` branch (or to the root of a repository set to serve from a branch). The only essential file is `dist/index.html`.

### D. If you later add public image/font files

If you stop using the single-file build or add files from `public/`, set the repository name as the Vite `base`:

```ts
// vite.config.ts
export default defineConfig({ base: "/hunter-squad/", /* ... */ });
```

and rebuild. That is not required for the current version.

---

## 4. Test the working build

Use a normal desktop browser first, then a phone/tablet emulator.

### Dashboard
- Confirm the greeting uses the active hunter, the level/rank ring, lifetime XP, streak, weekly completion and recorded exercise time.
- The daily mission is resolved from the **actual weekday**. Exercise check-offs award XP and volume; unchecking reverses the associated local award.
- The 10/15/20/30-minute selector changes the plan and the completion bonus.
- Open **Daily foundations** and complete a mobility drill: +10 XP and recorded mobility volume.
- Refresh the page. All check-offs, XP, streak and activity remain.
- Confirm there is no heart rate, sleep, readiness or other invented clinical measurement anywhere.

### Missions and schedule editing
- Filter by Strength / Mobility / Conditioning / Recovery.
- Each exercise displays name, sets × reps **or** duration, rest and a completion checkbox.
- **Edit schedule**: rename a session, change its minutes, rename a movement, change sets/reps or convert it to a timed movement, change rest, add or remove movements. Refresh — edits persist.
- **Restore defaults** returns the original seven-session protocol after confirmation.
- Add a supplementary exercise (name, sets, reps, rest). Check it off, then remove it. Supplementary work earns its own XP but never completes the daily mission.
- The permanent four mobility basics remain every day and reset by **date**, not by refresh.

### Workout chamber
- Starting a workout changes the timer from **staged** to **working**. Pause, resume and reset all work.
- Refresh while running: the persisted working timer continues from its saved point (this is intentional local persistence).
- The **Mark exercise complete** button is disabled until the timer is started. Only a completed exercise awards XP.
- Mark one exercise complete and a rest interval appears with skip and +15s controls.
- Navigate with Previous/Next, jump using progress dots or the queue.
- Finish with **zero exercises completed**: the summary records `+0 XP` and does not advance the streak. This proves the timer alone cannot farm XP.
- Finish with some exercises: summary shows XP, volume, completion and the locked/unlocked mission bonus.
- The camera/timelapse panel is explicitly in standby. It has a local consent preference but **does not open a camera, record, preview, or upload**.

### Squad
- Exactly two hunters are displayed with rank, level, weekly XP, exercise time, missions, streak and weekly consistency.
- The leaderboard and activity filters are derived from local plus clearly labelled seeded demo records.
- The page states plainly that no synchronization is active. No buttons should claim a successful remote sync.

### Dossier
- Switch the active hunter from the identity card or record settings. Both records can be inspected; local actions apply to whichever hunter is active.
- Rename the hunter. The update persists locally and does not imply an auth account change.
- Export JSON downloads a complete backup of this browser's record.
- **Reset local record** restores the seeded demo state after confirmation.
- Achievements, weekly and monthly consistency, and activity history are computed from the record, not hard-coded visual values.

### Cross-device expectation
Open the site on two devices: progress **will not** be shared. This is correct for the first version. The two-hunter interface can be tested on one device by switching records and by using the seeded demo history. Real synchronization requires the Supabase steps below.

---

## 5. Connect Supabase later

The integration surface already exists in `src/lib/supabase.ts`:

- configuration detection and safe failure states;
- REST gateway with profiles, squad activity, exercise-record and check-in writes;
- email/password sign-in helpers (session token kept in `sessionStorage`);
- explicit data-mode reporting (`local` vs `supabase`).
- Row types and table names matching the suggested schema below.

No remote call occurs in local mode. **Never use a service-role key in frontend code, a `VITE_` variable, GitHub, or a Pages artifact.**

### Step 1 — Configure

For the current static build, supply build-time variables (or `window.HUNTER_SUPABASE_CONFIG` in a managed self-hosted page):

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLISHABLE-KEY
npm run build
```

If you publish with GitHub Actions, add these as **Actions secrets** and pass them to the build step. For a fully static public repository this environment currently remains in local mode, which is honest and safe.

### Step 2 — Suggested schema

Run in the Supabase SQL editor. It is intentionally scoped to one private squad of **two** user accounts.

```sql
-- Extensions and enums -------------------------------------------------------
create extension if not exists pgcrypto;

create type public.hunter_rank as enum ('E', 'D', 'C', 'B', 'A', 'S');
create type public.mission_type as enum ('Strength', 'Mobility', 'Conditioning', 'Recovery', 'Endurance');
create type public.record_source as enum ('session', 'basics', 'recovery', 'supplementary');

-- Profiles are keyed to auth.users ------------------------------------------
create table public.hunter_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 28),
  handle text not null unique check (handle ~ '^@[a-z0-9_]{2,24}$'),
  rank public.hunter_rank not null default 'E',
  level integer not null default 1 check (level > 0),
  lifetime_xp integer not null default 0 check (lifetime_xp >= 0),
  weekly_xp integer not null default 0 check (weekly_xp >= 0),
  total_exercise_seconds integer not null default 0 check (total_exercise_seconds >= 0),
  completed_missions integer not null default 0 check (completed_missions >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Hunter Squad: Olympus Ascendant',
  created_by uuid not null references auth.users(id) on delete restrict,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.squad_members (
  squad_id uuid not null references public.squads(id) on delete cascade,
  member_id uuid not null references public.hunter_profiles(id) on delete cascade,
  role text not null default 'hunter' check (role in ('founder', 'hunter')),
  joined_at timestamptz not null default now(),
  primary key (squad_id, member_id)
);
-- Enforce the product rule: exactly two members maximum per squad.
create or replace function public.enforce_two_hunters()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.squad_members where squad_id = new.squad_id) >= 2 then
    raise exception 'A covenant may contain exactly two hunters.';
  end if;
  return new;
end; $$;
create trigger squad_members_max_two
before insert on public.squad_members
for each row execute function public.enforce_two_hunters();

-- Missions and exercises -----------------------------------------------------
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('MON','TUE','WED','THU','FRI','SAT','SUN')),
  title text not null,
  focus text not null default '',
  type public.mission_type not null default 'Strength',
  planned_minutes integer not null default 20 check (planned_minutes between 5 and 120),
  note text,
  is_recovery boolean not null default false,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.mission_exercises (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  name text not null,
  sets integer not null default 3 check (sets between 1 and 20),
  reps integer check (reps between 1 and 200),
  duration_seconds integer check (duration_seconds between 5 and 7200),
  distance_meters integer check (distance_meters between 1 and 5000),
  rest_seconds integer not null default 60 check (rest_seconds between 0 and 600),
  cues text,
  is_optional boolean not null default false,
  position integer not null default 0,
  check (num_nonnulls(reps, duration_seconds, distance_meters) = 1)
);

-- Records --------------------------------------------------------------------
create table public.exercise_records (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  member_id uuid not null references public.hunter_profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  exercise_id uuid references public.mission_exercises(id) on delete set null,
  exercise_name text not null,
  completed_on date not null default current_date,
  xp_awarded integer not null default 0 check (xp_awarded between 0 and 1000),
  seconds_awarded integer not null default 0 check (seconds_awarded between 0 and 7200),
  source public.record_source not null default 'session',
  created_at timestamptz not null default now(),
  unique (member_id, exercise_id, completed_on)
);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  member_id uuid not null references public.hunter_profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete set null,
  completed_on date not null default current_date,
  mission_completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (member_id, completed_on, mission_id)
);

-- Append-only shared history and XP ledger -----------------------------------
create table public.squad_activity (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  member_id uuid not null references public.hunter_profiles(id) on delete cascade,
  kind text not null check (kind in ('mission','exercise','session','basics','recovery','achievement')),
  title text not null,
  detail text,
  xp integer not null default 0 check (xp >= 0),
  seconds integer not null default 0 check (seconds >= 0),
  created_at timestamptz not null default now()
);

create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  member_id uuid not null references public.hunter_profiles(id) on delete cascade,
  source text not null,
  reference_id text not null,
  xp integer not null check (xp > 0),
  created_at timestamptz not null default now(),
  unique (member_id, source, reference_id)
);

-- Optional future private proof ---------------------------------------------
create table public.video_proofs (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  member_id uuid not null references public.hunter_profiles(id) on delete cascade,
  exercise_record_id uuid references public.exercise_records(id) on delete set null,
  storage_path text not null unique,
  consent_granted_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

### Step 3 — Row Level Security

```sql
-- Membership helper avoids recursive RLS lookups.
create or replace function public.is_squad_member(target_squad uuid, target_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.squad_members
    where squad_id = target_squad and member_id = target_user
  );
$$;

alter table public.hunter_profiles enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.missions enable row level security;
alter table public.mission_exercises enable row level security;
alter table public.exercise_records enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.squad_activity enable row level security;
alter table public.xp_ledger enable row level security;
alter table public.video_proofs enable row level security;

-- Profiles: read your squad peers, update only yourself.
create policy "read own and squad profiles" on public.hunter_profiles
for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from public.squad_members me
    join public.squad_members peer on peer.squad_id = me.squad_id
    where me.member_id = auth.uid() and peer.member_id = hunter_profiles.id
  )
);
create policy "insert own profile" on public.hunter_profiles
for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on public.hunter_profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Squads and membership.
create policy "read my squads" on public.squads
for select to authenticated using (public.is_squad_member(id) or created_by = auth.uid());
create policy "create squad as self" on public.squads
for insert to authenticated with check (created_by = auth.uid());
create policy "read my squad memberships" on public.squad_members
for select to authenticated using (public.is_squad_member(squad_id) or member_id = auth.uid());
create policy "founder adds exactly two hunters" on public.squad_members
for insert to authenticated with check (
  exists (select 1 from public.squads s where s.id = squad_id and s.created_by = auth.uid())
);

-- Mission content is shared inside the covenant.
create policy "read squad missions" on public.missions
for select to authenticated using (public.is_squad_member(squad_id));
create policy "squad edits missions" on public.missions
for all to authenticated using (public.is_squad_member(squad_id))
with check (public.is_squad_member(squad_id));

create policy "read squad exercises" on public.mission_exercises
for select to authenticated using (
  exists (select 1 from public.missions m where m.id = mission_id and public.is_squad_member(m.squad_id))
);
create policy "squad edits exercises" on public.mission_exercises
for all to authenticated using (
  exists (select 1 from public.missions m where m.id = mission_id and public.is_squad_member(m.squad_id))
)
with check (
  exists (select 1 from public.missions m where m.id = mission_id and public.is_squad_member(m.squad_id))
);

-- Exercise records: squad-readable, own-member writes only.
create policy "read squad records" on public.exercise_records
for select to authenticated using (public.is_squad_member(squad_id));
create policy "write own records" on public.exercise_records
for insert to authenticated with check (
  member_id = auth.uid() and public.is_squad_member(squad_id)
);
create policy "delete own records" on public.exercise_records
for delete to authenticated using (member_id = auth.uid() and public.is_squad_member(squad_id));

-- Daily marks: same shape.
create policy "read squad checkins" on public.daily_checkins
for select to authenticated using (public.is_squad_member(squad_id));
create policy "write own checkins" on public.daily_checkins
for insert to authenticated with check (
  member_id = auth.uid() and public.is_squad_member(squad_id)
);
create policy "delete own checkins" on public.daily_checkins
for delete to authenticated using (member_id = auth.uid() and public.is_squad_member(squad_id));

-- Shared history and XP are read-only to clients.
create policy "read squad activity" on public.squad_activity
for select to authenticated using (public.is_squad_member(squad_id));
create policy "read own and squad xp" on public.xp_ledger
for select to authenticated using (public.is_squad_member(squad_id));
-- No client insert/update/delete policies: write these through security-definer
-- functions that calculate XP and bonuses on the server.

-- Private proof metadata.
create policy "read own proof metadata" on public.video_proofs
for select to authenticated using (member_id = auth.uid());
create policy "create own proof metadata" on public.video_proofs
for insert to authenticated with check (
  member_id = auth.uid() and public.is_squad_member(squad_id) and consent_granted_at is not null
);
```

**Important server-authority note:** exercise XP, completion bonuses, streak and leaderboard totals must be calculated in Postgres functions/triggers, not trusted from the browser. The current local-first client is deliberately auditable and simple; a production sync must move those calculations to RPCs.

### Step 4 — Private proof bucket (future)

Create a **private** Storage bucket named `workout-proofs`. Do not make it public. Suggested policies:

```sql
create policy "members upload only to their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'workout-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "members read only their own proof"
on storage.objects for select to authenticated
using (
  bucket_id = 'workout-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

Video proof is not implemented in the current build. Cameras must only be opened after explicit, revocable permission; uploads must go to a private bucket and remain non-public.

---

## 6. Local data model

Storage key: `hunter-squad:olympus-ascendant:v1`.

`storage.ts` owns load/save/reset and normalization. `store.tsx` owns domain actions and is the only layer pages call. The shape includes:

- `members` — two seeded member records (baseline demo XP, weekly XP, volume, missions);
- `schedule` — the editable seven-session week;
- `dailyBasics` — permanent mobility drills;
- `supplementary` — optional custom movements;
- `completions` — idempotent per `member | date | session | exercise` keys, with XP and seconds;
- `completedDays` — per member, used for streak, weekly and monthly consistency;
- `log` — append-only activity entries tagged `seed: true` or local;
- `plannedMinutes`, `cameraConsent`, persisted workout timer and last summary.

All derived values (rank, level, weekly totals, achievements) are recomputed from this record. Mission completion bonus is awarded once when every base exercise for the selected session is complete. Supplementary and daily-basic work does not count toward that mission completion.

### Honest demo separation
- Seeded demo totals are shown as **Seeded demo history** in the activity feed and labelled on squad cards.
- Actions performed in the browser are marked **Local record**.
- The interface repeatedly states that local mode is **not synchronized**.
- The squad page never performs a simulated Supabase pull/push.

To reset everything, use **Dossier → Reset local record**, or clear site data in the browser.

---

## 7. Not yet implemented

These are intentional scope boundaries, not hidden placeholders:

1. **Live Supabase project connection** — the REST gateway, config, types and SQL are prepared, but no credentials are included and remote sync is not active.
2. **Authentication flows and screens** — helper API methods exist; no login modal/account UI is shipped.
3. **Server-authoritative XP, bonuses, streak and leaderboard** — must be implemented as Postgres functions/triggers with RLS before two real accounts can trust each other's data.
4. **Cross-device and two-hunter synchronization** — not simulated. Each browser has its own local record.
5. **Camera recording, timelapse rendering, private upload and proof review** — only the privacy/consent preparation panel exists.
6. **Push notifications, email digests, import from previous versions, CSV export** — not present (JSON export is present).
7. **Wearable/health integrations and medical data** — deliberately absent. The dashboard shows training data only.
8. **Offline service worker/PWA install** — the build is static and cacheable, but no service worker is registered.
9. **Multi-squad support, invites and moderation UI** — schema supports squads and the two-member constraint; UI is scoped to the covenant.

---

## 8. Project structure

```
.
├── index.html
├── README.md
├── package.json
├── vite.config.ts
├── .github/workflows/deploy.yml
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── ui.tsx
│   │   └── widgets.tsx
│   ├── lib/
│   │   ├── date.ts
│   │   ├── router.ts
│   │   ├── scoring.ts
│   │   ├── seed.ts
│   │   ├── selectors.ts
│   │   ├── storage.ts
│   │   ├── store.tsx
│   │   ├── supabase.ts
│   │   └── types.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Missions.tsx
│   │   ├── Squad.tsx
│   │   ├── Profile.tsx
│   │   └── Workout.tsx
│   └── utils/cn.ts
└── tsconfig.json
```

## 9. Design / data integrity principles

- **No fake synchronization.** The words "synced", "live to Supabase" and account-sharing claims never appear without a real connection.
- **No fake measurements.** Heart rate, sleep, readiness scores and recovery percentages are not displayed.
- **No timer farming.** Exercise XP is only written by explicit completion (checkbox / mark complete / workout finish with at least one completion). Starting or pausing the timer changes no XP.
- **No silent loss.** Every state mutation passes through the local repository and is reloaded on refresh. The last workout summary and timer survive refresh.
- **Clear demo state.** Seed data is visibly labelled everywhere it influences a number.

*Two-hunter alliance · consistency over mass.*
