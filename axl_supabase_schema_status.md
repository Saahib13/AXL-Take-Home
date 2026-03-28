# Supabase Schema Status for Cursor

The database schema has already been created in Supabase for the AXL take-home project.

## Completed tables

### 1. `public.corpus_items`
Purpose: stores the knowledge corpus used to generate millionaire-style questions.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `title text not null`
- `category text not null`
- `difficulty integer not null default 1`
- `summary text not null`
- `fact_1 text`
- `fact_2 text`
- `fact_3 text`
- `tags text[]`
- `source_label text`
- `source_url text`
- `is_current boolean default false`
- `created_at timestamptz default now()`

### 2. `public.game_sessions`
Purpose: stores one playthrough / game session.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `status text not null`
- `current_question_number integer default 0`
- `current_winnings integer default 0`
- `correct_count integer default 0`
- `used_fifty_fifty boolean default false`
- `used_ask_host boolean default false`
- `used_skip boolean default false`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Notes:
- `status` is constrained to: `active`, `lost`, `won`, `abandoned`
- an `updated_at` trigger already exists and updates automatically on row changes

### 3. `public.session_questions`
Purpose: stores each generated question for a session and the answer state.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `session_id uuid not null references public.game_sessions(id) on delete cascade`
- `question_number integer not null`
- `category text not null`
- `difficulty integer not null`
- `corpus_item_ids uuid[]`
- `question_text text not null`
- `options jsonb not null`
- `correct_index integer not null`
- `explanation text not null`
- `host_hint text`
- `is_answered boolean default false`
- `is_skipped boolean default false`
- `selected_index integer`
- `is_correct boolean`
- `created_at timestamptz default now()`

Notes:
- `options` is constrained to be a JSON array
- `correct_index` is constrained to `0..3`
- `selected_index` is nullable but must also be `0..3` when present
- `(session_id, question_number)` is unique
- a row cannot be both answered and skipped

### 4. `public.session_events`
Purpose: optional audit trail for debugging and lightweight analytics.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `session_id uuid not null references public.game_sessions(id) on delete cascade`
- `event_type text not null`
- `payload jsonb`
- `created_at timestamptz default now()`

## Other completed database setup

### Extensions
- `pgcrypto` is enabled for `gen_random_uuid()`

### Trigger function
- `public.set_updated_at()` exists
- trigger `trg_game_sessions_set_updated_at` exists on `public.game_sessions`

### Indexes created
Indexes were added on the main lookup fields, including category, difficulty, current status, and session relationships.

## Important implementation notes for Cursor

- The schema is already present; do **not** recreate or rename these tables.
- Use these exact table names:
  - `corpus_items`
  - `game_sessions`
  - `session_questions`
  - `session_events`
- Backend game state truth should live on the server.
- The frontend should never know the correct answer until after the user submits.
- `options` in `session_questions` should be treated as a JSON array of four strings.
- `question_number` should increment from 1 upward.
- `session_questions` should be inserted by backend logic after generating a question from Gemini.
- `session_events` is optional for runtime use, but available if logging is helpful.

## What should be built next

1. Seed `corpus_items` with a non-trivial dataset.
2. Create server-side Supabase clients.
3. Build a deterministic game engine module.
4. Build the Gemini structured-question generator.
5. Build the API routes:
   - `POST /api/game/start`
   - `GET /api/game/[sessionId]`
   - `POST /api/game/[sessionId]/answer`
   - `POST /api/game/[sessionId]/next`
   - `POST /api/game/[sessionId]/lifeline/fifty-fifty`
   - `POST /api/game/[sessionId]/lifeline/ask-host`
   - `POST /api/game/[sessionId]/lifeline/skip`
6. Connect the frontend after the backend game loop works.

## Assumptions currently in place

- RLS has not been configured yet.
- The app is expected to use trusted server-side routes with `SUPABASE_SERVICE_ROLE_KEY`.
- Vercel + Next.js App Router + Gemini + Supabase remain the target stack.
