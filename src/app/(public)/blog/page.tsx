import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { getPublishedArticles } from "./api";
import { BlogIndex } from "./blog-index";
import { BLOG_MIRROR_HEADER } from "./mirror";
import { parseBlogPage } from "./pagination";
import { blogMetadata } from "./seo";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// The page and metadata share one API call per request, including the range check.
const readPage = cache(async (page: number) => {
  const list = await getPublishedArticles({ page });
  if (page > 1 && list.items.length === 0) notFound();
  return list;
});

async function pageNumber(searchParams: Props["searchParams"]): Promise<number> {
  const page = parseBlogPage((await searchParams).page);
  if (page === null) notFound();
  return page;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  await connection();
  const page = await pageNumber(searchParams);
  await readPage(page);
  return blogMetadata(undefined, page);
}

export default async function BlogPage({ searchParams }: Props) {
  await connection();
  const page = await pageNumber(searchParams);
  const { items, total } = await readPage(page);
  const mirror = (await headers()).get(BLOG_MIRROR_HEADER) === "1";
  return <BlogIndex items={items} total={total} page={page} mirror={mirror} />;
}
