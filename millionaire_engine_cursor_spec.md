# Millionaire Game Engine Spec (`lib/game/engine.ts`)

## Purpose
Build a **pure deterministic game engine** for the AI-powered Millionaire-style game.

This file must contain **no AI calls, no Supabase calls, no fetch calls, no database logic, no React code**.
It should be pure TypeScript business logic only.

The goal is to centralize all game rules on the backend so the frontend is only a renderer and Gemini is only a content generator.

---

## Why this file exists

The game has two different kinds of logic:

1. **Content generation logic**
   - Gemini writes questions, answer options, explanations, and host hints.
2. **Game truth / rules logic**
   - prize ladder
   - what question number the player is on
   - what winnings they have
   - whether they lost or won
   - which categories should be chosen next
   - which answers 50:50 removes
   - difficulty progression
   - milestone payouts

`engine.ts` is responsible only for the second kind.

This is important because:
- the frontend should not determine correctness or winnings
- Gemini should not decide game truth
- backend logic should be testable without any external dependencies

---

## File location

Create this file:

```ts
lib/game/engine.ts
```

Also create a test file if needed:

```ts
lib/game/engine.test.ts
```

If the repo uses another test layout, place the tests wherever the repo convention expects, but keep the implementation in `lib/game/engine.ts`.

---

## Core requirements

Implement all deterministic game rules in this file.

### Required constants
Create and export these constants:

```ts
export const PRIZE_LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000] as const;
export const TOTAL_QUESTIONS = 10;
```

Also create and export:

- `SAFE_MILESTONES`
- `DEFAULT_CATEGORIES`
- difficulty bounds such as `MIN_DIFFICULTY` and `MAX_DIFFICULTY`

Recommended values:

```ts
export const SAFE_MILESTONES = [1000, 8000] as const;
export const DEFAULT_CATEGORIES = [
  "AI",
  "Startups",
  "Internet Culture",
  "Technology History",
  "Current Events",
] as const;
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 3;
```

If a better safe milestone strategy is needed, document it clearly in comments.

---

## Types to create

Create explicit types to make the engine easy to use and hard to misuse.

Recommended types:

```ts
export type Category = (typeof DEFAULT_CATEGORIES)[number] | string;

export type GameStatus = "active" | "lost" | "won" | "abandoned";

export type AnswerOutcome = "correct" | "incorrect" | "skipped";

export type Difficulty = number;

export interface ComputeGameStatusInput {
  isCorrect: boolean;
  questionNumber: number;
}

export interface ComputeGameStatusResult {
  status: GameStatus;
  currentWinnings: number;
  guaranteedWinnings: number;
  nextQuestionNumber: number | null;
  didWinGame: boolean;
  didLoseGame: boolean;
}

export interface FiftyFiftyResult {
  keepIndexes: [number, number];
  removedIndexes: [number, number];
}

export interface AdvanceSessionInput {
  currentQuestionNumber: number;
  currentWinnings: number;
  correctCount: number;
  guaranteedWinnings: number;
  selectedIndex?: number | null;
  correctIndex: number;
  wasSkipped?: boolean;
}

export interface AdvanceSessionResult {
  outcome: AnswerOutcome;
  status: GameStatus;
  currentWinnings: number;
  guaranteedWinnings: number;
  nextQuestionNumber: number | null;
  correctCount: number;
  didWinGame: boolean;
  didLoseGame: boolean;
}
```

You may add additional small helper types if helpful.

---

## Functions to implement

Implement and export the following functions.

### 1. `getPrizeForQuestion(questionNumber)`

Purpose:
Return the prize amount for a given 1-indexed question number.

Rules:
- question numbers are 1 through `TOTAL_QUESTIONS`
- question 1 corresponds to `PRIZE_LADDER[0]`
- throw a clear error if the question number is out of range

Expected behavior examples:
- `getPrizeForQuestion(1) === 100`
- `getPrizeForQuestion(5) === 1000`
- `getPrizeForQuestion(10) === 32000`

---

### 2. `getGuaranteedWinnings(questionNumber)`

Purpose:
Return the guaranteed payout based on safe milestones already reached.

Rules:
- if player has not yet reached a safe milestone, return `0`
- if player has cleared the $1,000 level, guaranteed winnings become `1000`
- if player has cleared the $8,000 level, guaranteed winnings become `8000`
- this should be determined from the completed question number

Examples:
- before question 1 is answered: `0`
- after correctly answering question 5: `1000`
- after correctly answering question 8: `8000`
- after correctly answering question 10: still `8000` or final winnings logic handled separately depending on game state

---

### 3. `getNextDifficulty(correctCount, questionNumber)`

Purpose:
Compute the deterministic target difficulty for the next question.

Use a simple 3-level curve.

Recommended rule:
- questions 1–3 => difficulty 1
- questions 4–7 => difficulty 2
- questions 8–10 => difficulty 3

Then allow performance to gently influence it:
- if player has a strong streak, you may bump difficulty by 1 but never above max
- if player is struggling, you may keep the baseline or slightly reduce by 1 but never below min

Important:
- keep this deterministic
- keep the function simple enough to unit test
- difficulty must always remain between `MIN_DIFFICULTY` and `MAX_DIFFICULTY`

Document the exact rule in comments.

---

### 4. `pickNextCategory(previousCategories, availableCategories?)`

Purpose:
Choose the next category in a deterministic way that avoids boring repetition.

Inputs:
- `previousCategories: string[]`
- optional `availableCategories: string[]` defaulting to `DEFAULT_CATEGORIES`

Required behavior:
- avoid repeating the same category immediately if alternatives exist
- prefer categories that have been used least often so far
- if there is a tie, break it deterministically (alphabetical or original list order)
- never rely on `Math.random()`

Suggested algorithm:
1. count category usage in `previousCategories`
2. find the minimum count among available categories
3. build a list of least-used categories
4. remove the immediately previous category if other least-used choices exist
5. return the first valid category by original list order

Examples:
- if previous categories are `[]`, return the first category in default order
- if previous categories are `["AI"]`, do not return `"AI"` if another category exists
- if all categories have been used equally, rotate by list order

---

### 5. `applyFiftyFifty(correctIndex)`

Purpose:
Compute which two answer indexes remain visible when the player uses the 50:50 lifeline.

Rules:
- answers are always indexes `0, 1, 2, 3`
- exactly one correct answer must remain
- exactly one incorrect answer must remain
- exactly two incorrect answers must be removed
- result must be deterministic
- do not use randomness

Suggested deterministic approach:
- keep the correct index
- keep the lowest-numbered incorrect index that is not the correct one
- remove the remaining two incorrect indexes
- return indexes in ascending order

Example:
- `correctIndex = 2`
- incorrect indexes are `[0, 1, 3]`
- keep `[0, 2]`
- remove `[1, 3]`

Return type should clearly identify kept vs removed indexes.

---

### 6. `computeAnswerOutcome(selectedIndex, correctIndex, wasSkipped?)`

Purpose:
Return whether the answer was correct, incorrect, or skipped.

Rules:
- if `wasSkipped === true`, outcome must be `"skipped"`
- otherwise compare selected index to correct index
- validate that indexes are in range `0..3`

---

### 7. `computeGameStatus({ isCorrect, questionNumber })`

Purpose:
Given the current question result, compute whether the session stays active, is lost, or is won.

Rules:
- `questionNumber` is the number just answered
- if answer is incorrect => status `lost`
- if answer is correct and questionNumber is less than `TOTAL_QUESTIONS` => status `active`
- if answer is correct and questionNumber equals `TOTAL_QUESTIONS` => status `won`
- return winnings and next question info in a structured result

Recommended result contents:
- `status`
- `currentWinnings`
- `guaranteedWinnings`
- `nextQuestionNumber`
- `didWinGame`
- `didLoseGame`

Behavior:
- on incorrect answer, `currentWinnings` should fall back to guaranteed winnings
- on correct answer, `currentWinnings` becomes the prize for the answered question
- on win, `currentWinnings` becomes the final prize level

---

### 8. `advanceSessionFromAnswer(input)`

Purpose:
Provide one high-level deterministic function that applies answer outcome and updates session state.

This is the function the backend can call after an answer submission.

Inputs:
- current question number
- current winnings
- correct count
- guaranteed winnings
- selected index
- correct index
- optional skip flag

Behavior:
- compute answer outcome
- compute game status
- update correct count if needed
- update guaranteed winnings if milestone reached
- return a complete deterministic result object

Rules:
- if skipped:
  - status remains `active` unless skipping happens on an invalid state
  - question count advances if not already at max
  - winnings do not increase
  - correct count does not increase
- if correct:
  - winnings increase to that question’s prize
  - correct count increments
- if incorrect:
  - status becomes `lost`
  - winnings fall back to guaranteed winnings

This function should not know anything about the database.

---

## Validation and edge cases

The engine must be defensive and explicit.

Add validations for:
- out-of-range question numbers
- prize ladder length not matching total questions
- invalid correct indexes
- invalid selected indexes
- empty category lists
- malformed safe milestone assumptions

Throw clear errors with helpful messages.

Examples:
- `Invalid question number: 0`
- `correctIndex must be between 0 and 3`
- `availableCategories must not be empty`

---

## Determinism rules

These are strict requirements.

### Do:
- use stable list order
- use counting logic
- use min/max clamps
- use pure helper functions

### Do not:
- use `Math.random()`
- use current time
- use environment variables
- call external APIs
- access Supabase
- import React or Next.js modules

The engine must always return the same output for the same input.

---

## Suggested implementation structure

Cursor should organize the file roughly like this:

1. exported constants
2. exported types
3. small private validation helpers
4. small private helper functions
5. exported core functions
6. optional final `assertEngineInvariants()` helper if useful

Recommended helpers:
- `assertValidQuestionNumber(questionNumber)`
- `assertValidAnswerIndex(index, fieldName)`
- `clampDifficulty(value)`
- `getBaseDifficultyForQuestion(questionNumber)`
- `countCategoryUsage(previousCategories, availableCategories)`

---

## Tests to create

Create unit tests for the engine.

Minimum test coverage should include:

### `getPrizeForQuestion`
- returns correct prize for 1
- returns correct prize for 10
- throws on 0
- throws on 11

### `getGuaranteedWinnings`
- returns 0 before first milestone
- returns 1000 after question 5
- returns 8000 after question 8

### `getNextDifficulty`
- early question returns 1
- middle question returns 2
- late question returns 3
- values never go below min or above max

### `pickNextCategory`
- returns first default category when history empty
- avoids immediate repeat when alternative exists
- prefers least-used category
- behaves deterministically for tied counts

### `applyFiftyFifty`
- always keeps correct answer
- always keeps exactly one wrong answer
- always removes exactly two wrong answers
- returns deterministic indexes for every possible correctIndex 0..3

### `computeAnswerOutcome`
- returns correct
- returns incorrect
- returns skipped

### `computeGameStatus`
- correct non-final answer => active
- incorrect answer => lost
- correct final answer => won
- incorrect answer uses guaranteed winnings fallback

### `advanceSessionFromAnswer`
- correct answer increments winnings and count
- incorrect answer falls back to guaranteed winnings
- skip does not increment winnings or correct count
- final correct answer sets status to won

---

## Function behavior expectations

### Winnings model
Use this exact interpretation:
- question numbers are 1-indexed
- if question 3 is answered correctly, current winnings become the prize at index 2
- if the player later loses, winnings fall back to the highest safe milestone already reached

### Safe milestone interpretation
Using the default prize ladder:
- question 5 => safe milestone of $1,000
- question 8 => safe milestone of $8,000

### Category behavior
Keep category selection deterministic and non-repetitive.
This logic exists so the game feels varied even before the DB query layer is added.

### Difficulty behavior
Keep difficulty simple.
Do not invent an overcomplicated adaptive system.
A modest, deterministic, testable curve is better.

---

## Anti-overengineering rules

Cursor must not:
- add classes unless absolutely necessary
- add database code
- add HTTP handlers
- add AI SDK calls
- add React hooks
- add persistent state logic
- add analytics
- add randomness
- add feature flags

This file is only the deterministic game engine.

---

## Expected exports

By the end, `lib/game/engine.ts` should export at least:

```ts
PRIZE_LADDER
TOTAL_QUESTIONS
SAFE_MILESTONES
DEFAULT_CATEGORIES
MIN_DIFFICULTY
MAX_DIFFICULTY
getPrizeForQuestion
getGuaranteedWinnings
getNextDifficulty
pickNextCategory
applyFiftyFifty
computeAnswerOutcome
computeGameStatus
advanceSessionFromAnswer
```

It may export additional useful types.

---

## Acceptance criteria

This task is complete when:

1. `lib/game/engine.ts` exists
2. the file contains only deterministic pure logic
3. all required functions are implemented and exported
4. the code is clean, typed, and commented where needed
5. unit tests exist and pass
6. no external services are required to test it

---

## Cursor task instruction

Build `lib/game/engine.ts` now according to this spec.

Requirements:
- use TypeScript
- keep functions pure
- add input validation
- add unit tests
- use clear names and small helper functions
- prefer simple, explicit logic over clever abstractions
- do not implement DB or AI code

After implementation, summarize:
- what functions were created
- what assumptions were made
- what tests were added
- any suggested follow-up integration points for the API layer
