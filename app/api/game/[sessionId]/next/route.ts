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
import { PRIZE_LADDER } from "@/lib/game/engine";
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
      return jsonError("Session is not active; cannot load next question", 409);
    }

    const questions = await loadSessionQuestions(supabase, sessionId);
    if (getActiveQuestion(questions) !== null) {
      return jsonError(
        "Answer or skip the current question before requesting the next one",
        409
      );
    }

    let created;
    try {
      created = await createQuestionForSession(sessionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("cannot add another") ||
        msg.includes("already has") ||
        msg.includes("TOTAL_QUESTIONS")
      ) {
        return jsonError(msg, 409);
      }
      if (msg.includes("unanswered")) {
        return jsonError(msg, 409);
      }
      if (msg.includes("not active") || msg.includes("status")) {
        return jsonError(msg, 409);
      }
      return jsonError(msg, 500);
    }

    const { error: patchErr } = await supabase
      .from("game_sessions")
      .update({ current_question_number: created.questionNumber })
      .eq("id", sessionId);

    if (patchErr) {
      return jsonError(
        `Question created but failed to update current_question_number: ${patchErr.message}`,
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

    return NextResponse.json({
      question: publicQuestionFromCreated(created),
      prizeLadder: [...PRIZE_LADDER],
      lifelines: lifelinesFromSession(fullSession as GameSessionRow),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(msg, 500);
  }
}
