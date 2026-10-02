import assert from "node:assert/strict";

import { AxiosError } from "axios";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";

import {
  getPublishedArticle,
  getPublishedArticles,
  usesArticleFixtures,
} from "../../src/app/(public)/blog/api";
import { ArticleText, safeArticleHref } from "../../src/app/(public)/blog/article-text";
import { ArticleView } from "../../src/app/(public)/blog/article-view";
import { BlogIndex } from "../../src/app/(public)/blog/blog-index";
import { articleFixtureList, articleFixtures } from "../../src/app/(public)/blog/fixtures";
import { blogRouteStatus } from "../../src/app/(public)/blog/routing";
import {
  articleJsonLd,
  articleSitemapEntries,
  blogMetadata,
} from "../../src/app/(public)/blog/seo";
import { articleDetailSchema, articleListSchema } from "../../src/app/(public)/blog/types";
import { axiosInstance } from "../../src/lib/axiosInstance";
import { proxy } from "../../src/proxy";

async function main() {
  const html = renderToStaticMarkup(
    <ArticleText
      text={
        "Paragraph **bold** and *emphasis*.\n\n- First\n- Second\n\n1. One\n2. Two\n\n# Inner heading\n\n[Read](/blog/lokalna-praktyka) and [unsafe](javascript:alert(1)).\n\n<script>alert(1)</script>"
      }
    />,
  );
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>emphasis<\/em>/);
  assert.match(html, /<ul /);
  assert.match(html, /<ol /);
  assert.match(html, /<h3 /);
  assert.doesNotMatch(html, /<h1|<script|href="javascript:/);
  assert.match(html, /href="\/blog\/lokalna-praktyka"/);
  assert.equal(safeArticleHref("//evil.example"), undefined);
  assert.equal(safeArticleHref("data:text/html,evil"), undefined);
  assert.equal(safeArticleHref("https://example.com/path_(one)"), "https://example.com/path_(one)");
  assert.match(
    renderToStaticMarkup(<ArticleText text="[Parentheses](https://example.com/path_(one))" />),
    /href="https:\/\/example.com\/path_\(one\)"/,
  );
  assert.match(renderToStaticMarkup(<ArticleText text="- Parent\n  - Child\n- Next" />), /Child/);

  const list = articleListSchema.parse(articleFixtureList());
  assert.equal(list.total, 3);
  const listingHtml = renderToStaticMarkup(<BlogIndex items={list.items} />);
  for (const article of list.items) assert.ok(listingHtml.includes(`href="/blog/${article.slug}"`));
  assert.equal(listingHtml.match(/<h1\b/g)?.length, 1);
  assert.match(renderToStaticMarkup(<BlogIndex items={[]} />), /Nie ma jeszcze opublikowanych/);
  assert.throws(() => articleListSchema.parse({ total: 5, items: [] }));
  assert.throws(() => articleDetailSchema.parse({}));
  for (const fixture of articleFixtures) {
    const article = articleDetailSchema.parse(fixture);
    const metadata = blogMetadata({ ...article, canonical_url: "https://old.example/source" });
    assert.equal(metadata.alternates?.canonical, `https://joga.yoga/blog/${article.slug}`);
    assert.equal(metadata.title, `${article.seo_metadata.title} | joga.yoga`);
    assert.equal(metadata.description, article.seo_metadata.description);
    assert.equal(articleJsonLd(article).datePublished, article.published_at ?? undefined);
  }
  assert.equal(articleJsonLd(articleFixtures[0]).author, undefined);
  assert.equal(articleSitemapEntries(list)[0].lastModified, "2026-09-01T12:00:00Z");
  assert.equal(blogMetadata().alternates?.canonical, "https://joga.yoga/blog");

  const ordinaryHtml = renderToStaticMarkup(<ArticleView article={articleFixtures[0]} />);
  assert.equal(ordinaryHtml.match(/<h1\b/g)?.length, 1);
  assert.doesNotMatch(
    ordinaryHtml,
    /article-disclaimer|article-faq|article-sources|Opublikowano|Autor przykładu/,
  );
  assert.match(ordinaryHtml, /<p>Drugi akapit/);
  assert.match(ordinaryHtml, /href="\/blog"/);
  assert.match(ordinaryHtml, /<h2[^>]*>Miejsce na odpoczynek<\/h2>/);
  const faqHtml = renderToStaticMarkup(<ArticleView article={articleFixtures[2]} />);
  assert.match(faqHtml, /article-disclaimer/);
  assert.match(faqHtml, /Przykładowa informacja medyczna/);
  assert.match(faqHtml, /Autor przykładu lokalnego/);
  assert.match(faqHtml, /dateTime="2026-08-30T12:00:00Z"/);
  assert.match(faqHtml, /article-faq/);
  assert.match(faqHtml, /<strong>lokalnej weryfikacji<\/strong>/);
  assert.match(faqHtml, /href="https:\/\/www.who.int\/"/);
  assert.match(faqHtml, /Przykładowa pozycja bibliograficzna bez adresu URL/);
  const noDisclaimer = {
    ...articleFixtures[2],
    content: { ...articleFixtures[2].content, medical_disclaimer: "   " },
  };
  assert.doesNotMatch(
    renderToStaticMarkup(<ArticleView article={noDisclaimer} />),
    /article-disclaimer/,
  );

  // Exercise the real axios path and the same validation boundary without network access.
  process.env.API_ENDPOINT = "http://local-contract.test";
  process.env.BLOG_USE_LOCAL_FIXTURES = "1";
  Object.assign(process.env, { NODE_ENV: "production" });
  assert.equal(usesArticleFixtures(), false);
  axiosInstance.defaults.adapter = async (config) => ({
    data: articleFixtureList(),
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
  assert.equal((await getPublishedArticles()).total, 3);
  axiosInstance.defaults.adapter = async (config) => ({
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
  await assert.rejects(getPublishedArticles(), /unavailable/);
  await assert.rejects(getPublishedArticle("lokalna-praktyka"), /unavailable/);
  Object.assign(process.env, { NODE_ENV: "development" });
  assert.equal(usesArticleFixtures(), true);
  assert.equal((await getPublishedArticles()).total, 3);
  assert.equal(await getPublishedArticle("unknown"), null);
  await assert.rejects(getPublishedArticles({ allowFixtures: false }), /unavailable/);

  process.env.BLOG_USE_LOCAL_FIXTURES = "0";
  axiosInstance.defaults.adapter = async (config) => ({
    data: articleFixtures[0],
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
  assert.equal(await blogRouteStatus("/blog/lokalna-praktyka"), null);
  assert.equal(
    (await proxy(new NextRequest("http://localhost/blog/lokalna-praktyka"))).status,
    200,
  );
  assert.equal(await blogRouteStatus("/blog/unknown/path"), 404);
  assert.equal(await blogRouteStatus("/contact"), null);
  axiosInstance.defaults.adapter = async (config) => {
    throw new AxiosError("missing", "ERR_BAD_REQUEST", config, undefined, {
      status: 404,
      statusText: "Not Found",
      data: { detail: "Article not found" },
      headers: {},
      config,
    });
  };
  assert.equal(await getPublishedArticle("unpublished"), null);
  assert.equal(await blogRouteStatus("/blog/unknown.with-dot"), 404);
  assert.equal(await blogRouteStatus("/blog/%"), 404);
  assert.equal(await blogRouteStatus("/blog/unpublished"), 404);
  const missingResponse = await proxy(new NextRequest("http://localhost/blog/unpublished"));
  assert.equal(missingResponse.status, 404);
  assert.match(
    missingResponse.headers.get("x-middleware-rewrite") ?? "",
    /\/blog\/problem\/missing$/,
  );
  assert.equal(missingResponse.headers.get("cache-control"), "no-store");
  assert.equal(missingResponse.headers.get("x-robots-tag"), "noindex");
  assert.equal(await blogRouteStatus("/blog"), 503);
  axiosInstance.defaults.adapter = async () => {
    throw new AxiosError("offline", "ECONNREFUSED");
  };
  assert.equal(await blogRouteStatus("/blog/lokalna-praktyka"), 503);
  const failedResponse = await proxy(new NextRequest("http://localhost/blog/lokalna-praktyka"));
  assert.equal(failedResponse.status, 503);
  assert.equal(failedResponse.headers.get("retry-after"), "60");
  console.log("blog article tests: ok");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
