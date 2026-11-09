# NEURIX frontend — status, integration and missing backend support

Branch: `claude/optimistic-mendel-p8zmk8` · Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind 3, TanStack Query 5, Recharts, Supabase JS.

## Configuration (public values only)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hhdlsbbeabdbqrlqxtiu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **publishable** key (`sb_publishable_…`) |
| `NEXT_PUBLIC_BACKEND_URL` | `https://hhdlsbbeabdbqrlqxtiu.supabase.co/functions/v1/neurix-api` |

The project uses Next.js, so the variables are `NEXT_PUBLIC_*` (not `VITE_*`). No service-role key, database URL, or AI key is used in the browser. The bundle was scanned: it contains only the publishable key.

The neurix-api function must allow the site's origin in CORS (`localhost:4028` and the MindCast site are allowed by default).

## Routes

Public: `/`, `/login`, `/signup`, `/doctor/login` (sign-in + clinician application + pending state), `/privacy` (policy when signed out, Privacy centre when signed in), `/terms`, 404.

Patient (`src/app/(app)`): `/dashboard`, `/profile`, `/wellbeing`, `/medical-records` (+ `history`, `conditions`, `medications`, `allergies`, `surgeries`, `documents`), `/assessments`, `/assessments/:id`, `/assessments/:id/results/:attemptId`, `/assessment-history`, `/journal`, `/soul`, `/insights`, `/history`, `/goals`, `/reminders`, `/doctor-connection`, `/privacy`, `/settings`.

Doctor (`src/app/doctor/(portal)`, verified clinicians only): `/doctor/dashboard`, `/doctor/patients`, `/doctor/patients/:id` (→ overview), `/doctor/patients/:id/{overview,trends,assessments,documents}`, `/doctor/reports`, `/doctor/settings`.

## What is connected to neurix-api

| Area | Endpoints |
|---|---|
| Auth/profile | Supabase Auth; `GET/PATCH /me` |
| Records | `/medical-records` CRUD, `POST/GET/DELETE /medical-records/:id/document` (signed, short-lived URLs) |
| History | `/medical-history` CRUD (conditions, medications, allergies, surgeries, family history …) |
| Wellbeing | `/mood-entries`, `/habit-entries`, `/digital-activity` CRUD; `PUT/GET/DELETE /wellbeing-logs/:date` |
| Journal, goals, reminders | `/journal-entries`, `/reminders` (goals = `reminder_type: "goal"`) |
| Insights | `/analytics/overview?days`, `/analytics/monthly-review?month` |
| Validated assessments | `/assessments/instruments`, `POST /assessments` (server scoring), list/get |
| SOUL | `/ai/consent`, `/ai/consent/:scope`, `/ai/conversations` CRUD, `/ai/conversations/:id/messages`, `/ai/summaries` |
| Care & privacy | `/doctors/lookup`, `/connections` (+ respond, revoke, permissions per category with expiry), `/consents`, `/me/audit-trail` |
| Doctor portal | `/doctor/application`, `/doctor/profile`, `/doctor/patients`, `/doctor/patients/:pid/data/:category`, `/doctor/documents/:id` |

Errors: 401 signs the user out locally and returns to sign-in; 403/404/422 (field messages)/429/5xx and network failures show specific messages; AI 503 shows "AI features are not configured" — never a fake reply.

## Missing backend support (UI is honest about each)

1. **Exploratory assessment storage.** The server only accepts PHQ-9/GAD-7/WHO-5 (`private.insert_assessment_result`). Exploratory results are therefore stored **on the device** (localStorage, append-only, per user) and labelled as such. They can't sync, be shared with doctors, or be read by SOUL. Proposed contract and draft migration below.
2. **Profile details:** blood group, emergency contacts, demographics — not stored (profile shows an unavailable state).
3. **Structured medications/visits:** dose, frequency, prescriber, visit reason/follow-up are free text (name + notes) today.
4. **Tags:** emotion tags on mood entries and journal entries; sleep/wake times on daily logs.
5. **Goals:** no target/progress fields; goals reuse reminders (`reminder_type = 'goal'`, `is_enabled=false` = achieved).
6. **Notifications:** none are sent (stated in the UI).
7. **Data export and account deletion:** no endpoints (Settings says so).
8. **Live AI:** production has no AI key configured, so SOUL and summaries show the not-configured state.

### Proposed contract — exploratory attempts

```
POST /api/v1/assessments/exploratory
  { module: string, module_version: "1.0.0", length: 30|40|50,
    answers: { [questionId]: string | string[] }, follow_ups: { [questionId]: string },
    started_at: ISO, completed_at: ISO, client_result: {...} }
  → 201 { id, module, module_version, length, answers, follow_ups, result, scoring_version, started_at, completed_at, created_at }
GET  /api/v1/assessments/exploratory?module=&limit=&offset=  → { items, limit, offset }
GET  /api/v1/assessments/exploratory/:id
```
The server should re-score with the same versioned engine (`src/lib/assessments/engine.ts`, deterministic) and store its own result; attempts are immutable (no PATCH). Doctor access should require a **new, separate** share category (e.g. `exploratory_assessments`), off by default.

### Draft additive migration (NOT applied — needs your approval)

```sql
create table if not exists public.exploratory_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  module text not null check (module ~ '^[a-z_]{2,40}$'),
  module_version text not null,
  length smallint not null check (length in (30, 40, 50)),
  answers jsonb not null,
  follow_ups jsonb not null default '{}'::jsonb,
  result jsonb not null,
  scoring_version text not null,
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.exploratory_assessment_attempts enable row level security;
create policy "own attempts: read" on public.exploratory_assessment_attempts for select using (patient_id = auth.uid());
create policy "own attempts: insert" on public.exploratory_assessment_attempts for insert with check (patient_id = auth.uid());
-- No update policy: attempts are immutable. Delete only by the owner:
create policy "own attempts: delete" on public.exploratory_assessment_attempts for delete using (patient_id = auth.uid());
create index on public.exploratory_assessment_attempts (patient_id, module, completed_at desc);
```

## Assessment Centre design

* Validated: PHQ-9, GAD-7, WHO-5 — questions and scoring come from the server, unchanged; PHQ-9 item 9 shows support immediately.
* Exploratory (original NEURIX items, not validated), seven modules: Emotional wellbeing (30/40), Personality & behavioural tendencies (30/40/50), Thinking & decision-making (30/40), Sleep & lifestyle (30/40/50), Stress & coping (30/40), Relationships & family (30/40/50, optional sensitive items), Comprehensive self-understanding (50).
* Formats: 5/7-point agreement, frequency, single choice, situational, multi-select, written reflection, conditional follow-ups.
* Scoring: deterministic, versioned; "wellbeing" areas (0–100, banded) vs "tendency" areas (position between two poles, never banded as good/bad, never averaged). Overall score averages wellbeing areas only. Comparisons only within the same module version.
* Unit tests: `npm test` (15 tests).

## Preview and publish

```bash
npm install
npm run dev          # http://localhost:4028
npm run build && npm run serve
```
Publishing: deploy this branch to a **preview** first (e.g. a Netlify/Vercel preview deploy) with the three variables above, add the preview origin to neurix-api's allowed CORS origins, test sign-in and a few writes with a test account, then merge to the production branch. Nothing has been deployed.
