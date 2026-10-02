import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { getPublishedArticle } from "../api";
import { ArticleView } from "../article-view";
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
  return <ArticleView article={article} />;
}
