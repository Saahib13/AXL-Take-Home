import { NextResponse } from "next/server";
import {
  FIFTY_FIFTY_EVENT_TYPE,
  getActiveQuestion,
  loadGameSession,
  loadSessionQuestions,
} from "@/lib/game/api/sessionLoad";
import { jsonError, SessionIdSchema } from "@/lib/game/api/routeUtils";
import { applyFiftyFifty } from "@/lib/game/engine";
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
    if (session.used_fifty_fifty) {
      return jsonError("50/50 lifeline already used", 409);
    }

    const questions = await loadSessionQuestions(supabase, sessionId);
    const active = getActiveQuestion(questions);
    if (!active) {
      return jsonError("No active question", 409);
    }

    const result = applyFiftyFifty(active.correct_index);

    const { error: evErr } = await supabase.from("session_events").insert({
      session_id: sessionId,
      event_type: FIFTY_FIFTY_EVENT_TYPE,
      payload: {
        questionId: active.id,
        removedIndexes: result.removedIndexes,
      },
    });

    if (evErr) {
      return jsonError(`Failed to record lifeline: ${evErr.message}`, 500);
    }

    const { error: sErr } = await supabase
      .from("game_sessions")
      .update({ used_fifty_fifty: true })
      .eq("id", sessionId);

    if (sErr) {
      return jsonError(`Failed to update session: ${sErr.message}`, 500);
    }

    return NextResponse.json({
      removedIndexes: result.removedIndexes,
      keepIndexes: result.keepIndexes,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(msg, 500);
  }
}
