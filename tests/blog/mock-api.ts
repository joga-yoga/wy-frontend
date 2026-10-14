import { createServer } from "node:http";

import { paginationArticles } from "./pagination-fixtures";

let failList = false;
let missingArticle = false;
let listReads = 0;
createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const { pathname } = url;
  response.setHeader("Content-Type", "application/json");
  if (pathname === "/health") return response.end("{}");
  if (pathname === "/test-control/list-failure") {
    failList = request.method === "POST";
    return response.end("{}");
  }
  if (pathname === "/test-control/article-missing") {
    missingArticle = request.method === "POST";
    return response.end("{}");
  }
  if (pathname === "/test-control/list-reads") {
    if (request.method === "POST") listReads = 0;
    return response.end(JSON.stringify({ listReads }));
  }
  if (pathname === "/public/articles") {
    listReads++;
    response.statusCode = failList ? 503 : 200;
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? paginationArticles.length);
    const items = paginationArticles.slice(offset, offset + limit).map((article) => ({
      slug: article.slug,
      title: article.title,
      description: article.description,
      lead: article.lead,
      canonical_url: article.canonical_url,
      updated_at: article.updated_at,
      published_at: article.published_at,
    }));
    return response.end(
      JSON.stringify(
        failList ? { detail: "Synthetic outage" } : { total: paginationArticles.length, items },
      ),
    );
  }
  if (pathname === "/public/articles/upstream-failure") {
    response.statusCode = 503;
    return response.end('{"detail":"Synthetic outage"}');
  }
  if (pathname === "/public/articles/malformed") return response.end("{}");
  if (pathname.startsWith("/public/articles/")) {
    const article = paginationArticles.find(
      (item) =>
        item.slug === decodeURIComponent(pathname.slice(17)) &&
        !(missingArticle && item.slug === "lokalna-praktyka"),
    );
    response.statusCode = article ? 200 : 404;
    return response.end(JSON.stringify(article ?? { detail: "Article not found" }));
  }
  // Unrelated sitemap groups can legitimately be empty in this isolated test backend.
  if (pathname === "/instructors/index") return response.end("[]");
  // Cache Components requires one parameter for build-time city route validation.
  if (pathname === "/directory/cities") {
    return response.end('[{"slug":"test-city","name":"Test city","studio_count":0}]');
  }
  if (pathname === "/directory/cities/test-city") {
    response.statusCode = 404;
    return response.end('{"detail":"Not found"}');
  }
  if (pathname === "/directory/studios") {
    return response.end('{"cities":[],"towns":[]}');
  }
  if (pathname.endsWith("/slugs") || pathname.startsWith("/directory/")) return response.end("[]");
  response.statusCode = 404;
  response.end('{"detail":"Not found"}');
}).listen(4020, "127.0.0.1", () => console.log("Blog contract stub on http://127.0.0.1:4020"));
