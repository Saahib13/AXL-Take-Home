# Current Event Millionaire

An AI-powered, web-based trivia game inspired by **Who Wants to Be a Millionaire**.

This project was built as a take-home assignment for an **AI Software Engineering** role. It combines a polished Next.js frontend with a Supabase-backed game state system and Gemini-powered question generation.

## What it does

The game lets a player:

- start a new session
- answer multiple-choice trivia questions
- progress through a prize ladder
- use lifelines:
  - **50:50**
  - **Ask the Host**
  - **Skip**
- recover their game state after refresh
- play through a full game using live backend routes

Questions are generated dynamically from a seeded dataset stored in Supabase. Gemini is used to generate:
- multiple-choice questions
- explanations
- host hints

## Tech stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase** (Postgres + session/question persistence)
- **Google Gemini API** via `@google/genai`
- **Zod** for runtime validation
- **Vitest** for engine tests
- **Vercel** for deployment

## How AI is used

Gemini plays a meaningful role in the product:

- generates one validated multiple-choice question from retrieved corpus context
- returns structured JSON that is validated with Zod
- generates short “Ask the Host” hints
- supports a dynamic, data-backed game experience rather than hardcoded questions

## How data is used

The game uses a Supabase table called `corpus_items` containing compact topic cards such as:

- title
- category
- difficulty
- summary
- supporting facts
- tags
- source label

The backend retrieves relevant rows by:
- category
- target difficulty
- exclusion of previously used corpus rows

This context is then passed to Gemini to generate a question grounded in the selected data.

## Dynamic behavior

The game adapts over time through:

- backend-selected category rotation
- difficulty progression based on game rules
- fresh question generation from a larger corpus
- persistent session state
- Gemini-generated hints and explanations

## Project structure

```txt
app/
  api/
    game/
  game/
components/
  game/
  ui/
data/
  corpus.json
lib/
  api/
  game/
  gemini/
  supabase/
scripts/
types/