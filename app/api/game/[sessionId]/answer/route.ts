import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getActiveQuestion,
  loadGameSession,
  loadSessionQuestions,
} from "@/lib/game/api/sessionLoad";
import { jsonError, SessionIdSchema } from "@/lib/game/api/routeUtils";
import {
  advanceSessionFromAnswer,
  getGuaranteedWinnings,
} from "@/lib/game/engine";
import { createServiceRoleClient } from "@/lib/supabase/service";

const BodySchema = z.object({
  selectedIndex: z.number().int().min(0).max(3),
});

export async function POST(
  request: Request,
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

    let body: z.infer<typeof BodySchema>;
    try {
      const json: unknown = await request.json();
      const parsed = BodySchema.safeParse(json);
      if (!parsed.success) {
        return jsonError("Invalid body: expected { selectedIndex: 0..3 }", 400);
      }
      body = parsed.data;
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const supabase = createServiceRoleClient();
    const session = await loadGameSession(supabase, sessionId);
    if (!session) {
      return jsonError("Session not found", 404);
    }
    if (session.status !== "active") {
      return jsonError("Session is not active", 409);
    }

    const questions = await loadSessionQuestions(supabase, sessionId);
    const active = getActiveQuestion(questions);
    if (!active) {
      return jsonError("No active question to answer", 409);
    }

    const correctCount = session.correct_count ?? 0;
    const advance = advanceSessionFromAnswer({
      currentQuestionNumber: active.question_number,
      currentWinnings: session.current_winnings ?? 0,
      correctCount,
      guaranteedWinnings: getGuaranteedWinnings(correctCount),
      selectedIndex: body.selectedIndex,
      correctIndex: active.correct_index,
      wasSkipped: false,
    });

    const isCorrect = advance.outcome === "correct";

    const { error: qErr } = await supabase
      .from("session_questions")
      .update({
        is_answered: true,
        is_skipped: false,
        selected_index: body.selectedIndex,
        is_correct: isCorrect,
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
      })
      .eq("id", sessionId);

    if (sErr) {
      return jsonError(`Failed to update session: ${sErr.message}`, 500);
    }

    return NextResponse.json({
      outcome: advance.outcome,
      status: advance.status,
      currentWinnings: advance.currentWinnings,
      guaranteedWinnings: advance.guaranteedWinnings,
      correctCount: advance.correctCount,
      didWinGame: advance.didWinGame,
      didLoseGame: advance.didLoseGame,
      explanation: active.explanation,
      correctIndex: active.correct_index,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(msg, 500);
  }
}
