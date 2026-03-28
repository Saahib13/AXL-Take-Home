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

export type PrizeAmount = (typeof PRIZE_LADDER)[number];
