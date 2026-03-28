/**
 * Manual check: Supabase corpus_items retrieval for question context.
 * Run: npx tsx --env-file=.env.local scripts/test-get-question-context.ts
 * Or: npm run test:context
 */
import { getQuestionContext } from "../lib/game/getQuestionContext";

async function main() {
  try {
    const rows = await getQuestionContext({
      category: "AI",
      difficulty: 2,
    });
    console.log("First call (AI, difficulty 2):");
    console.log(JSON.stringify(rows, null, 2));

    const excludeIds = rows.map((r) => r.id);
    const rowsExcluded = await getQuestionContext({
      category: "AI",
      difficulty: 2,
      excludeIds,
    });
    console.log("\nSecond call (same inputs, excludeIds from first result):");
    console.log(JSON.stringify(rowsExcluded, null, 2));
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("getQuestionContext failed:", err.message);
    process.exit(1);
  }
}

main();
