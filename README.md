This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Current Event Millionaire** — take-home skeleton: App Router, TypeScript, Tailwind CSS, shadcn/ui, Zod, Supabase client, and Google GenAI (`@google/genai`). Copy [`.env.example`](./.env.example) to `.env.local` and set `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` before wiring backend routes. Deploy on [Vercel](https://vercel.com) with the same variable names.

## Corpus seeding

1. Add topic cards to [`data/corpus.json`](./data/corpus.json) (JSON array). Allowed `category` values: `AI`, `Startups`, `Internet Culture`, `Technology History`, `Current Events`; `difficulty` 1–3.
2. Run `npm run seed:corpus` (loads `.env.local`; uses the Supabase **service role** key).
3. Run `npm run verify:supabase` to confirm table health, row counts by category, and an `AI` sample read (up to 5 rows).

Re-running the seed **appends** duplicate rows unless you clear `corpus_items` first.

## Game engine (pure logic)

Deterministic rules live in [`lib/game/engine.ts`](./lib/game/engine.ts) (no DB, AI, or randomness). Run **`npm test`** for Vitest unit tests.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
