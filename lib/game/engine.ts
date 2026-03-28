/**
 * Pure deterministic Millionaire-style game rules.
 * No I/O, randomness, time, DB, or AI.
 */

export const PRIZE_LADDER = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000,
] as const;

export const TOTAL_QUESTIONS = 10;

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

function assertPrizeLadderLength(): void {
  if (PRIZE_LADDER.length !== TOTAL_QUESTIONS) {
    throw new Error(
      `PRIZE_LADDER length ${PRIZE_LADDER.length} must equal TOTAL_QUESTIONS ${TOTAL_QUESTIONS}`
    );
  }
}

assertPrizeLadderLength();

export function assertValidQuestionNumber(questionNumber: number): void {
  if (
    !Number.isInteger(questionNumber) ||
    questionNumber < 1 ||
    questionNumber > TOTAL_QUESTIONS
  ) {
    throw new Error(
      `Invalid question number: ${questionNumber} (expected 1–${TOTAL_QUESTIONS})`
    );
  }
}

export function assertValidAnswerIndex(index: number, fieldName: string): void {
  if (!Number.isInteger(index) || index < 0 || index > 3) {
    throw new Error(`${fieldName} must be between 0 and 3, got ${index}`);
  }
}

function clampDifficulty(value: number): Difficulty {
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, value));
}

export function getBaseDifficultyForQuestion(nextQuestionNumber: number): number {
  assertValidQuestionNumber(nextQuestionNumber);
  if (nextQuestionNumber <= 3) return 1;
  if (nextQuestionNumber <= 7) return 2;
  return 3;
}

export function getPrizeForQuestion(questionNumber: number): number {
  assertValidQuestionNumber(questionNumber);
  return PRIZE_LADDER[questionNumber - 1];
}

export function getGuaranteedWinnings(completedCorrectCount: number): number {
  if (completedCorrectCount === 0) return 0;
  if (completedCorrectCount < 1 || completedCorrectCount > TOTAL_QUESTIONS) {
    throw new Error(
      `Invalid completed question count: ${completedCorrectCount} (expected 0–${TOTAL_QUESTIONS})`
    );
  }
  if (completedCorrectCount < 5) return 0;
  if (completedCorrectCount < 8) return 1000;
  return 8000;
}

export function getNextDifficulty(
  correctCount: number,
  nextQuestionNumber: number
): Difficulty {
  assertValidQuestionNumber(nextQuestionNumber);
  if (!Number.isInteger(correctCount) || correctCount < 0) {
    throw new Error(`correctCount must be a non-negative integer, got ${correctCount}`);
  }

  let d = getBaseDifficultyForQuestion(nextQuestionNumber);
  if (correctCount >= 3) d += 1;
  else if (correctCount === 0 && nextQuestionNumber >= 4) d -= 1;

  return clampDifficulty(d);
}

function countCategoryUsage(
  previousCategories: string[],
  availableCategories: readonly string[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of availableCategories) counts.set(c, 0);
  for (const c of previousCategories) {
    if (!counts.has(c)) counts.set(c, 0);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return counts;
}

export function pickNextCategory(
  previousCategories: string[],
  availableCategories?: readonly string[]
): string {
  const pool =
    availableCategories ?? (DEFAULT_CATEGORIES as readonly string[]);
  if (pool.length === 0) {
    throw new Error("availableCategories must not be empty");
  }

  const counts = countCategoryUsage(previousCategories, pool);
  const minUses = Math.min(...pool.map((c) => counts.get(c) ?? 0));
  let leastUsed = pool.filter((c) => (counts.get(c) ?? 0) === minUses);

  const last = previousCategories[previousCategories.length - 1];
  if (last !== undefined && leastUsed.length > 1) {
    const withoutLast = leastUsed.filter((c) => c !== last);
    if (withoutLast.length > 0) leastUsed = withoutLast;
  }

  return leastUsed[0];
}

export function applyFiftyFifty(correctIndex: number): FiftyFiftyResult {
  assertValidAnswerIndex(correctIndex, "correctIndex");
  const wrong = [0, 1, 2, 3].filter((i) => i !== correctIndex);
  const keepWrong = Math.min(...wrong);
  const keepIndexes = [keepWrong, correctIndex].sort((a, b) => a - b) as [
    number,
    number,
  ];
  const removedIndexes = [0, 1, 2, 3].filter(
    (i) => i !== keepIndexes[0] && i !== keepIndexes[1]
  ) as [number, number];
  return { keepIndexes, removedIndexes };
}

export function computeAnswerOutcome(
  selectedIndex: number | null | undefined,
  correctIndex: number,
  wasSkipped?: boolean
): AnswerOutcome {
  assertValidAnswerIndex(correctIndex, "correctIndex");
  if (wasSkipped === true) return "skipped";
  if (selectedIndex === null || selectedIndex === undefined) {
    throw new Error("selectedIndex is required when wasSkipped is not true");
  }
  assertValidAnswerIndex(selectedIndex, "selectedIndex");
  return selectedIndex === correctIndex ? "correct" : "incorrect";
}

export function computeGameStatus(
  input: ComputeGameStatusInput
): ComputeGameStatusResult {
  const { isCorrect, questionNumber } = input;
  assertValidQuestionNumber(questionNumber);

  if (!isCorrect) {
    const g = getGuaranteedWinnings(questionNumber - 1);
    return {
      status: "lost",
      currentWinnings: g,
      guaranteedWinnings: g,
      nextQuestionNumber: null,
      didWinGame: false,
      didLoseGame: true,
    };
  }

  const prize = getPrizeForQuestion(questionNumber);
  const guaranteed = getGuaranteedWinnings(questionNumber);
  const isFinal = questionNumber === TOTAL_QUESTIONS;

  return {
    status: isFinal ? "won" : "active",
    currentWinnings: prize,
    guaranteedWinnings: guaranteed,
    nextQuestionNumber: isFinal ? null : questionNumber + 1,
    didWinGame: isFinal,
    didLoseGame: false,
  };
}

export function advanceSessionFromAnswer(
  input: AdvanceSessionInput
): AdvanceSessionResult {
  const {
    currentQuestionNumber,
    currentWinnings,
    correctCount,
    guaranteedWinnings,
    selectedIndex,
    correctIndex,
    wasSkipped,
  } = input;

  assertValidQuestionNumber(currentQuestionNumber);
  assertValidAnswerIndex(correctIndex, "correctIndex");

  const outcome = computeAnswerOutcome(selectedIndex, correctIndex, wasSkipped);

  if (outcome === "skipped") {
    const atEnd = currentQuestionNumber >= TOTAL_QUESTIONS;
    return {
      outcome: "skipped",
      status: "active",
      currentWinnings,
      guaranteedWinnings,
      nextQuestionNumber: atEnd ? null : currentQuestionNumber + 1,
      correctCount,
      didWinGame: false,
      didLoseGame: false,
    };
  }

  const statusResult = computeGameStatus({
    isCorrect: outcome === "correct",
    questionNumber: currentQuestionNumber,
  });

  if (outcome === "incorrect") {
    // Loss payout must match computeGameStatus (derive from question index only).
    return {
      outcome: "incorrect",
      status: statusResult.status,
      currentWinnings: statusResult.currentWinnings,
      guaranteedWinnings: statusResult.guaranteedWinnings,
      nextQuestionNumber: null,
      correctCount,
      didWinGame: false,
      didLoseGame: true,
    };
  }

  const newCorrectCount = correctCount + 1;
  const newGuaranteed = Math.max(
    guaranteedWinnings,
    getGuaranteedWinnings(currentQuestionNumber)
  );

  return {
    outcome: "correct",
    status: statusResult.status,
    currentWinnings: statusResult.currentWinnings,
    guaranteedWinnings: newGuaranteed,
    nextQuestionNumber: statusResult.nextQuestionNumber,
    correctCount: newCorrectCount,
    didWinGame: statusResult.didWinGame,
    didLoseGame: false,
  };
}
