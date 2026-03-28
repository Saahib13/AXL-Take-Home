/**
 * Server-side Gemini MCQ generation. Uses GEMINI_API_KEY; no DB.
 */
import { GoogleGenAI } from "@google/genai";
import { toJSONSchema, z } from "zod";

const MAX_ATTEMPTS = 3;

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const GeneratedQuestionSchema = z.object({
  questionText: z.string().min(1),
  options: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

/** Aligns with corpus / Supabase `corpus_items` shape (optional fields). */
export type ContextItem = {
  title: string;
  summary: string;
  fact_1?: string | null;
  fact_2?: string | null;
  fact_3?: string | null;
  tags?: string[] | null;
  source_label?: string | null;
};

export type GenerateQuestionParams = {
  /** Pre-formatted context block (exclusive with contextItems if both set: contextText wins). */
  contextText?: string;
  /** Topic cards; formatted into a context block. */
  contextItems?: ContextItem[];
  category: string;
  difficulty: number;
  /** Override default model id. */
  model?: string;
};

function requireApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local for local runs."
    );
  }
  return key;
}

function normalizeParams(params: GenerateQuestionParams): {
  category: string;
  difficulty: number;
} {
  const category = params.category?.trim();
  if (!category) {
    throw new Error("category is required and must be non-empty");
  }
  const difficulty = params.difficulty;
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 3) {
    throw new Error(
      "difficulty must be an integer from 1 to 3 (game engine scale)"
    );
  }
  return { category, difficulty };
}

/** Compact lines for optional corpus fields. */
function appendOptionalCardLines(lines: string[], item: ContextItem): void {
  const facts = [item.fact_1, item.fact_2, item.fact_3]
    .map((f) => (typeof f === "string" ? f.trim() : ""))
    .filter(Boolean);
  if (facts.length) {
    lines.push(`Facts: ${facts.join(" | ")}`);
  }
  const tags = item.tags?.filter((t) => t.trim()).map((t) => t.trim());
  if (tags?.length) {
    lines.push(`Tags: ${tags.join(", ")}`);
  }
  if (item.source_label?.trim()) {
    lines.push(`Source: ${item.source_label.trim()}`);
  }
}

/** Turn corpus-style cards into a single prompt block. */
export function formatContextItems(items: ContextItem[]): string {
  if (!items.length) {
    throw new Error("contextItems must not be empty");
  }
  return items
    .map((item, i) => {
      const lines: string[] = [
        `### Card ${i + 1}: ${item.title.trim()}`,
        item.summary.trim(),
      ];
      appendOptionalCardLines(lines, item);
      return lines.join("\n");
    })
    .join("\n\n");
}

function resolveContextText(params: GenerateQuestionParams): string {
  if (params.contextText?.trim()) {
    return params.contextText.trim();
  }
  if (params.contextItems?.length) {
    return formatContextItems(params.contextItems);
  }
  throw new Error("Provide contextText or non-empty contextItems");
}

function buildUserPrompt(
  contextBlock: string,
  category: string,
  difficulty: number
): string {
  return `You write one multiple-choice trivia question for a game inspired by "Who Wants to Be a Millionaire".

Rules:
- Use ONLY the facts in the CONTEXT below. Do not use outside knowledge. If the context is insufficient, still write a question that is fully answerable from the context alone.
- Output a single JSON object matching the required schema (no markdown fences, no extra keys).
- Exactly 4 answer strings in "options". Exactly one is correct; set "correctIndex" to 0, 1, 2, or 3 for that option.
- Do not use "All of the above", "None of the above", or trick wording. Keep options clearly distinct and similar in length when possible.
- "explanation" must justify the correct answer using ONLY information from the CONTEXT (short paragraph).
- Set "category" to: ${JSON.stringify(category)}
- Set "difficulty" to integer ${difficulty} (scale 1=easy, 3=harder).

TARGET_CATEGORY: ${category}
TARGET_DIFFICULTY: ${difficulty}

CONTEXT:
${contextBlock}
`;
}

/** Strip Zod JSON Schema metadata some APIs reject. */
function geminiResponseJsonSchema(): Record<string, unknown> {
  const raw = toJSONSchema(GeneratedQuestionSchema) as Record<string, unknown>;
  const { $schema: _s, ...rest } = raw;
  return rest;
}

function parseAndValidate(rawText: string | undefined): GeneratedQuestion {
  if (rawText === undefined || rawText.trim() === "") {
    throw new Error("Empty model response text");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch (e) {
    throw new Error("Response is not valid JSON", { cause: e });
  }

  const obj =
    typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  if (!obj) {
    throw new Error("Parsed JSON must be an object");
  }

  if (Array.isArray(obj.options)) {
    obj.options = (obj.options as unknown[]).map((o) => String(o).trim());
  }
  if (typeof obj.questionText === "string") {
    obj.questionText = obj.questionText.trim();
  }
  if (typeof obj.explanation === "string") {
    obj.explanation = obj.explanation.trim();
  }
  if (typeof obj.category === "string") {
    obj.category = obj.category.trim();
  }

  const result = GeneratedQuestionSchema.safeParse(obj);
  if (!result.success) {
    throw new Error("Response failed Zod validation", {
      cause: result.error,
    });
  }
  return result.data;
}

/** Post-Zod: distinct options, non-blank correct answer. */
function assertOptionSanity(data: GeneratedQuestion): void {
  const trimmed = data.options.map((o) => o.trim());
  const lowered = trimmed.map((o) => o.toLowerCase());
  if (new Set(lowered).size !== 4) {
    throw new Error(
      "Options must be four distinct strings (case-insensitive after trim)"
    );
  }
  const correct = trimmed[data.correctIndex];
  if (!correct) {
    throw new Error("Correct option (at correctIndex) must not be blank");
  }
}

function finalizeQuestion(
  data: GeneratedQuestion,
  category: string,
  difficulty: number
): GeneratedQuestion {
  assertOptionSanity(data);
  return {
    ...data,
    category,
    difficulty,
  };
}

/**
 * Generate one validated MCQ from mock or real context. Retries up to 2 times on failure (3 attempts total).
 */
export async function generateQuestion(
  params: GenerateQuestionParams
): Promise<GeneratedQuestion> {
  const { category, difficulty } = normalizeParams(params);
  const apiKey = requireApiKey();
  const contextBlock = resolveContextText(params);
  const model = params.model ?? DEFAULT_GEMINI_MODEL;
  const userPrompt = buildUserPrompt(contextBlock, category, difficulty);

  const ai = new GoogleGenAI({ apiKey });
  const responseJsonSchema = geminiResponseJsonSchema();

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          temperature: 0.35,
          responseMimeType: "application/json",
          responseJsonSchema,
        },
      });

      const text = response.text;
      const validated = parseAndValidate(text);
      return finalizeQuestion(validated, category, difficulty);
    } catch (e) {
      lastError = e;
      if (attempt === MAX_ATTEMPTS) {
        break;
      }
    }
  }

  const msg =
    lastError instanceof Error
      ? lastError.message
      : String(lastError ?? "unknown error");
  const err = new Error(
    `generateQuestion failed after ${MAX_ATTEMPTS} attempts: ${msg}`
  );
  err.cause = lastError;
  throw err;
}
