import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const CorpusItemSchema = z.object({
  title: z.string().min(1),
  category: z.enum([
    "AI",
    "Startups",
    "Internet Culture",
    "Technology History",
    "Current Events",
  ]),
  difficulty: z.number().int().min(1).max(3),
  summary: z.string().min(1),
  fact_1: z.string().nullable().optional(),
  fact_2: z.string().nullable().optional(),
  fact_3: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  source_label: z.string().optional(),
  source_url: z.string().nullable().optional(),
  is_current: z.boolean().optional(),
});

type CorpusItem = z.infer<typeof CorpusItemSchema>;

function toInsertRow(item: CorpusItem) {
  return {
    title: item.title,
    category: item.category,
    difficulty: item.difficulty,
    summary: item.summary,
    fact_1: item.fact_1 ?? null,
    fact_2: item.fact_2 ?? null,
    fact_3: item.fact_3 ?? null,
    tags: item.tags ?? [],
    source_label: item.source_label ?? null,
    source_url: item.source_url ?? null,
    is_current: item.is_current ?? false,
  };
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use .env.local)."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const filePath = path.join(process.cwd(), "data", "corpus.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("corpus.json must contain a JSON array");
  }

  const items: ReturnType<typeof toInsertRow>[] = [];
  parsed.forEach((row, i) => {
    const result = CorpusItemSchema.safeParse(row);
    if (!result.success) {
      console.error(`Invalid corpus item at index ${i}:`, result.error.flatten());
      process.exit(1);
    }
    items.push(toInsertRow(result.data));
  });

  console.log(`Loaded ${items.length} corpus items from data/corpus.json`);

  if (items.length === 0) {
    console.log("Nothing to insert. Add rows to data/corpus.json and run again.");
    return;
  }

  const chunkSize = 100;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const { error } = await supabase.from("corpus_items").insert(chunk);

    if (error) {
      console.error(`Failed on chunk starting at index ${i}:`, error.message);
      process.exit(1);
    }

    console.log(
      `Inserted rows ${i + 1} to ${Math.min(i + chunkSize, items.length)}`
    );
  }

  console.log("Corpus seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
