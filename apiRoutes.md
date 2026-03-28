# Step 10: Build the API routes for the playable backend

We already have:
- `lib/game/engine.ts`
- `lib/game/getQuestionContext.ts`
- `lib/gemini/generateQuestion.ts`
- `lib/game/createQuestionForSession.ts`
- Supabase tables:
  - `game_sessions`
  - `session_questions`
  - `session_events` (optional)
- `lib/supabase/service.ts`

Now build the API routes in Next.js App Router so the game can be played via HTTP only.

## Route order to implement

Implement in this exact order:

1. `POST /api/game/start`
2. `GET /api/game/[sessionId]`
3. `POST /api/game/[sessionId]/answer`
4. `POST /api/game/[sessionId]/next`
5. `POST /api/game/[sessionId]/lifeline/fifty-fifty`
6. `POST /api/game/[sessionId]/lifeline/ask-host`
7. `POST /api/game/[sessionId]/lifeline/skip`

## File structure

Create:

- `app/api/game/start/route.ts`
- `app/api/game/[sessionId]/route.ts`
- `app/api/game/[sessionId]/answer/route.ts`
- `app/api/game/[sessionId]/next/route.ts`
- `app/api/game/[sessionId]/lifeline/fifty-fifty/route.ts`
- `app/api/game/[sessionId]/lifeline/ask-host/route.ts`
- `app/api/game/[sessionId]/lifeline/skip/route.ts`

You may also create small shared helpers if needed, for example:

- `lib/game/getSessionState.ts`
- `lib/game/getLatestQuestion.ts`
- `lib/gemini/generateHostHint.ts`

Keep helpers small and server-only.

## Constraints

- server-side only
- use service-role Supabase client
- no React/client code in route handlers
- do not move engine logic into routes
- keep routes thin and deterministic where possible
- use Zod for request validation if useful
- use `NextResponse.json(...)`
- return clear 4xx/5xx errors

## Shared conventions

### Session convention
- `game_sessions.current_question_number` starts at `0` when session is created
- after a new question is created, the route updates it to that question number
- `createQuestionForSession()` itself does not need to update `game_sessions`

### Latest question convention
For a session, “latest question” means highest `question_number`.

### Active question convention
An active question is:
- `is_answered === false`
- `is_skipped === false`

### Winnings convention
The API persists:
- `status`
- `current_winnings`
- `correct_count`
- `current_question_number`
- used lifeline booleans

Do not introduce new gameplay rules here.

### Prize ladder
Use the engine constant `PRIZE_LADDER` for responses.

## Route 1: POST /api/game/start

### Behavior
- Create a new `game_sessions` row:
  - `status = 'active'`
  - `current_question_number = 0`
  - `current_winnings = 0`
  - `correct_count = 0`
  - `used_fifty_fifty = false`
  - `used_ask_host = false`
  - `used_skip = false`
- Call `createQuestionForSession(sessionId)`
- Update `game_sessions.current_question_number` to the created question number
- Return:
  - `sessionId`
  - `question`
  - `prizeLadder`
  - `lifelines`

### Response shape
Return something like:

```ts
{
  sessionId: string
  question: {
    id: string
    questionNumber: number
    category: string
    difficulty: number
    prizeAmount: number
    questionText: string
    options: [string, string, string, string]
    isAnswered: false
    isSkipped: false
  }
  prizeLadder: number[]
  lifelines: {
    fiftyFiftyAvailable: boolean
    askHostAvailable: boolean
    skipAvailable: boolean
  }
}