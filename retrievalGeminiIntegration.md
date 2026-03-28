# Step 9: Create question generation + persistence service

We already have:
- `lib/game/engine.ts`
- `lib/game/getQuestionContext.ts`
- `lib/gemini/generateQuestion.ts`
- Supabase tables including `game_sessions` and `session_questions`
- `lib/supabase/service.ts`

Now build the orchestration service that creates and stores the next question for a session.

## Goal

Create:

- `lib/game/createQuestionForSession.ts`
- `scripts/test-create-question-for-session.ts`

This is the main service that combines:
- current session state
- engine rules
- corpus retrieval
- Gemini generation
- insert into `session_questions`

## Required exported function

Create something like:

```ts
export type CreatedSessionQuestion = {
  id: string
  sessionId: string
  questionNumber: number
  category: string
  difficulty: number
  prizeAmount: number
  questionText: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
  corpusItemIds: string[]
  hostHint: string | null
  isAnswered: boolean
  isSkipped: boolean
  createdAt: string
}

export async function createQuestionForSession(
  sessionId: string
): Promise<CreatedSessionQuestion>