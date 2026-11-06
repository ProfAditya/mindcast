# NEURIX backend discovery and integration plan

Status: discovery complete, implementation not started. Nothing in the existing
backend, the Render service or the database was changed.

## A. Backend identification

| Item | Finding | Confidence |
|---|---|---|
| Live service | Render web service `mindcast-backend` → `https://mindcast-backend.onrender.com/api`. The frontend `.env` value and the fallback in `src/lib/api.ts` are the same URL. | Confirmed from code and `render.yaml` |
| Technology | Python **FastAPI** 0.110, SQLAlchemy 2 (async, asyncpg), Alembic, PyJWT + bcrypt, Google Gemini (`gemini-2.5-flash`), optional Phi-3.5 via an OpenAI-compatible client | Confirmed from source |
| Newest source found | `mindcast-production-ready (7).zip` in `ProfAditya/MindCast-Enhance-2.5`. It contains `render.yaml` (service name `mindcast-backend`, `rootDir: backend`, `uvicorn server:app`) | Confirmed |
| Older source | `ProfAditya/MindCast-Enhance` (archived) `backend/`: same layout, older `server.py` and `ai_service.py`, no `render.yaml` | Confirmed |
| Repo Render deploys from | **Unknown.** `rootDir: backend` means Render builds from a git repo with `backend/` at its root; a zip cannot be deployed. Candidates: `ProfAditya/mindcast-2` (public, last push 2026-08-11) and `ProfAditya/mindcast-eenhance` (private). Attaching both was refused by this session's permission check. | Unverified |
| Database the live service uses | **Not NEURIX.** It needs its own `users`, `mood_logs`, `habit_logs`, `conversations` and other tables; none of them exist in `hhdlsbbeabdbqrlqxtiu`. Its `DATABASE_URL` is a Render secret. | Confirmed that it is not NEURIX; actual target unknown |
| Live API reachable from this session | No: the session's network policy blocks `onrender.com` (proxy 403). | Confirmed |
| Frontend Supabase config | `.env` `NEXT_PUBLIC_SUPABASE_URL` points to a different Supabase project, not NEURIX. The anon, OpenAI, Gemini, Anthropic, Perplexity and Stripe keys are placeholders. `.env` is tracked in a public repo. | Confirmed (values not printed) |

## B. Existing backend architecture

```
Next.js (this repo) --Bearer custom JWT--> FastAPI on Render --asyncpg (DATABASE_URL)--> Postgres (unknown)
                                                    \--> Gemini API
```

- `auth.py`: its own email/password users (bcrypt), its own HS256 JWT (`JWT_SECRET`, 30-day expiry), claims `user_id`, `email`.
- `server.py` (1,236 lines): 33 routes under `/api`, one `get_current_user` dependency, admin flag `users.is_admin`.
- `models.py`: 10 tables (`users`, `conversations`, `assessments`, `mood_logs`, `habit_logs`, `journal_entries`, `wellness_toolkit_items`, `reminders`, `content_logs`, `experiments`). String(36) ids, no RLS, all access by the backend's single DB login.
- `user_context.py` and `wellness_engine.py`: scoring, the "Wellness DNA", the monthly review, and the context fed to the AI (journal text included).
- `ai_service.py`: provider abstraction (Gemini default), crisis-keyword check, retries, JSON report generation.
- Alembic is configured but has **no `versions/` directory**, so `alembic upgrade head` creates nothing.
- Tests: 94 pytest functions that call a running server over HTTP (`TEST_BACKEND_URL` / `REACT_APP_BACKEND_URL`).

Issues for NEURIX:
1. Its identity system is separate: passwords stored in its own table, not Supabase Auth, so no `auth.uid()` and none of the RLS work applies.
2. Admin export dumps every user's mood, habit and assessment rows (hashed ids only) with no research-consent check.
3. Chat sends the user's journal text to the AI provider without a recorded `ai_processing` consent.
4. `get_current_user` turns every error into a 401, which hides database failures.
5. `SETUP_GUIDE.md` publishes a test login; `MindCast-Enhance/backend/mindcast.db` is a committed SQLite file (contents not opened; may contain data).

## C. Frontend-to-backend endpoint map

"UI" = the function is called by a page in this repo today.

| Frontend function | Endpoint | UI | Existing backend | NEURIX target | Gap |
|---|---|---|---|---|---|
| `authApi.signup` | `POST /auth/signup` | yes | custom users table | **Supabase Auth** `signUp` (client) | replace; backend endpoint removed |
| `authApi.login` | `POST /auth/login` | yes | custom JWT | Supabase Auth `signInWithPassword` | replace |
| `authApi.logout` | none (client only) | yes | — | `supabase.auth.signOut()` | replace |
| `authApi.getMe` | `GET /auth/me` | no | users row | `GET /api/me` → `profiles` + role | port |
| `dashboardApi.getStats` | `GET /dashboard/stats` | yes | aggregates | `mood_entries`, `habit_entries`, `journal_entries`, `assessment_results` | port |
| `moodApi.list/create` | `/mood-logs` | yes | `mood` label + 1–10 levels | `mood_entries` | **needs `mood_label` column**; energy/stress map to `energy_score`/`stress_score` |
| `habitLogsApi.list/create` | `/habit-logs` | yes | 8 fixed types + `unit` | `habit_entries` | **needs `unit` column** and a check for the 8 types |
| `journalApi.list/create` | `/journal-entries` | yes | `prompt`, `entry` | `journal_entries` | **needs `prompt` column**; `entry` → `entry_text`; id is bigint (frontend expects string, serialize) |
| `chatApi.getConversations` | `GET /conversations` | yes | flat message list | `ai_conversations` + `ai_messages` | port; one default conversation per user unless the UI adds threads |
| `chatApi.streamMessage` | `POST /chat` (SSE) | yes | Gemini stream | same, messages stored in `ai_messages` | port |
| `wellnessDnaApi.get` | `GET /wellness-dna` | yes | computed | computed from NEURIX tables | port |
| `monthlyReviewApi.get` | `GET /monthly-review` | yes | computed | computed | port |
| `userContextApi.get` | `GET /user/context` | yes | computed | computed | port |
| `experimentsApi.list/complete` | `/experiments` | yes | baseline/result/reflection | `wellness_experiments` | **needs `description`, `duration_days`, `baseline_data`, `result_data`, `reflection`, `completed_at`** |
| `experimentsApi.create` | `POST /experiments` | no | | | port |
| `insightsApi.getPatterns` | `GET /insights/patterns` | no | computed | computed | port |
| `askMyDataApi.ask` | `POST /ask-my-data` | no | AI over own data | same | port |
| `assessmentsApi.*` | `/assessments` | no | `{responses:[{question_id:int}]}` | `assessment_results` | **payload mismatch**: client sends a bare array with string ids |
| `wellnessToolkitApi.*` | `/wellness-toolkit` | no | `activity_type/name` | no table | **payload mismatch** (`toolkit_id`); needs table or drop |
| `remindersApi.*` | `/reminders` | no | `reminder_type/time/message` | `reminders` | **shape mismatch** (`title/time/enabled`) |
| `adminApi.getStats/export` | `/admin/*` | no | all users' data | admin + research consent | redesign |
| (none) | `/content-logs` | no | screen/content logs | no table | needs table |

## D. Missing functionality

Not present in any form today: medical records, medical history, document upload/download,
doctor directory and applications, doctor verification, doctor-patient connections,
per-category consent, consent history, doctor patient views, admin user and doctor
management, audit-log viewing, daily wellbeing logs, screen-time and digital behaviour
(beyond the unused content log), data export for patients, account deletion.

Required database additions (each a new migration, nothing dropped):

| # | Change | Why |
|---|---|---|
| 1 | `mood_entries.mood_label` (great/good/okay/low/struggling) | frontend contract |
| 2 | `habit_entries.unit`, check on the 8 habit types | frontend contract |
| 3 | `journal_entries.prompt` | frontend contract |
| 4 | experiment columns listed above | frontend contract |
| 5 | new `digital_activity_logs` (screen time, content type, platform, minutes, time of day) under a new `digital_behaviour` category | screen-time feature |
| 6 | **Sleep fix**: doctor policy on `daily_wellbeing_logs` requires `sleep_habits` as well as `lifestyle` whenever the row holds sleep values | category leak found in the DB report |
| 7 | **Doctor read audit**: remove the doctor branch from table RLS and the storage policy; doctors read through `SECURITY DEFINER` functions (`doctor_read_*`) that check consent and write an `audit_logs` row in the same transaction; document downloads via a backend-issued signed URL after the audit write | audit gap found in the DB report |
| 8 | dedicated login role `neurix_api` (`NOINHERIT`, member of `authenticated` only) | backend can only act as the user; a missed role switch fails closed |
| 9 | optional `toolkit_items` | only if the toolkit stays |

## E. Supabase integration design

- **Identity**: Supabase Auth only. The frontend uses `@supabase/supabase-js` for sign-up, login, refresh and logout and sends the Supabase access token as `Authorization: Bearer`. The custom `users` table, bcrypt code and `JWT_SECRET` go away.
- **JWT validation in FastAPI**: verify signature against the project's JWKS (`/auth/v1/.well-known/jwks.json`) or, if the project still uses the legacy shared secret, against it server-side. Check `exp`, `aud = authenticated` and `iss`; take the user id only from `sub`. Request bodies never carry a patient id.
- **Database access**: SQLAlchemy async over the Supavisor transaction pooler as `neurix_api`. Each request runs in one transaction that first executes `set local role authenticated` and `set_config('request.jwt.claims', <verified claims>, true)`. Every query therefore runs under the same RLS the 81 tests exercised. `neurix_api` has no table privileges of its own.
- **Service role**: kept only in Render env vars. Used for exactly two jobs: writing `ai_summaries` and issuing signed Storage URLs after an audited doctor check. Never sent to the browser or put in a `NEXT_PUBLIC_*` variable.
- **Storage**: patients upload with their own JWT through the Storage API (`<uid>/<file>`), then create the `health_records` row through the backend. Doctors never get bucket access directly.
- **AI**: Gemini stays server-side. The chat context is built only from the caller's own rows; journal text is included only after an `ai_processing` consent record exists.
- **Admin**: `admin_verify_doctor` / `admin_set_user_role` RPCs through backend routes; research export only covers patients with a `research` consent.

## F. Security and testing plan

Security checks, enforced in code and covered by tests:
- 401 for a missing, expired, wrongly signed or wrong-audience token.
- A patient id in a body or query string is ignored; ownership always comes from `sub`.
- A doctor read succeeds only if the doctor is verified, the connection is approved, and the grant is active and unexpired, and every successful read writes an audit row.
- Journal entries and AI chats are never readable by doctors.
- No service-role key in the frontend bundle (build check).
- CORS restricted to the deployed frontend origins.
- Rate limits on `/chat` and `/ask-my-data`.

Test layers:
1. Database: keep the 81-check rollback suite; extend it for migrations 1–9 above.
2. Backend unit: JWT verification with locally signed test tokens; endpoint handlers against a test database.
3. Backend integration: fictional users created through the Supabase Auth admin API, real HTTP calls, cleanup afterwards.
4. **Storage API**: real uploads and downloads with patient and doctor JWTs, including the forbidden cases, which the SQL tests could not cover.
5. End to end: Playwright against the Next.js app with the backend running.

## G. Ordered implementation plan

1. **Unblock**: get access to the repo Render deploys from (or confirm the zip is the source and pick a repo to hold it), and let this session reach the Render service for testing.
2. Put the backend under version control in that repo (no duplicate service).
3. Apply database migrations 1–8 and extend the SQL tests.
4. Backend core: settings, Supabase JWT dependency, RLS-scoped DB session, `/api/me`, health check.
5. Port the endpoints the UI uses today, keeping their response shapes: dashboard, mood, habits, journal, chat, conversations, Wellness DNA, monthly review, user context, experiments.
6. Frontend auth switch to `supabase-js`; remove the custom token storage.
7. New endpoints: medical records and history, documents, assessments, reminders, digital activity, doctor directory and applications, connections, consent, doctor patient views (audited), admin, audit log.
8. AI: chat context from NEURIX tables, consent gate, summaries written with the service role.
9. Tests (layers 2–5), then deploy to Render with the new env vars and CORS.
10. If the old database holds real users, migrate them (they must reset passwords or be imported through the Auth admin API).
