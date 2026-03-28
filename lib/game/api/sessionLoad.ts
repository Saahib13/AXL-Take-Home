/**
 * Server-only helpers to load game session + questions for API routes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreatedSessionQuestion } from "@/lib/game/createQuestionForSession";
import { getPrizeForQuestion } from "@/lib/game/engine";

export const FIFTY_FIFTY_EVENT_TYPE = "lifeline_fifty_fifty";

export type GameSessionRow = {
  id: string;
  status: string;
  current_question_number: number | null;
  current_winnings: number | null;
  correct_count: number | null;
  used_fifty_fifty: boolean | null;
  used_ask_host: boolean | null;
  used_skip: boolean | null;
};

export type SessionQuestionDbRow = {
  id: string;
  session_id: string;
  question_number: number;
  category: string;
  difficulty: number;
  question_text: string;
  options: unknown;
  correct_index: number;
  explanation: string;
  host_hint: string | null;
  is_answered: boolean | null;
  is_skipped: boolean | null;
  selected_index: number | null;
  is_correct: boolean | null;
  created_at: string;
};

export type PublicQuestion = {
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

const SESSION_SELECT =
  "id, status, current_question_number, current_winnings, correct_count, used_fifty_fifty, used_ask_host, used_skip";

const QUESTION_SELECT =
  "id, session_id, question_number, category, difficulty, question_text, options, correct_index, explanation, host_hint, is_answered, is_skipped, selected_index, is_correct, created_at";

function assertOptionsTuple(options: unknown): [string, string, string, string] {
  if (!Array.isArray(options) || options.length !== 4) {
    throw new Error("Invalid options shape");
  }
  return [String(options[0]), String(options[1]), String(options[2]), String(options[3])];
}

export async function loadGameSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<GameSessionRow | null> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`loadGameSession: ${error.message}`);
  }
  return data as GameSessionRow | null;
}

export async function loadSessionQuestions(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SessionQuestionDbRow[]> {
  const { data, error } = await supabase
    .from("session_questions")
    .select(QUESTION_SELECT)
    .eq("session_id", sessionId)
    .order("question_number", { ascending: true });

  if (error) {
    throw new Error(`loadSessionQuestions: ${error.message}`);
  }
  return (data ?? []) as SessionQuestionDbRow[];
}

export function getActiveQuestion(
  questions: SessionQuestionDbRow[]
): SessionQuestionDbRow | null {
  const actives = questions.filter(
    (q) => !(q.is_answered ?? false) && !(q.is_skipped ?? false)
  );
  if (actives.length > 1) {
    throw new Error("Data error: multiple active questions for one session");
  }
  return actives[0] ?? null;
}

export function getLatestQuestion(
  questions: SessionQuestionDbRow[]
): SessionQuestionDbRow | null {
  if (questions.length === 0) return null;
  return questions.reduce((a, b) =>
    b.question_number > a.question_number ? b : a
  );
}

export async function loadFiftyFiftyRemovedForQuestion(
  supabase: SupabaseClient,
  sessionId: string,
  questionId: string
): Promise<[number, number] | null> {
  const { data, error } = await supabase
    .from("session_events")
    .select("payload, created_at")
    .eq("session_id", sessionId)
    .eq("event_type", FIFTY_FIFTY_EVENT_TYPE)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`loadFiftyFiftyRemovedForQuestion: ${error.message}`);
  }

  for (const row of data ?? []) {
    const payload = row.payload as Record<string, unknown> | null;
    if (!payload || payload.questionId !== questionId) continue;
    const ri = payload.removedIndexes;
    if (
      Array.isArray(ri) &&
      ri.length === 2 &&
      typeof ri[0] === "number" &&
      typeof ri[1] === "number"
    ) {
      return [ri[0], ri[1]];
    }
  }
  return null;
}

export function buildPublicQuestion(
  row: SessionQuestionDbRow,
  removedOptionIndexes: [number, number] | null
): PublicQuestion {
  return {
    id: row.id,
    questionNumber: row.question_number,
    category: row.category,
    difficulty: row.difficulty,
    prizeAmount: getPrizeForQuestion(row.question_number),
    questionText: row.question_text,
    options: assertOptionsTuple(row.options),
    isAnswered: row.is_answered ?? false,
    isSkipped: row.is_skipped ?? false,
    hostHint: row.host_hint,
    removedOptionIndexes,
  };
}

export async function buildPublicQuestionForSession(
  supabase: SupabaseClient,
  sessionId: string,
  row: SessionQuestionDbRow
): Promise<PublicQuestion> {
  const removed = await loadFiftyFiftyRemovedForQuestion(
    supabase,
    sessionId,
    row.id
  );
  return buildPublicQuestion(row, removed);
}

export function lifelinesFromSession(session: GameSessionRow): {
  fiftyFiftyAvailable: boolean;
  askHostAvailable: boolean;
  skipAvailable: boolean;
} {
  return {
    fiftyFiftyAvailable: !(session.used_fifty_fifty ?? false),
    askHostAvailable: !(session.used_ask_host ?? false),
    skipAvailable: !(session.used_skip ?? false),
  };
}

export function publicQuestionFromCreated(
  created: CreatedSessionQuestion
): PublicQuestion {
  return {
    id: created.id,
    questionNumber: created.questionNumber,
    category: created.category,
    difficulty: created.difficulty,
    prizeAmount: created.prizeAmount,
    questionText: created.questionText,
    options: created.options,
    isAnswered: created.isAnswered,
    isSkipped: created.isSkipped,
    hostHint: created.hostHint,
    removedOptionIndexes: null,
  };
}
