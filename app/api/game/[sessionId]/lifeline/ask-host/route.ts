import { NextResponse } from "next/server";
import {
  getActiveQuestion,
  loadGameSession,
  loadSessionQuestions,
} from "@/lib/game/api/sessionLoad";
import { jsonError, SessionIdSchema } from "@/lib/game/api/routeUtils";
import { generateHostHint } from "@/lib/gemini/generateHostHint";
import { createServiceRoleClient } from "@/lib/supabase/service";

function optionsTuple(row: { options: unknown }): [string, string, string, string] {
  const o = row.options;
  if (!Array.isArray(o) || o.length !== 4) {
    throw new Error("Invalid question options");
  }
  return [String(o[0]), String(o[1]), String(o[2]), String(o[3])];
}

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
    if (session.used_ask_host) {
      return jsonError("Ask the Host lifeline already used", 409);
    }

    const questions = await loadSessionQuestions(supabase, sessionId);
    const active = getActiveQuestion(questions);
    if (!active) {
      return jsonError("No active question", 409);
    }

    const options = optionsTuple(active);
    const hostHint = await generateHostHint({
      questionText: active.question_text,
      options,
      category: active.category,
      difficulty: active.difficulty,
    });

    const { error: qErr } = await supabase
      .from("session_questions")
      .update({ host_hint: hostHint })
      .eq("id", active.id);

    if (qErr) {
      return jsonError(`Failed to store host hint: ${qErr.message}`, 500);
    }

    const { error: sErr } = await supabase
      .from("game_sessions")
      .update({ used_ask_host: true })
      .eq("id", sessionId);

    if (sErr) {
      return jsonError(`Failed to update session: ${sErr.message}`, 500);
    }

    return NextResponse.json({ hostHint });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(msg, 500);
  }
}
