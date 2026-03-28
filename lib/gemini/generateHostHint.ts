/**
 * Short host-style hint for Ask the Host lifeline. Server-only.
 */
import { GoogleGenAI } from "@google/genai";
import { toJSONSchema, z } from "zod";
import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini/generateQuestion";

const MAX_ATTEMPTS = 3;

const HostHintSchema = z.object({
  hint: z.string().min(1).max(400),
});

export type GenerateHostHintParams = {
  questionText: string;
  options: readonly [string, string, string, string];
  category: string;
  difficulty: number;
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

function geminiResponseJsonSchema(): Record<string, unknown> {
  const raw = toJSONSchema(HostHintSchema) as Record<string, unknown>;
  const { $schema: _s, ...rest } = raw;
  return rest;
}

function buildPrompt(params: GenerateHostHintParams): string {
  const opts = params.options
    .map((o, i) => `${i}: ${o}`)
    .join("\n");
  return `You are a game show host giving a subtle hint for a trivia question.

Rules:
- Output a single JSON object with one key "hint" (string).
- The hint nudges the player toward thinking about the topic; do NOT name or imply which option index (0–3) is correct.
- Do NOT quote or repeat any option text verbatim.
- Do not state the correct answer outright.
- Keep "hint" under 300 characters if possible, max 400.

Category: ${params.category}
Difficulty (1–3): ${params.difficulty}

QUESTION:
${params.questionText.trim()}

OPTIONS (for context only; do not reveal which is correct):
${opts}
`;
}

/**
 * Generate a short hint string. Retries up to 2 times on failure (3 attempts total).
 */
export async function generateHostHint(
  params: GenerateHostHintParams
): Promise<string> {
  const apiKey = requireApiKey();
  const model = params.model ?? DEFAULT_GEMINI_MODEL;
  const userPrompt = buildPrompt(params);
  const ai = new GoogleGenAI({ apiKey });
  const responseJsonSchema = geminiResponseJsonSchema();

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseJsonSchema,
        },
      });

      const text = response.text;
      if (text === undefined || text.trim() === "") {
        throw new Error("Empty model response text");
      }
      const parsed = JSON.parse(text) as unknown;
      const result = HostHintSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error("Response failed Zod validation", {
          cause: result.error,
        });
      }
      return result.data.hint.trim();
    } catch (e) {
      lastError = e;
      if (attempt === MAX_ATTEMPTS) break;
    }
  }

  const msg =
    lastError instanceof Error
      ? lastError.message
      : String(lastError ?? "unknown error");
  const err = new Error(
    `generateHostHint failed after ${MAX_ATTEMPTS} attempts: ${msg}`
  );
  err.cause = lastError;
  throw err;
}
