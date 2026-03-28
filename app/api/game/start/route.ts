import { NextResponse } from "next/server";
import { createQuestionForSession } from "@/lib/game/createQuestionForSession";
import {
  lifelinesFromSession,
  publicQuestionFromCreated,
  type GameSessionRow,
} from "@/lib/game/api/sessionLoad";
import { jsonError } from "@/lib/game/api/routeUtils";
import { PRIZE_LADDER } from "@/lib/game/engine";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function POST() {
  try {
    const supabase = createServiceRoleClient();

    const { data: session, error: insertErr } = await supabase
      .from("game_sessions")
      .insert({
        status: "active",
        current_question_number: 0,
        current_winnings: 0,
        correct_count: 0,
        used_fifty_fifty: false,
        used_ask_host: false,
        used_skip: false,
      })
      .select("id")
      .single();

    if (insertErr || !session) {
      return jsonError(
        insertErr?.message ?? "Failed to create game session",
        500
      );
    }

    const sessionId = session.id as string;

    let created;
    try {
      created = await createQuestionForSession(sessionId);
    } catch (e) {
      await supabase.from("game_sessions").delete().eq("id", sessionId);
      const msg = e instanceof Error ? e.message : String(e);
      return jsonError(msg, 500);
    }

    const { error: patchErr } = await supabase
      .from("game_sessions")
      .update({ current_question_number: created.questionNumber })
      .eq("id", sessionId);

    if (patchErr) {
      return jsonError(
        `Session created but failed to set current_question_number: ${patchErr.message}`,
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
      sessionId,
      question: publicQuestionFromCreated(created),
      prizeLadder: [...PRIZE_LADDER],
      lifelines: lifelinesFromSession(fullSession as GameSessionRow),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(msg, 500);
  }
}
