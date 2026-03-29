/** Backend JSON shapes (camelCase as returned by NextResponse.json). */

export type ApiPublicQuestion = {
  id: string;
  questionNumber: number;
  category: string;
  difficulty: number;
  prizeAmount: number;
  questionText: string;
  options: [string, string, string, string];
  isAnswered: boolean;
  isSkipped: boolean;
  hostHint: string | null;
  removedOptionIndexes: [number, number] | null;
};

export type ApiLifelines = {
  fiftyFiftyAvailable: boolean;
  askHostAvailable: boolean;
  skipAvailable: boolean;
};

export type GameSessionApiResponse = {
  sessionId: string;
  status: string;
  currentQuestionNumber: number;
  currentWinnings: number;
  correctCount: number;
  prizeLadder: number[];
  lifelines: ApiLifelines;
  question: ApiPublicQuestion | null;
};

export type StartGameApiResponse = {
  sessionId: string;
  question: ApiPublicQuestion;
  prizeLadder: number[];
  lifelines: ApiLifelines;
};

export type AnswerApiResponse = {
  outcome: string;
  status: string;
  currentWinnings: number;
  guaranteedWinnings: number;
  correctCount: number;
  didWinGame: boolean;
  didLoseGame: boolean;
  explanation: string;
  correctIndex: number;
};

export type NextQuestionApiResponse = {
  question: ApiPublicQuestion;
  prizeLadder: number[];
  lifelines: ApiLifelines;
};

export type FiftyFiftyApiResponse = {
  removedIndexes: [number, number];
  keepIndexes: [number, number];
};

export type AskHostApiResponse = {
  hostHint: string;
};

export type SkipApiResponse = {
  skippedQuestionNumber: number;
  question: ApiPublicQuestion;
  lifelines: ApiLifelines;
};

/** UI-facing question (used by QuestionCard / AnswerGrid). */

export interface PublicQuestion {
  id: string;
  questionNumber: number;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  options: AnswerOption[];
  source?: string;
}

export interface AnswerOption {
  id: string;
  label: "A" | "B" | "C" | "D";
  text: string;
}

export interface Lifelines {
  fiftyFifty: boolean;
  askTheHost: boolean;
  skip: boolean;
}

export type LifelineType = keyof Lifelines;

export type AnswerState = "default" | "selected" | "correct" | "incorrect" | "disabled";

export type GameStatus = "playing" | "loading" | "revealing" | "won" | "lost";

export interface GameState {
  sessionId: string;
  status: GameStatus;
  currentQuestion: PublicQuestion | null;
  currentQuestionIndex: number;
  selectedAnswerId: string | null;
  correctAnswerId: string | null;
  lifelines: Lifelines;
  totalWinnings: number;
  questionsAnswered: number;
  categoriesFaced: string[];
  explanation?: string;
  hostHint?: string;
}

export interface GameResult {
  status: "won" | "lost";
  finalWinnings: number;
  questionsAnswered: number;
  categoriesFaced: string[];
  lifelinesUsed: LifelineType[];
}

export const PRIZE_LADDER = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000,
] as const;

export const TOTAL_QUESTIONS = PRIZE_LADDER.length;

export type PrizeAmount = (typeof PRIZE_LADDER)[number];
