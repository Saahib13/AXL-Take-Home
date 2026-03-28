import { createServiceRoleClient } from "@/lib/supabase/service";

const SELECT_COLUMNS =
  "id, title, category, difficulty, summary, fact_1, fact_2, fact_3, tags, source_label";

export type RetrievedContextItem = {
  id: string;
  title: string;
  category: string;
  difficulty: number;
  summary: string;
  fact_1?: string | null;
  fact_2?: string | null;
  fact_3?: string | null;
  tags?: string[] | null;
  source_label?: string | null;
};

export type GetQuestionContextInput = {
  category: string;
  difficulty: number;
  excludeIds?: string[];
  limit?: number;
};

type CorpusRow = {
  id: string;
  title: string;
  category: string;
  difficulty: number;
  summary: string;
  fact_1: string | null;
  fact_2: string | null;
  fact_3: string | null;
  tags: string[] | null;
  source_label: string | null;
};

function validateInput(input: GetQuestionContextInput): {
  category: string;
  difficulty: number;
  limit: number;
  excludeIds: string[];
} {
  const category = input.category?.trim();
  if (!category) {
    throw new Error("getQuestionContext: category is required");
  }
  const d = input.difficulty;
  if (!Number.isInteger(d) || d < 1 || d > 3) {
    throw new Error(
      "getQuestionContext: difficulty must be an integer from 1 to 3"
    );
  }
  const limit = input.limit ?? 4;
  if (!Number.isInteger(limit) || limit < 3 || limit > 5) {
    throw new Error("getQuestionContext: limit must be an integer from 3 to 5");
  }
  const excludeIds = (input.excludeIds ?? []).filter(Boolean);
  return { category, difficulty: d, limit, excludeIds };
}

function adjacentDifficulties(d: number): number[] {
  if (d === 1) return [2];
  if (d === 2) return [1, 3];
  return [2];
}

function perPassFetchCap(limit: number): number {
  return Math.min(Math.max(limit * 4, 16), 32);
}

function toRow(row: CorpusRow): RetrievedContextItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    summary: row.summary,
    fact_1: row.fact_1,
    fact_2: row.fact_2,
    fact_3: row.fact_3,
    tags: row.tags,
    source_label: row.source_label,
  };
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function formatNotInList(ids: string[]): string {
  return `(${ids.join(",")})`;
}

/**
 * Fetch 3–5 corpus rows for Gemini context: exact difficulty, then adjacent, then any difficulty
 * for the same category. Excludes given IDs and dedupes across passes.
 */
export async function getQuestionContext(
  input: GetQuestionContextInput
): Promise<RetrievedContextItem[]> {
  const { category, difficulty, limit, excludeIds } = validateInput(input);
  const supabase = createServiceRoleClient();
  const cap = perPassFetchCap(limit);
  const seen = new Set<string>(excludeIds);
  const collected: RetrievedContextItem[] = [];

  const appendRows = (rows: CorpusRow[] | null) => {
    if (!rows?.length) return;
    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      collected.push(toRow(row));
    }
  };

  // Pass A: exact category + difficulty
  {
    let q = supabase
      .from("corpus_items")
      .select(SELECT_COLUMNS)
      .eq("category", category)
      .eq("difficulty", difficulty)
      .order("id", { ascending: true })
      .limit(cap);
    if (excludeIds.length > 0) {
      q = q.not("id", "in", formatNotInList(excludeIds));
    }
    const { data, error } = await q.returns<CorpusRow[]>();
    if (error) {
      throw new Error(`getQuestionContext pass A failed: ${error.message}`);
    }
    appendRows(data);
  }

  // Pass B: exact category + adjacent difficulties
  {
    const adj = adjacentDifficulties(difficulty);
    let q = supabase
      .from("corpus_items")
      .select(SELECT_COLUMNS)
      .eq("category", category)
      .in("difficulty", adj)
      .order("id", { ascending: true })
      .limit(cap);
    if (excludeIds.length > 0) {
      q = q.not("id", "in", formatNotInList(excludeIds));
    }
    const { data, error } = await q.returns<CorpusRow[]>();
    if (error) {
      throw new Error(`getQuestionContext pass B failed: ${error.message}`);
    }
    appendRows(data);
  }

  // Pass C: exact category, any difficulty
  {
    let q = supabase
      .from("corpus_items")
      .select(SELECT_COLUMNS)
      .eq("category", category)
      .order("id", { ascending: true })
      .limit(cap);
    if (excludeIds.length > 0) {
      q = q.not("id", "in", formatNotInList(excludeIds));
    }
    const { data, error } = await q.returns<CorpusRow[]>();
    if (error) {
      throw new Error(`getQuestionContext pass C failed: ${error.message}`);
    }
    appendRows(data);
  }

  shuffleInPlace(collected);
  const result = collected.slice(0, limit);

  if (result.length < 3) {
    throw new Error(
      `getQuestionContext: need at least 3 corpus_items for category=${JSON.stringify(category)} difficulty=${difficulty} after exclusions (${excludeIds.length} excluded); got ${result.length}. Seed the corpus or relax exclusions.`
    );
  }

  return result;
}
