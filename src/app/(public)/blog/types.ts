import { z } from "zod";

// Public Pydantic schemas in wy-backend/src/app/schemas/article.py.
// Validate at the API boundary: malformed responses are failures, never empty articles.
const summarySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  lead: z.string(),
  canonical_url: z.string().url(),
  updated_at: z.string().datetime({ offset: true }),
  published_at: z.string().datetime({ offset: true }).nullish(),
});

export const articleListSchema = z
  .object({
    total: z.number().int().nonnegative(),
    items: z.array(summarySchema),
  })
  .refine(
    (list) => list.total === list.items.length,
    "Expected the complete unpaginated collection",
  )
  .refine(
    (list) => new Set(list.items.map((item) => item.slug)).size === list.total,
    "Duplicate article slugs",
  );

export const articleDetailSchema = summarySchema.extend({
  content: z.object({
    format: z.literal("structured_sections"),
    lead: z.string(),
    headline: z.string(),
    sections: z.array(z.object({ title: z.string(), body: z.string() })),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
    medical_disclaimer: z.string().nullish(),
  }),
  seo_metadata: z.object({
    title: z.string(),
    description: z.string(),
    robots: z.string().nullish(),
  }),
  citations: z.array(z.string()),
  author: z.object({ name: z.string() }).nullish(),
});

export type ArticleSummary = z.infer<typeof summarySchema>;
export type ArticleList = z.infer<typeof articleListSchema>;
export type ArticleDetail = z.infer<typeof articleDetailSchema>;
