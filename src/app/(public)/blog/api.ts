import { isAxiosError } from "axios";
import { ZodError } from "zod";

import { axiosInstance } from "@/lib/axiosInstance";

import { BLOG_PAGE_SIZE } from "./pagination";
import {
  articleCollectionSchema,
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
async function requestArticles(
  path: string,
  params?: { limit: number; offset: number },
): Promise<unknown> {
  const baseURL = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!baseURL) throw new Error("Article API endpoint is not configured");
  const response = await axiosInstance.get<unknown>(path, { baseURL, timeout: 10_000, params });
  return response.data;
}

export async function getPublishedArticles(
  options: { allowFixtures?: boolean; page?: number } = {},
): Promise<ArticleList> {
  try {
    const pagination =
      options.page === undefined
        ? undefined
        : { limit: BLOG_PAGE_SIZE, offset: (options.page - 1) * BLOG_PAGE_SIZE };
    let data: unknown;
    if (options.allowFixtures !== false && usesArticleFixtures()) {
      const fixtures = (await import("./fixtures")).articleFixtureList();
      data = pagination
        ? {
            ...fixtures,
            items: fixtures.items.slice(pagination.offset, pagination.offset + pagination.limit),
          }
        : fixtures;
    } else {
      data = await requestArticles(ARTICLES_ENDPOINT, pagination);
    }
    if (!pagination) return articleCollectionSchema.parse(data);
    const list = articleListSchema.parse(data);
    if (
      list.items.length !== Math.min(pagination.limit, Math.max(0, list.total - pagination.offset))
    ) {
      throw new Error("Unexpected article page size");
    }
    return list;
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
