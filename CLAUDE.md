# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server with HMR
npm run build    # Production build to dist/
npm run preview  # Serve the production build locally
npm run lint     # Oxlint (config in .oxlintrc.json — react + oxc plugins)
```

There is no test suite. Lint is the only automated check.

## Overview

Sumeria is a single-user personal life-tracking PWA ("daily cockpit") built with React 19 + Vite, backed by a Supabase Postgres database. It is mobile-first: the entire app renders inside a `max-width: 430px` centered column (see [App.jsx](src/App.jsx)). The Sumerian theme is cosmetic — the app is a habit/goal/health tracker organized into life areas (fitness, work, diet, reading, learning, social, healthcare, savings, journal).

## Architecture

**No router despite `react-router-dom` being installed.** Navigation is manual state in [App.jsx](src/App.jsx): a single `activeTab` string switches which page component renders, and a fullscreen `Menu` overlay ([components/Menu.jsx](src/components/Menu.jsx)) sets it. Do not reach for routes — follow the existing `activeTab` pattern.

**Data layer is Supabase-direct, no abstraction.** Every page imports the shared client from [lib/supabase.js](src/lib/supabase.js) and calls `supabase.from('table')...` inline. There is no repository/service layer, no Redux store in use (Redux is a transitive dep of the Supabase/toolkit tree, not the app). Each page owns its own `useState` + a `fetchAll()` in `useEffect`, and does optimistic local state updates alongside the DB write. When adding data flows, match this: fetch on mount, mutate DB, then update local state by hand.

**Single-user, no auth.** The app uses the Supabase anon key directly ([.env](.env): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) with no login and no per-user scoping — all rows belong to the one user. Do not add `user_id` filtering unless explicitly asked.

### Database tables

Supabase Postgres, queried directly by string name across `src/pages/` (no migrations in-repo — schema lives in Supabase). All tables use `uuid` PKs with `gen_random_uuid()` and most have `created_at`. Notable columns beyond the obvious:

- **goals** — `text, area, done, date`
- **routines** — `title, area, days_of_week` (comma-separated weekday numbers, 0=Sun), `active, quick_log_type` (`workout`/`reading`/`learning`/`weigh`/`pr`/`hydration`/`reflection` — drives which logging modal appears) / **routine_log** — `routine_id, date, done` / **routine_exercises** — `routine_id, name, sets, reps, order_index` (defined but not currently queried by any page)
- **activity_timers** — `type, area, routine_id, started_at, ended_at, duration_min, date, notes`
- **daily_journal** — one row per `date`: `energy, priority, mood, gratitude, win`
- **medicines** — `name, dose, time, with_food, frequency, alternate_start, notify_before_min` / **med_log** — `medicine_id, date, taken`
- **sleep_log** — `date, sleep_time, wake_time, duration`
- **workouts** — `date, type, duration_min, notes, exercises` (jsonb) / **weight_log** — `date, kg` / **personal_records** — `exercise, reps, date, notes`
- **books** — `title, author, total_pages, pages_read, format, status, rating` / **courses** — `title, platform, total_modules, modules_done, status` / **study_sessions** — `course_id, date, minutes, module_number, notes`
- **meals** — `date, name, meal_type, calories, protein_g, notes` (also stores hydration entries)
- **contacts** — `name, relationship, remind_every_days, last_contacted, notes` / **interactions** — `person, type, notes, date` / **reminders** — `contact_id, title, remind_on, notes, done`
- **applications** — `company, role, status, date, notes`
- **transactions** — `date, description, amount, type`
- **weekly_reviews** — `week_start, week_end, challenge, stats` (jsonb), `viewed_at` / **monthly_reviews** — `month, challenge, stats, viewed_at` / **yearly_reviews** — `year, challenge, stats, viewed_at`
- **xp_log** — `amount, reason, date` — still written on nearly every action (see caveat below)
- **earn_it** — `app_name, limit_min, used_min, locked, date` — orphaned; the only page that queried it ([pages/EarnIt.jsx](src/pages/EarnIt.jsx)) was deleted as dead code, table is no longer referenced anywhere in `src/`

### Date & timezone convention

**Critical and repeated everywhere.** Date keys are `YYYY-MM-DD` strings produced by `new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })`. Every page redefines a local `today()` helper with exactly this call. All `date` columns are compared against these strings. Use this same pattern for any new date-keyed feature — do not use `toISOString()` or raw `Date` for day keys, or entries land on the wrong day.

### Reviews & notifications

- Weekly/monthly/yearly reviews are modal overlays triggered two ways: manually from the Menu, or automatically on a schedule check in [App.jsx](src/App.jsx) (e.g. Sunday ≥8pm for weekly). "Already shown" is tracked with `localStorage` keys like `sumeria_weekly_review_<date>`.
- [lib/notifications.js](src/lib/notifications.js) (`Notifs`) uses the browser Notification API with `setTimeout`-based same-day scheduling (morning 7am, evening 8pm, plus per-medicine reminders). Scheduling only fires while the tab is open; there is no service worker / push. A once-per-day guard uses `localStorage` key `sumeria_notifs_date`.

### Styling

All styling is **inline `style={{}}` objects** using CSS custom properties defined in [index.css](src/index.css) (`:root`). There are no CSS modules or utility classes. The palette is a fixed dark theme with per-area accent colors (`--fit`, `--work`, `--read`, `--learn`, `--social`, `--health`, `--savings`, `--acc`, `--xp`, `--danger`). Reuse these variables rather than hardcoding hex values.

## Caveats / gotchas

- **XP was "removed" but still writes.** Recent commits removed XP from the UI, yet `xp_log` inserts remain scattered through the mutation handlers (e.g. throughout [pages/Home.jsx](src/pages/Home.jsx)). The table is still populated but not surfaced. Don't assume XP is fully gone.
- Some leftover `console.log` calls exist in fetch paths (e.g. Home's `fetchAll`).
