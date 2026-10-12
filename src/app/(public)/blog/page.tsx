import { headers } from "next/headers";
import { connection } from "next/server";

import { getPublishedArticles } from "./api";
import { BlogIndex } from "./blog-index";
import { BLOG_MIRROR_HEADER } from "./mirror";
import { blogMetadata } from "./seo";

export const metadata = blogMetadata();

export default async function BlogPage() {
  await connection();
  const { items } = await getPublishedArticles();
  const mirror = (await headers()).get(BLOG_MIRROR_HEADER) === "1";
  return <BlogIndex items={items} mirror={mirror} />;
}
