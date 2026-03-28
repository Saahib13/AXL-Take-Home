# Step 8: Build Supabase retrieval for question context

We already have:
- a deterministic game engine in `lib/game/engine.ts`
- a working Gemini question generator in `lib/gemini/generateQuestion.ts`
- a `corpus_items` table in Supabase

Now build the retrieval layer that fetches compact context rows for Gemini.

## Goal

Create:

- `lib/game/getQuestionContext.ts`
- `scripts/test-get-question-context.ts`

This module must be server-side only and must not call Gemini.

## Purpose

Given:
- a target category
- a target difficulty
- a list of already-used corpus item IDs

fetch 3 to 5 usable context rows from `corpus_items`.

The retrieval must:
- prefer exact category and exact difficulty
- avoid duplicates already used in the session
- fallback gracefully if too few exact matches exist
- return compact structured items suitable for `generateQuestion()`

## Required function

Create something like:

```ts id="p6layv"
export type RetrievedContextItem = {
  id: string
  title: string
  category: string
  difficulty: number
  summary: string
  fact_1?: string | null
  fact_2?: string | null
  fact_3?: string | null
  tags?: string[] | null
  source_label?: string | null
}

export async function getQuestionContext(input: {
  category: string
  difficulty: number
  excludeIds?: string[]
  limit?: number
}): Promise<RetrievedContextItem[]>