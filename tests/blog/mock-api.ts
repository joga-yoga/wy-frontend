import { createServer } from "node:http";

import { articleFixtureList, articleFixtures } from "../../src/app/(public)/blog/fixtures";

let failList = false;
let missingArticle = false;
createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
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
  if (pathname === "/public/articles") {
    response.statusCode = failList ? 503 : 200;
    return response.end(
      JSON.stringify(failList ? { detail: "Synthetic outage" } : articleFixtureList()),
    );
  }
  if (pathname === "/public/articles/upstream-failure") {
    response.statusCode = 503;
    return response.end('{"detail":"Synthetic outage"}');
  }
  if (pathname === "/public/articles/malformed") return response.end("{}");
  if (pathname.startsWith("/public/articles/")) {
    const article = articleFixtures.find(
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
