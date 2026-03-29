import type { ApiLifelines, ApiPublicQuestion } from "@/types/game";
import type { Lifelines, PublicQuestion } from "@/types/game";

const LABELS = ["A", "B", "C", "D"] as const;

export function difficultyNumberToUi(
  d: number
): "easy" | "medium" | "hard" {
  if (d <= 1) return "easy";
  if (d === 2) return "medium";
  return "hard";
}

export function apiQuestionToUi(q: ApiPublicQuestion): PublicQuestion {
  const options = q.options.map((text, i) => ({
    id: String(i),
    label: LABELS[i],
    text,
  })) as PublicQuestion["options"];

  return {
    id: q.id,
    questionNumber: q.questionNumber,
    category: q.category,
    difficulty: difficultyNumberToUi(q.difficulty),
    questionText: q.questionText,
    options,
    source: "corpus + AI",
  };
}

export function apiLifelinesToUi(l: ApiLifelines): Lifelines {
  return {
    fiftyFifty: l.fiftyFiftyAvailable,
    askTheHost: l.askHostAvailable,
    skip: l.skipAvailable,
  };
}

export function removedIndexesToOptionIds(
  removed: [number, number] | null | undefined
): string[] {
  if (!removed) return [];
  return removed.map((i) => String(i));
}
