/**
 * Integration tests: happy path, duplicate-question guard, Q2 after answering Q1.
 * Run: npx tsx --env-file=.env.local scripts/test-create-question-for-session.ts
 * Or: npm run test:create-question
 */
import { createQuestionForSession } from "../lib/game/createQuestionForSession";
import { createServiceRoleClient } from "../lib/supabase/service";

async function createTempSession(
  supabase: ReturnType<typeof createServiceRoleClient>,
  sessionIdsToDelete: string[]
): Promise<string> {
  const { data: session, error: insertSessionErr } = await supabase
    .from("game_sessions")
    .insert({ status: "active" })
    .select("id")
    .single();

  if (insertSessionErr || !session) {
    throw new Error(
      insertSessionErr?.message ?? "Failed to insert game_sessions row"
    );
  }

  const id = session.id as string;
  sessionIdsToDelete.push(id);
  return id;
}

async function cleanupSessions(
  supabase: ReturnType<typeof createServiceRoleClient>,
  sessionIdsToDelete: string[]
): Promise<void> {
  for (const id of sessionIdsToDelete) {
    const { error: delErr } = await supabase
      .from("game_sessions")
      .delete()
      .eq("id", id);
    if (delErr) {
      console.error(`Cleanup: failed to delete session ${id}:`, delErr.message);
    }
  }
}

async function testHappyPath(
  supabase: ReturnType<typeof createServiceRoleClient>,
  sessionIdsToDelete: string[]
): Promise<void> {
  console.log("\n--- Test: happy path ---");
  const sessionId = await createTempSession(supabase, sessionIdsToDelete);
  console.log("Created temporary session:", sessionId);

  const result = await createQuestionForSession(sessionId);
  console.log("createQuestionForSession result:");
  console.log(JSON.stringify(result, null, 2));

  const { data: verifyRow, error: verifyErr } = await supabase
    .from("session_questions")
    .select("id, session_id, question_number, question_text")
    .eq("session_id", sessionId)
    .eq("id", result.id)
    .maybeSingle();

  if (verifyErr) {
    throw new Error(`Verification query failed: ${verifyErr.message}`);
  }
  if (!verifyRow) {
    throw new Error(
      `Expected session_questions row id=${result.id} for session ${sessionId}; not found`
    );
  }

  console.log(
    "PASS: happy path — session_questions row exists (id and session_id match)."
  );
}

async function testDuplicateActiveQuestionPrevention(
  supabase: ReturnType<typeof createServiceRoleClient>,
  sessionIdsToDelete: string[]
): Promise<void> {
  console.log("\n--- Test: duplicate active question prevention ---");
  const sessionId = await createTempSession(supabase, sessionIdsToDelete);
  await createQuestionForSession(sessionId);

  let secondThrew = false;
  try {
    await createQuestionForSession(sessionId);
  } catch {
    secondThrew = true;
  }

  if (!secondThrew) {
    throw new Error(
      "ASSERTION FAILED: second createQuestionForSession was expected to throw (unanswered Q1 still active)"
    );
  }

  console.log(
    "PASS: duplicate active question prevention — second call threw as expected."
  );
}

async function testQ2GenerationPath(
  supabase: ReturnType<typeof createServiceRoleClient>,
  sessionIdsToDelete: string[]
): Promise<void> {
  console.log("\n--- Test: Q2 generation path ---");
  const sessionId = await createTempSession(supabase, sessionIdsToDelete);

  const q1 = await createQuestionForSession(sessionId);

  const { error: qUpdateErr } = await supabase
    .from("session_questions")
    .update({
      is_answered: true,
      selected_index: q1.correctIndex,
      is_correct: true,
    })
    .eq("id", q1.id);

  if (qUpdateErr) {
    throw new Error(`Failed to mark Q1 answered: ${qUpdateErr.message}`);
  }

  const { error: sessionUpdateErr } = await supabase
    .from("game_sessions")
    .update({
      correct_count: 1,
      current_winnings: 100,
    })
    .eq("id", sessionId);

  if (sessionUpdateErr) {
    throw new Error(`Failed to update game_sessions: ${sessionUpdateErr.message}`);
  }

  const q2 = await createQuestionForSession(sessionId);

  if (q2.questionNumber !== 2) {
    throw new Error(
      `ASSERTION FAILED: expected q2.questionNumber === 2, got ${q2.questionNumber}`
    );
  }
  if (q2.prizeAmount !== 200) {
    throw new Error(
      `ASSERTION FAILED: expected q2.prizeAmount === 200, got ${q2.prizeAmount}`
    );
  }

  console.log(
    "PASS: Q2 generation path — questionNumber === 2 and prizeAmount === 200."
  );
}

async function main() {
  const supabase = createServiceRoleClient();
  const sessionIdsToDelete: string[] = [];
  let failed = false;

  try {
    await testHappyPath(supabase, sessionIdsToDelete);
    await testDuplicateActiveQuestionPrevention(supabase, sessionIdsToDelete);
    await testQ2GenerationPath(supabase, sessionIdsToDelete);
    console.log("\nAll integration checks passed.");
  } catch (e) {
    failed = true;
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("test-create-question-for-session failed:", err.message);
  } finally {
    await cleanupSessions(supabase, sessionIdsToDelete);
    console.log(
      `\nCleaned up ${sessionIdsToDelete.length} temporary session(s) (cascade removes questions).`
    );
  }

  if (failed) {
    process.exit(1);
  }
}

main();
