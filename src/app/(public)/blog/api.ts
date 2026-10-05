import { isAxiosError } from "axios";
import { ZodError } from "zod";

import { axiosInstance } from "@/lib/axiosInstance";

import {
  type ArticleDetail,
  articleDetailSchema,
  type ArticleList,
  articleListSchema,
} from "./types";

export const ARTICLES_ENDPOINT = "/public/articles";

export function usesArticleFixtures(): boolean {
  return process.env.NODE_ENV === "development" && process.env.BLOG_USE_LOCAL_FIXTURES === "1";
}

// Server-only consumers (pages, sitemap and proxy). Use the shared HTTP client and the
// existing server API_ENDPOINT override; never log response bodies or axios configs.
async function requestArticles(path: string): Promise<unknown> {
  const baseURL = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseURL) throw new Error("Article API endpoint is not configured");
  const response = await axiosInstance.get<unknown>(path, { baseURL, timeout: 10_000 });
  return response.data;
}

export async function getPublishedArticles(
  options: { allowFixtures?: boolean } = {},
): Promise<ArticleList> {
  try {
    const data =
      options.allowFixtures !== false && usesArticleFixtures()
        ? (await import("./fixtures")).articleFixtureList()
        : await requestArticles(ARTICLES_ENDPOINT);
    return articleListSchema.parse(data);
  } catch (error) {
    logArticleFailure("list", error);
    throw new Error("Article service unavailable");
  }
}

export async function getPublishedArticle(slug: string): Promise<ArticleDetail | null> {
  try {
    if (usesArticleFixtures()) {
      const data = (await import("./fixtures")).articleFixtures.find(
        (article) => article.slug === slug,
      );
      return data ? articleDetailSchema.parse(data) : null;
    }
    const data = await requestArticles(`${ARTICLES_ENDPOINT}/${encodeURIComponent(slug)}`);
    const article = articleDetailSchema.parse(data);
    if (article.slug !== slug) throw new Error("Article slug mismatch");
    return article;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    logArticleFailure("detail", error);
    throw new Error("Article service unavailable");
  }
}

function logArticleFailure(operation: string, error: unknown) {
  console.error("Article API failure", {
    operation,
    status: isAxiosError(error) ? error.response?.status : undefined,
    reason:
      error instanceof ZodError
        ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.code}`)
        : isAxiosError(error)
          ? error.code
          : error instanceof Error
            ? error.message
            : "Unknown error",
  });
}
