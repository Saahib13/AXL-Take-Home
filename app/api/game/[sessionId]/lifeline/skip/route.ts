import { NextResponse } from "next/server";
import { createQuestionForSession } from "@/lib/game/createQuestionForSession";
import {
  getActiveQuestion,
  lifelinesFromSession,
  loadGameSession,
  loadSessionQuestions,
  publicQuestionFromCreated,
  type GameSessionRow,
} from "@/lib/game/api/sessionLoad";
import { jsonError, SessionIdSchema } from "@/lib/game/api/routeUtils";
import {
  advanceSessionFromAnswer,
  getGuaranteedWinnings,
  TOTAL_QUESTIONS,
} from "@/lib/game/engine";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const raw = (await context.params).sessionId;
    const parsedId = SessionIdSchema.safeParse(raw);
    if (!parsedId.success) {
      return jsonError(
        parsedId.error.issues[0]?.message ?? "Invalid session id",
        400
      );
    }
    const sessionId = parsedId.data;

    const supabase = createServiceRoleClient();
    const session = await loadGameSession(supabase, sessionId);
    if (!session) {
      return jsonError("Session not found", 404);
    }
    if (session.status !== "active") {
      return jsonError("Session is not active", 409);
    }
    if (session.used_skip) {
      return jsonError("Skip lifeline already used", 409);
    }

    const questions = await loadSessionQuestions(supabase, sessionId);
    const active = getActiveQuestion(questions);
    if (!active) {
      return jsonError("No active question", 409);
    }

    if (active.question_number === TOTAL_QUESTIONS) {
      return jsonError("Cannot skip the final question", 400);
    }

    const skippedQuestionNumber = active.question_number;

    const correctCount = session.correct_count ?? 0;
    const advance = advanceSessionFromAnswer({
      currentQuestionNumber: active.question_number,
      currentWinnings: session.current_winnings ?? 0,
      correctCount,
      guaranteedWinnings: getGuaranteedWinnings(correctCount),
      correctIndex: active.correct_index,
      wasSkipped: true,
    });

    const { error: qErr } = await supabase
      .from("session_questions")
      .update({
        is_skipped: true,
        is_answered: false,
        selected_index: null,
        is_correct: null,
      })
      .eq("id", active.id);

    if (qErr) {
      return jsonError(`Failed to update question: ${qErr.message}`, 500);
    }

    const { error: sErr } = await supabase
      .from("game_sessions")
      .update({
        status: advance.status,
        current_winnings: advance.currentWinnings,
        correct_count: advance.correctCount,
        used_skip: true,
      })
      .eq("id", sessionId);

    if (sErr) {
      return jsonError(`Failed to update session: ${sErr.message}`, 500);
    }

    let created;
    try {
      created = await createQuestionForSession(sessionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return jsonError(
        `Skip applied but failed to create the next question: ${msg}`,
        500
      );
    }

    const { error: patchErr } = await supabase
      .from("game_sessions")
      .update({ current_question_number: created.questionNumber })
      .eq("id", sessionId);

    if (patchErr) {
      return jsonError(
        `Skip and next question created but failed to update current_question_number: ${patchErr.message}`,
        500
      );
    }

    const { data: fullSession, error: loadErr } = await supabase
      .from("game_sessions")
      .select(
        "id, status, current_question_number, current_winnings, correct_count, used_fifty_fifty, used_ask_host, used_skip"
      )
      .eq("id", sessionId)
      .single();

    if (loadErr || !fullSession) {
      return jsonError(loadErr?.message ?? "Failed to load session", 500);
    }

    const lifelines = lifelinesFromSession(fullSession as GameSessionRow);

    return NextResponse.json({
      skippedQuestionNumber,
      question: publicQuestionFromCreated(created),
      lifelines: {
        fiftyFiftyAvailable: lifelines.fiftyFiftyAvailable,
        askHostAvailable: lifelines.askHostAvailable,
        skipAvailable: false,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(msg, 500);
  }
}
