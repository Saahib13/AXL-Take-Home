# AXL Take-Home Build Spec — AI-Powered Millionaire

## Goal
Build a playable web app inspired by **Who Wants to Be a Millionaire?** that feels complete within a short take-home scope.

Working title: **Current Event Millionaire**

Core idea:
- Familiar game loop: question -> 4 answers -> prize ladder -> lifelines -> finish screen
- AI is central: Gemini generates retrieval-grounded questions, explanations, and adaptive difficulty
- Data is meaningful: questions come from a Supabase-backed corpus, not a tiny hardcoded list
- Dynamic behavior exists: the game adapts to user performance, and optionally includes one fresh “Today” question

---

## Product framing
This should feel like a **thoughtful prototype**, not a giant project.

Target audience:
- curious students
- startup / tech-interested users
- recruiters evaluating product thinking

Tone:
- clean
- polished
- slightly game-show dramatic
- responsive and fast

What matters most:
1. The app works end-to-end
2. AI is clearly necessary to the experience
3. The dataset clearly drives gameplay
4. The UX feels intentional
5. The scope looks disciplined

---

## Scope to build

### Must-have
- Landing page
- Start game button
- 10-question game loop
- 4 answer choices per question
- Prize ladder sidebar
- 3 lifelines:
  - 50/50
  - Ask the Host
  - Skip
- Final score / result screen
- Supabase-backed corpus
- Gemini-generated question + explanation
- Difficulty adaptation across the session
- Public Vercel deployment

### Nice-to-have if time remains
- One “Today’s Bonus” grounded on fresh information
- Category badges
- Answer reveal animation
- Session history / leaderboard
- Sound effects

### Explicitly skip
- Authentication
- Multiplayer
- complicated admin dashboards
- perfect anti-cheat
- overly complex ingestion pipelines
- long-term analytics infrastructure

---

## Recommended stack
- **Frontend / full stack:** Next.js (App Router) + TypeScript
- **Hosting:** Vercel
- **UI generation:** v0 for layout + components, then refine manually
- **Database:** Supabase Postgres
- **AI:** Gemini API
- **Styling:** Tailwind + shadcn/ui
- **Validation:** Zod

Why this stack:
- fast to scaffold
- easy to deploy
- easy to explain in the write-up
- good fit for vibe coding with Cursor / Codex

---

## High-level architecture

```text
User
  -> Next.js frontend
  -> /api/game/start
  -> Supabase creates session
  -> /api/game/question
      -> fetch candidate corpus rows from Supabase
      -> send context to Gemini
      -> Gemini returns strict JSON question object
      -> save question to session
  -> user answers
  -> /api/game/answer
      -> validate answer against saved question
      -> update score / difficulty / session state
      -> return explanation + next state
  -> optional /api/game/host-hint
      -> Gemini returns short host-style hint
  -> optional /api/game/today-bonus
      -> Gemini grounded on fresh web/search info
```

---

## Core gameplay design

### Main loop
1. User starts a session
2. App selects target difficulty based on question index and recent performance
3. Backend retrieves relevant corpus items from Supabase
4. Gemini creates one multiple-choice question in a strict JSON schema
5. Frontend renders question and answers
6. User answers or uses a lifeline
7. Backend scores the answer and returns:
   - correct / incorrect
   - explanation
   - updated prize amount
   - next difficulty
8. Repeat until 10 questions or failure
9. Show results page

### Prize ladder example
1. $100
2. $200
3. $300
4. $500
5. $1,000
6. $2,000
7. $4,000
8. $8,000
9. $16,000
10. $32,000

Keep the numbers simple. The point is the progression, not realism.

---

## How AI is actually meaningful

AI should not just “chat.” It should do jobs that would be annoying to hardcode.

### AI responsibilities
1. **Generate high-quality questions** from retrieved corpus context
2. **Write plausible distractors** that are close but clearly wrong
3. **Explain the answer** in one short useful paragraph
4. **Adapt difficulty** by following target difficulty instructions
5. **Power Ask the Host lifeline** with a non-spoiler hint
6. **Optionally create one fresh grounded bonus question** based on current information

### What AI should NOT do
- own the entire game state
- decide score logic
- decide whether the user was correct after the fact if you already know the answer index
- store memory directly

Game state should stay deterministic in your backend.

---

## Data strategy

This is where many take-homes get weak. You need the dataset to matter.

### Recommended corpus theme
Use a themed but broad corpus such as:
- AI concepts
- major tech companies
- startup terminology
- famous products
- internet culture
- notable founders
- major computing milestones
- Toronto / Canada tech references

This is aligned with AXL’s vibe and makes the app feel tailored.

### Easiest practical corpus approach
Seed Supabase with a JSON dataset of **300–1000 topic cards**.

Each card can include:
- title
- category
- difficulty_hint
- short factual summary
- tags
- source label

Example record:
```json
{
  "title": "Y Combinator",
  "category": "startups",
  "difficulty_hint": 2,
  "summary": "Y Combinator is a startup accelerator known for funding early-stage companies such as Airbnb, Stripe, and Dropbox.",
  "tags": ["accelerator", "venture", "silicon valley"],
  "source_label": "seed_corpus"
}
```

### Why this is enough
- It is non-trivial data
- It influences every question
- It supports filtering by category and difficulty
- It is easy to explain
- It avoids overbuilding ingestion pipelines during the take-home

### Dynamic behavior options
Use at least one of these:

#### Option A — easiest and recommended
**Adapt to user behavior**
- if user gets 2 correct in a row, increase difficulty
- if user misses, decrease or stabilize difficulty
- if user struggles in one category, avoid repeating it immediately

#### Option B — extra polish
**Today’s bonus question**
- one extra round that uses a fresh Gemini-grounded question based on current information
- keep it clearly marked as bonus so it does not break the core game if it fails

Best approach: do **A for sure**, then add **B if time permits**.

---

## Supabase schema

### Table: `corpus_items`
Purpose: stores seed knowledge used to generate questions.

Suggested columns:
- `id uuid primary key`
- `title text not null`
- `category text not null`
- `difficulty_hint int not null default 1`
- `summary text not null`
- `tags text[] default '{}'`
- `source_label text`
- `created_at timestamptz default now()`

### Table: `game_sessions`
Purpose: stores one game run.

Suggested columns:
- `id uuid primary key`
- `status text not null` (`active`, `won`, `lost`, `abandoned`)
- `question_index int not null default 0`
- `score int not null default 0`
- `difficulty_level int not null default 1`
- `correct_streak int not null default 0`
- `used_fifty_fifty boolean not null default false`
- `used_ask_host boolean not null default false`
- `used_skip boolean not null default false`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### Table: `session_questions`
Purpose: stores the actual generated questions tied to a session.

Suggested columns:
- `id uuid primary key`
- `session_id uuid references game_sessions(id) on delete cascade`
- `question_index int not null`
- `category text not null`
- `difficulty int not null`
- `question_text text not null`
- `option_a text not null`
- `option_b text not null`
- `option_c text not null`
- `option_d text not null`
- `correct_index int not null`
- `explanation text not null`
- `corpus_context jsonb not null`
- `created_at timestamptz default now()`

### Table: `session_answers`
Purpose: stores player answers and outcomes.

Suggested columns:
- `id uuid primary key`
- `session_id uuid references game_sessions(id) on delete cascade`
- `question_id uuid references session_questions(id) on delete cascade`
- `selected_index int`
- `is_correct boolean`
- `used_fifty_fifty boolean not null default false`
- `used_ask_host boolean not null default false`
- `used_skip boolean not null default false`
- `answered_at timestamptz default now()`

---

## File structure

```text
app/
  page.tsx
  game/
    [sessionId]/page.tsx
  results/
    [sessionId]/page.tsx
  api/
    game/
      start/route.ts
      question/route.ts
      answer/route.ts
      lifeline-host/route.ts
      lifeline-fifty-fifty/route.ts
      lifeline-skip/route.ts
      today-bonus/route.ts   # optional
components/
  game/
    question-card.tsx
    answer-grid.tsx
    prize-ladder.tsx
    lifelines.tsx
    host-panel.tsx
    game-header.tsx
lib/
  supabase/
    client.ts
    server.ts
  gemini/
    question-schema.ts
    generate-question.ts
    host-hint.ts
    today-bonus.ts
  game/
    prize-ladder.ts
    difficulty.ts
    session.ts
    scoring.ts
scripts/
  seed-corpus.ts
supabase/
  migrations/
```

---

## API workflow details

## 1) Start game
### `POST /api/game/start`
Creates a new `game_sessions` row.

Response:
```json
{
  "sessionId": "uuid"
}
```

Frontend action:
- create session
- redirect to `/game/[sessionId]`

---

## 2) Generate next question
### `POST /api/game/question`
Input:
```json
{
  "sessionId": "uuid"
}
```

Backend steps:
1. load session
2. determine target difficulty
3. query Supabase for 5–12 relevant corpus items matching category/difficulty band
4. send compact context to Gemini
5. ask Gemini for one strict JSON object
6. validate with Zod
7. persist to `session_questions`
8. return question payload

Response example:
```json
{
  "questionId": "uuid",
  "questionIndex": 3,
  "category": "AI Concepts",
  "difficulty": 2,
  "questionText": "Which term refers to retrieving relevant external information before generating a model response?",
  "options": [
    "Gradient clipping",
    "Retrieval-augmented generation",
    "Beam normalization",
    "Quantization-aware training"
  ]
}
```

---

## 3) Submit answer
### `POST /api/game/answer`
Input:
```json
{
  "sessionId": "uuid",
  "questionId": "uuid",
  "selectedIndex": 1
}
```

Backend steps:
1. load saved question
2. compare `selectedIndex` to `correct_index`
3. write row to `session_answers`
4. update session score, streak, difficulty, status
5. return correctness + explanation + next state

Response example:
```json
{
  "isCorrect": true,
  "correctIndex": 1,
  "explanation": "RAG retrieves external context before generation so the model can answer using grounded information.",
  "score": 500,
  "nextQuestionIndex": 4,
  "status": "active"
}
```

---

## 4) Lifeline: 50/50
### `POST /api/game/lifeline-fifty-fifty`
Simplest implementation:
- backend already knows correct answer
- randomly remove two wrong options
- save usage flag in session
- return indices to hide

Do not use AI for this. Keep it deterministic.

---

## 5) Lifeline: Ask the Host
### `POST /api/game/lifeline-host`
Input:
```json
{
  "sessionId": "uuid",
  "questionId": "uuid"
}
```

Backend steps:
1. load saved question and explanation
2. ask Gemini to provide a short host-style hint
3. do **not** allow full answer reveal
4. save usage flag

Example result:
```json
{
  "hint": "I’d focus on the option that describes bringing outside knowledge into the model before it answers."
}
```

---

## 6) Lifeline: Skip
### `POST /api/game/lifeline-skip`
Simplest implementation:
- mark current question as skipped
- award no extra points
- move to next question
- save usage flag

---

## 7) Optional today bonus
### `POST /api/game/today-bonus`
This is optional polish.

Backend steps:
1. ask Gemini for one multiple-choice question grounded on fresh information
2. validate schema
3. display citation snippets or source labels if available

Make sure this is clearly separate from the core game so failure here doesn’t break the demo.

---

## Difficulty system
Keep this simple and deterministic.

### Suggested rule
- Questions 1–3 -> base difficulty 1
- Questions 4–6 -> base difficulty 2
- Questions 7–8 -> base difficulty 3
- Questions 9–10 -> base difficulty 4

Then adapt based on performance:
- if `correct_streak >= 2`, increase by 1 up to max 5
- if last answer was wrong, reduce by 1 down to min 1

This is enough to claim dynamic behavior based on user actions.

---

## Gemini schema design
Use structured output so generation stays reliable.

### Zod shape
```ts
import { z } from "zod";

export const QuestionSchema = z.object({
  category: z.string(),
  difficulty: z.number().int().min(1).max(5),
  questionText: z.string().min(10),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(20),
  sourceTitles: z.array(z.string()).min(1),
});
```

### Question generation prompt skeleton
```text
You are generating one multiple-choice question for a web game inspired by Who Wants to Be a Millionaire.

Rules:
- Output valid JSON only matching the required schema.
- Use only the provided context.
- Write a question appropriate for difficulty {difficulty} out of 5.
- Include exactly 4 answer options.
- Exactly one option must be correct.
- Wrong answers should be plausible but clearly incorrect.
- Avoid ambiguity.
- The explanation must be concise and directly justify the correct answer.
- Do not mention the context block explicitly.

Target category: {category}

Context:
{retrieved_context}
```

### Host hint prompt skeleton
```text
You are the host of an AI-themed game show.

Given the saved question, answer choices, and explanation, provide one short hint.
Rules:
- Do not reveal the exact answer.
- Sound confident and entertaining.
- 1-2 sentences max.
```

---

## Retrieval strategy
Do not over-engineer vector search unless you have time.

### Fastest version
Use normal SQL filtering:
- filter by category
- filter by `difficulty_hint` within a band
- randomize a few rows
- concatenate summaries into context

This is enough for the take-home.

### Slightly stronger version
Add embeddings later if needed:
- embed summaries
- query nearest neighbors by category prompt
- use top-k rows as context

But this is optional. The assignment only needs meaningful data use, not a production RAG stack.

---

## UX / screen design

## 1) Landing page
Elements:
- title: Current Event Millionaire
- short one-line description
- start game button
- tiny note: “AI-generated questions from a live knowledge corpus”

## 2) Game screen
Layout:
- top bar with title and current question number
- center question card
- 2x2 answer grid
- right sidebar prize ladder
- lifeline row below or above answers
- compact host panel for hints/explanations

## 3) Reveal state
After answer:
- highlight selected option
- mark correct option
- show short explanation
- button: Continue

## 4) Results screen
Show:
- final prize
- simple summary
- optional performance insight:
  - strongest category
  - hardest question level reached
- play again button

---

## v0 prompt for initial UI scaffold
Use this in v0 first:

```text
Build a polished Next.js game show interface for a web app called “Current Event Millionaire”.

Requirements:
- dark premium game-show aesthetic
- responsive layout
- landing page with hero section and Start Game button
- main game screen with:
  - large centered question card
  - four answer buttons in a 2x2 grid
  - right sidebar prize ladder with 10 levels
  - row of three lifeline buttons: 50/50, Ask the Host, Skip
  - small host hint / explanation panel
- results screen with score, summary, and play again button
- use shadcn/ui and Tailwind
- keep components modular and production-looking
- no fake chat UI
- no unnecessary filler text
```

Then manually refine the generated code.

---

## Cursor / Codex master implementation prompt
Paste this after your repo is set up:

```md
You are helping me build a take-home assignment in a Next.js App Router TypeScript project.

Project:
A playable web app inspired by Who Wants to Be a Millionaire called Current Event Millionaire.

Core requirements:
- deployed on Vercel
- Supabase for database
- Gemini API for structured question generation
- clean responsive UI
- 10-question game loop
- 4 answer choices
- prize ladder
- lifelines: 50/50, Ask the Host, Skip
- final results page
- AI must be meaningful
- data corpus must be meaningful
- game must adapt based on user performance

Build constraints:
- keep the architecture simple
- no auth
- no multiplayer
- no overbuilt admin panel
- deterministic backend game state
- AI should generate questions and hints, not own the session logic

Please implement in this order:
1. create Supabase schema and migration files
2. create seed script for corpus_items
3. create lib utilities for Supabase and Gemini
4. create POST /api/game/start
5. create POST /api/game/question
6. create POST /api/game/answer
7. create lifeline endpoints
8. create landing page
9. create game page
10. create results page
11. add basic loading and error states
12. keep code clean, typed, and modular

Important implementation rules:
- use Zod to validate all Gemini outputs
- use server-side routes for Gemini calls
- do not expose API keys client-side
- create reusable UI components
- comment only where useful
- avoid unnecessary abstractions
- prefer straightforward code that I can explain in an interview

When generating code:
- tell me exactly which files you are creating or editing
- for schema changes, provide SQL or migration files
- do not break existing files unnecessarily
- keep the UI polished but not overly flashy
```

---

## Recommended build order (3-hour realistic flow)

### Phase 1 — scaffold (30–45 min)
- create Next.js app
- connect repo to Vercel
- scaffold UI in v0
- install Supabase + Zod + Gemini SDK

### Phase 2 — backend core (45–60 min)
- create tables
- seed corpus
- implement start/question/answer endpoints
- validate Gemini output

### Phase 3 — frontend gameplay (45–60 min)
- wire landing page
- wire session page
- wire answer flow
- wire prize ladder and results page

### Phase 4 — polish (20–30 min)
- lifelines
- loading states
- animations
- deploy and test
- write one-page summary

---

## What to say in the write-up
Keep the write-up crisp.

Suggested structure:

### 1. What it is
Current Event Millionaire is a web-based trivia game inspired by Who Wants to Be a Millionaire. It uses Gemini to generate multiple-choice questions and explanations from a Supabase-backed corpus of tech, AI, and startup knowledge.

### 2. How AI is used
Gemini is used for structured question generation, plausible distractor creation, concise explanations, and the Ask the Host lifeline. This makes AI central to the game experience rather than a cosmetic add-on.

### 3. How data is used
The app uses a seeded corpus stored in Supabase. Each question is generated from retrieved corpus context, so the underlying data materially affects gameplay.

### 4. Dynamic behavior
The game adapts question difficulty based on player performance. Optionally, a bonus round can use fresh grounded information.

### 5. Key decisions
I chose a familiar game-show format so I could focus my limited time on product quality, AI integration, and scoped end-to-end execution.

---

## Key tradeoffs to be ready to explain
- I chose a familiar game format to maximize polish in limited time
- I kept state deterministic on the backend instead of letting the model manage everything
- I used structured output to reduce brittle parsing
- I used a seeded corpus instead of a fully automated ingestion pipeline for reliability
- I made dynamic behavior user-performance-based first, then treated current-events grounding as optional polish

---

## Failure cases to handle
- Gemini returns invalid JSON -> retry once, else show graceful error
- no corpus rows found -> fallback to a broader category query
- duplicate question -> detect with session question history and regenerate
- user refreshes page -> load current session state from backend
- API timeout -> show retry button

---

## Minimal acceptance checklist
- [ ] landing page works
- [ ] game can start
- [ ] question renders from backend
- [ ] answer submission works
- [ ] score updates
- [ ] prize ladder updates
- [ ] lifelines work
- [ ] results screen works
- [ ] app deployed publicly
- [ ] repo has README with setup
- [ ] short write-up completed

---

## Strong recommendation
If time gets tight:
1. keep the core game working
2. keep the UI polished
3. keep Gemini structured output reliable
4. keep the write-up sharp
5. skip anything fancy that does not improve the demo

A clean, deployed, well-scoped project will beat a half-finished ambitious one.
