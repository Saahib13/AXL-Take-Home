import { NextResponse } from "next/server";
import {
  buildPublicQuestionForSession,
  getActiveQuestion,
  lifelinesFromSession,
  loadGameSession,
  loadSessionQuestions,
} from "@/lib/game/api/sessionLoad";
import { jsonError, SessionIdSchema } from "@/lib/game/api/routeUtils";
import { PRIZE_LADDER } from "@/lib/game/engine";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const raw = (await context.params).sessionId;
    const parsed = SessionIdSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid session id", 400);
    }
    const sessionId = parsed.data;

    const supabase = createServiceRoleClient();
    const session = await loadGameSession(supabase, sessionId);
    if (!session) {
      return jsonError("Session not found", 404);
    }

    const questions = await loadSessionQuestions(supabase, sessionId);
    const active = getActiveQuestion(questions);

    const question = active
      ? await buildPublicQuestionForSession(supabase, sessionId, active)
      : null;

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      currentQuestionNumber: session.current_question_number ?? 0,
      currentWinnings: session.current_winnings ?? 0,
      correctCount: session.correct_count ?? 0,
      prizeLadder: [...PRIZE_LADDER],
      lifelines: lifelinesFromSession(session),
      question,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(msg, 500);
  }
}
