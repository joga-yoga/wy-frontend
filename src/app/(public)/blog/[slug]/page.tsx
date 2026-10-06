import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { getPublishedArticle } from "../api";
import { ArticleView } from "../article-view";
import { BLOG_MIRROR_HEADER } from "../mirror";
import { blogMetadata } from "../seo";

type Props = { params: Promise<{ slug: string }> };
const readArticle = cache(getPublishedArticle);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const article = await readArticle((await params).slug);
  if (!article) notFound();
  return blogMetadata(article);
}

export default async function ArticlePage({ params }: Props) {
  await connection();
  const article = await readArticle((await params).slug);
  if (!article) notFound();
  const mirror = (await headers()).get(BLOG_MIRROR_HEADER) === "1";
  return <ArticleView article={article} mirror={mirror} />;
}
