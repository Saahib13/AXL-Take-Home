/**
 * One-off: verify Supabase URL/key and that expected tables respond.
 * Run: node --env-file=.env.local scripts/verify-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment (.env.local)."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = [
  "corpus_items",
  "game_sessions",
  "session_questions",
  "session_events",
];

async function probeTable(name) {
  const { data, error, count } = await supabase
    .from(name)
    .select("*", { count: "exact", head: true });

  if (error) {
    return { name, ok: false, error: error.message, code: error.code };
  }
  return { name, ok: true, rowCount: count ?? null };
}

console.log("Supabase URL:", url.replace(/^(https:\/\/[^.]+\.)([^.]+)(.*)$/, "$1***$3"));
console.log("Using: service role key (server-style)\n");

const results = [];
for (const t of tables) {
  results.push(await probeTable(t));
}

let failed = false;
for (const r of results) {
  if (r.ok) {
    console.log(`OK   ${r.name}  (rows: ${r.rowCount ?? "?"})`);
  } else {
    failed = true;
    console.log(`FAIL ${r.name}  ${r.code ?? ""} ${r.error}`);
  }
}

// Light shape check: one row sample from corpus_items if any rows exist
const { data: sample, error: sampleErr } = await supabase
  .from("corpus_items")
  .select("id,title,category,difficulty,summary,tags,created_at")
  .limit(1);

if (sampleErr) {
  console.log("\nSample row skipped:", sampleErr.message);
} else if (sample?.length) {
  const row = sample[0];
  console.log("\nSample corpus_items keys present:", Object.keys(row).join(", "));
} else {
  console.log("\ncorpus_items is empty (connection OK, seed data next).");
}

// Category balance + AI sample read (when corpus has rows)
const corpusProbe = results.find((r) => r.name === "corpus_items");
const corpusCount = corpusProbe?.ok ? corpusProbe.rowCount : 0;

if (corpusCount && corpusCount > 0) {
  const { data: byCat, error: catErr } = await supabase
    .from("corpus_items")
    .select("category");

  if (catErr) {
    console.log("\nCategory breakdown skipped:", catErr.message);
  } else if (byCat?.length) {
    const tally = byCat.reduce((acc, row) => {
      const c = row.category ?? "(null)";
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {});
    console.log("\nCorpus rows by category:");
    Object.keys(tally)
      .sort()
      .forEach((k) => console.log(`  ${k}: ${tally[k]}`));
  }

  const { data: aiSample, error: aiErr } = await supabase
    .from("corpus_items")
    .select("id,title,category")
    .eq("category", "AI")
    .limit(5);

  if (aiErr) {
    console.log("\nAI sample read failed:", aiErr.message);
    failed = true;
  } else {
    console.log(
      `\nRead test: AI category, limit 5 — ${aiSample?.length ?? 0} row(s)`
    );
    (aiSample ?? []).forEach((r, i) =>
      console.log(`  ${i + 1}. ${r.title}`)
    );
    if ((aiSample?.length ?? 0) === 0) {
      console.log(
        "  (no AI rows yet; optional — add AI cards to data/corpus.json and seed.)"
      );
    }
  }
}

process.exit(failed ? 2 : 0);
