/**
 * Smoke test: mock context -> generateQuestion -> stdout JSON.
 * Run: npx tsx --env-file=.env.local scripts/test-gemini-question.ts
 */
import { generateQuestion } from "../lib/gemini/generateQuestion";

const mockContextItems = [
  {
    title: "Retrieval-augmented generation (RAG)",
    summary:
      "RAG retrieves relevant external documents or data before the model generates an answer, grounding responses in sources rather than only parametric memory.",
    fact_1: "Retrieval happens before the answer is generated.",
    tags: ["rag", "grounding", "llm"],
    source_label: "encyclopedic",
  },
  {
    title: "Vector databases in ML apps",
    summary:
      "Vector stores hold embeddings so systems can find nearest-neighbor chunks for semantic search, often as part of a RAG pipeline.",
  },
  {
    title: "Hallucinations in LLMs",
    summary:
      "A hallucination is fluent but false or unsupported content; grounding and retrieval are common mitigations.",
  },
];

async function main() {
  try {
    const result = await generateQuestion({
      contextItems: mockContextItems,
      category: "AI",
      difficulty: 2,
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("generateQuestion failed:", err.message);
    if (err.cause) {
      console.error("Cause:", err.cause);
    }
    process.exit(1);
  }
}

main();
