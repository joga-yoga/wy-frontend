import { connection } from "next/server";

import { getPublishedArticles } from "./api";
import { BlogIndex } from "./blog-index";
import { blogMetadata } from "./seo";

export const metadata = blogMetadata();

export default async function BlogPage() {
  await connection();
  const { items } = await getPublishedArticles();
  return <BlogIndex items={items} />;
}
