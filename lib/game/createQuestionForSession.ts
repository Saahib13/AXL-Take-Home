/**
 * Orchestrates retrieval + Gemini + persistence for the next session question.
 * Server-only. Does not update session winnings, scores, or current_question_number.
 */
import { generateQuestion, type ContextItem } from "@/lib/gemini/generateQuestion";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  getNextDifficulty,
  getPrizeForQuestion,
  pickNextCategory,
  TOTAL_QUESTIONS,
} from "./engine";
import { getQuestionContext, type RetrievedContextItem } from "./getQuestionContext";

export type CreatedSessionQuestion = {
  id: string;
  sessionId: string;
  questionNumber: number;
  category: string;
  difficulty: number;
  prizeAmount: number;
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  corpusItemIds: string[];
  hostHint: string | null;
  isAnswered: boolean;
  isSkipped: boolean;
  createdAt: string;
};

type GameSessionRow = {
  id: string;
  status: string;
  correct_count: number | null;
};

type SessionQuestionRow = {
  question_number: number;
  category: string;
  is_answered: boolean | null;
  is_skipped: boolean | null;
  corpus_item_ids: string[] | null;
};

type InsertedSessionQuestionRow = {
  id: string;
  session_id: string;
  question_number: number;
  category: string;
  difficulty: number;
  corpus_item_ids: string[] | null;
  question_text: string;
  options: unknown;
  correct_index: number;
  explanation: string;
  host_hint: string | null;
  is_answered: boolean | null;
  is_skipped: boolean | null;
  created_at: string;
};

function toContextItem(row: RetrievedContextItem): ContextItem {
  return {
    title: row.title,
    summary: row.summary,
    fact_1: row.fact_1,
    fact_2: row.fact_2,
    fact_3: row.fact_3,
    tags: row.tags,
    source_label: row.source_label,
  };
}

function gatherUsedCorpusIds(rows: SessionQuestionRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const ids = row.corpus_item_ids;
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      if (typeof id === "string" && id.trim()) set.add(id);
    }
  }
  return [...set];
}

function assertOptionsTuple(options: unknown): [string, string, string, string] {
  if (!Array.isArray(options) || options.length !== 4) {
    throw new Error("session_questions.options must be an array of 4 strings");
  }
  const s = options.map((o) => String(o));
  return [s[0], s[1], s[2], s[3]];
}

function mapRowToCreated(
  row: InsertedSessionQuestionRow,
  sessionId: string,
  prizeAmount: number
): CreatedSessionQuestion {
  return {
    id: row.id,
    sessionId,
    questionNumber: row.question_number,
    category: row.category,
    difficulty: row.difficulty,
    prizeAmount,
    questionText: row.question_text,
    options: assertOptionsTuple(row.options),
    correctIndex: row.correct_index,
    explanation: row.explanation,
    corpusItemIds: Array.isArray(row.corpus_item_ids)
      ? [...row.corpus_item_ids]
      : [],
    hostHint: row.host_hint,
    isAnswered: row.is_answered ?? false,
    isSkipped: row.is_skipped ?? false,
    createdAt: row.created_at,
  };
}

/**
 * Creates the next question for an active session: engine picks category/difficulty,
 * corpus context is retrieved, Gemini generates the MCQ, row is inserted into session_questions.
 *
 * Throws if the session is not active, a prior question is still unanswered, or the game is complete.
 */
export async function createQuestionForSession(
  sessionId: string
): Promise<CreatedSessionQuestion> {
  const sid = sessionId?.trim();
  if (!sid) {
    throw new Error("createQuestionForSession: sessionId is required");
  }

  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, status, correct_count")
    .eq("id", sid)
    .maybeSingle();

  if (sessionError) {
    throw new Error(
      `createQuestionForSession: failed to load session: ${sessionError.message}`
    );
  }
  if (!session) {
    throw new Error(`createQuestionForSession: no game_sessions row for id ${sid}`);
  }

  const sess = session as GameSessionRow;
  if (sess.status !== "active") {
    throw new Error(
      `createQuestionForSession: session status is "${sess.status}"; only active sessions can receive new questions`
    );
  }

  const { data: questionRows, error: qError } = await supabase
    .from("session_questions")
    .select(
      "question_number, category, is_answered, is_skipped, corpus_item_ids"
    )
    .eq("session_id", sid)
    .order("question_number", { ascending: true });

  if (qError) {
    throw new Error(
      `createQuestionForSession: failed to load session_questions: ${qError.message}`
    );
  }

  const existing = (questionRows ?? []) as SessionQuestionRow[];

  const pending = existing.filter(
    (r) => !(r.is_answered ?? false) && !(r.is_skipped ?? false)
  );
  if (pending.length > 0) {
    throw new Error(
      "Session has an unanswered question; finish or skip it before generating another"
    );
  }

  const maxNum =
    existing.length === 0
      ? 0
      : Math.max(...existing.map((r) => r.question_number));
  const nextQuestionNumber = maxNum + 1;

  if (nextQuestionNumber > TOTAL_QUESTIONS) {
    throw new Error(
      `createQuestionForSession: game already has ${TOTAL_QUESTIONS} questions; cannot add another`
    );
  }

  const previousCategories = existing.map((r) => r.category);
  const category = pickNextCategory(previousCategories);
  const correctCount = Number(sess.correct_count ?? 0);
  const difficulty = getNextDifficulty(correctCount, nextQuestionNumber);
  const excludeIds = gatherUsedCorpusIds(existing);

  const retrieved = await getQuestionContext({
    category,
    difficulty,
    excludeIds,
    limit: 4,
  });

  const corpusItemIds = retrieved.map((r) => r.id);
  const contextItems = retrieved.map(toContextItem);

  const generated = await generateQuestion({
    contextItems,
    category,
    difficulty,
  });

  const prizeAmount = getPrizeForQuestion(nextQuestionNumber);

  const { data: inserted, error: insertError } = await supabase
    .from("session_questions")
    .insert({
      session_id: sid,
      question_number: nextQuestionNumber,
      category,
      difficulty,
      corpus_item_ids: corpusItemIds,
      question_text: generated.questionText,
      options: [...generated.options],
      correct_index: generated.correctIndex,
      explanation: generated.explanation,
      host_hint: null,
      is_answered: false,
      is_skipped: false,
    })
    .select(
      "id, session_id, question_number, category, difficulty, corpus_item_ids, question_text, options, correct_index, explanation, host_hint, is_answered, is_skipped, created_at"
    )
    .single();

  if (insertError) {
    throw new Error(
      `createQuestionForSession: insert failed: ${insertError.message}`
    );
  }
  if (!inserted) {
    throw new Error("createQuestionForSession: insert returned no row");
  }

  return mapRowToCreated(
    inserted as InsertedSessionQuestionRow,
    sid,
    prizeAmount
  );
}
