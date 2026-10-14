import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "wy.cookie_consent.v1",
      JSON.stringify({ necessary: true, analytics: false, marketing: false, decided: true }),
    );
  });
});

test("published list and article HTML, metadata and optional content", async ({
  page,
  request,
}, testInfo) => {
  const response = await request.get("/blog");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('href="/blog/lokalna-praktyka"');
  expect(html).toContain('href="/blog/lokalny-dlugi-artykul"');
  expect(html).toContain('href="https://joga.yoga/blog"');
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");
  await expect(
    page.locator("footer").getByRole("link", { name: "Blog", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("blog.png"), fullPage: true });
  await page
    .getByRole("link", { name: "Czytaj artykuł: Spokojna praktyka — przykład lokalny" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByText("Informacja medyczna", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Opublikowano", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Autor przykładu lokalnego")).toHaveCount(0);

  const article = await request.get("/blog/lokalny-dlugi-artykul");
  expect(article.status()).toBe(200);
  const articleHtml = await article.text();
  // All these are native HTML, not merely text serialized into an RSC payload.
  expect(articleHtml).toContain("<strong>wyróżnieniem</strong>");
  expect(articleHtml).toContain("<em>kursywą</em>");
  expect(articleHtml).toContain('<ul class="list-disc');
  expect(articleHtml).toContain("<ol ");
  expect(articleHtml).toMatch(/<h3[^>]*>Dodatkowa uwaga<\/h3>/);
  expect(articleHtml.match(/<link rel="canonical"[^>]*>/g)).toEqual([
    '<link rel="canonical" href="https://joga.yoga/blog/lokalny-dlugi-artykul"/>',
  ]);
  expect(articleHtml).toContain("Przygotowanie do praktyki — przykład lokalny | joga.yoga</title>");
  await page.goto("/blog/lokalny-dlugi-artykul");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Dodatkowa uwaga" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("long-article.png"), fullPage: true });

  await page.goto("/blog/lokalne-faq");
  await expect(page.getByRole("heading", { name: "Informacja medyczna" })).toBeVisible();
  await expect(page.getByText("Autor przykładu lokalnego", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Czy to treść do publikacji?" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "https://www.who.int/", exact: true }),
  ).toHaveAttribute("href", "https://www.who.int/");
  await expect(page.getByText("Przykładowa pozycja bibliograficzna bez adresu URL.")).toBeVisible();
  await expect(page.getByRole("link", { name: "← Wróć do bloga" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("faq-article.png"), fullPage: true });
});

test("production HTTP distinguishes missing, malformed and failed upstream responses", async ({
  request,
}) => {
  for (const userAgent of ["Mozilla/5.0", "Googlebot"]) {
    for (const path of [
      "/blog/unknown-or-unpublished",
      "/blog/unknown.with-dot",
      "/blog/unknown/nested",
      "/blog/problem/missing",
    ]) {
      const missing = await request.get(path, { headers: { "User-Agent": userAgent } });
      expect(missing.status()).toBe(404);
      expect(await missing.text()).toContain("Nie znaleziono artykułu");
      expect(missing.headers()["content-type"]).toContain("text/html");
      expect(missing.headers()["cache-control"]).toBe("no-store");
      expect(missing.headers()["x-robots-tag"]).toBe("noindex");
    }
    for (const slug of ["upstream-failure", "malformed"]) {
      const failure = await request.get(`/blog/${slug}`, { headers: { "User-Agent": userAgent } });
      expect(failure.status()).toBe(503);
      expect(await failure.text()).toContain("Nie udało się wczytać bloga");
      expect(failure.headers()["retry-after"]).toBe("60");
    }
  }
  await request.post("http://127.0.0.1:4020/test-control/list-failure");
  try {
    // The index loads its list inside the page, after streaming may have started.
    expect((await request.get("/blog")).status()).toBe(200);
    expect((await request.get("/sitemap.xml")).status()).toBe(500);
  } finally {
    await request.delete("http://127.0.0.1:4020/test-control/list-failure");
  }
});

test("client navigation to an unpublished article shows a real 404 document", async ({
  page,
  request,
}) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");
  await request.post("http://127.0.0.1:4020/test-control/article-missing");
  try {
    const documentResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/blog/lokalna-praktyka") &&
        response.request().isNavigationRequest(),
    );
    await page
      .getByRole("link", { name: "Czytaj artykuł: Spokojna praktyka — przykład lokalny" })
      .click();
    expect((await documentResponse).status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nie znaleziono artykułu");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    await page.getByRole("link", { name: "Wróć do bloga", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");
  } finally {
    await request.delete("http://127.0.0.1:4020/test-control/article-missing");
  }
});

test("blog mirror serves artykuly paths with main-domain canonicals", async ({ request }) => {
  const headers = { host: "wiedza.joga.yoga" };
  for (const [path, canonical] of [
    ["/", "https://joga.yoga/blog"],
    ["/artykuly/lokalna-praktyka", "https://joga.yoga/blog/lokalna-praktyka"],
  ]) {
    const response = await request.get(path, { headers });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html.match(/<link rel="canonical"[^>]*>/g)).toEqual([
      `<link rel="canonical" href="${canonical}"/>`,
    ]);
    expect(html).toContain(
      path === "/" ? 'href="/artykuly/lokalna-praktyka"' : "Spokojna praktyka",
    );
  }
  for (const path of [
    "/artykuly/unknown",
    "/artykuly/unknown.with-dot",
    "/artykuly/unknown/nested",
    "/lokalna-praktyka",
    "/blog/lokalna-praktyka",
  ]) {
    const response = await request.get(path, { headers });
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('href="/">Wróć do bloga');
  }
  expect((await request.get("/artykuly/upstream-failure", { headers })).status()).toBe(503);
  expect((await request.get("/images/logo/logo-workshops.png", { headers })).status()).toBe(200);
});

test("sitemap uses the HTTP collection and stable backend modification dates", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain("<loc>https://joga.yoga/blog</loc>");
  expect(xml).toContain("<loc>https://joga.yoga/blog/lokalna-praktyka</loc>");
  expect(xml).toContain("<loc>https://joga.yoga/blog/pagination-22</loc>");
  expect(xml).toContain("<lastmod>2026-09-01T12:00:00Z</lastmod>");
  expect(xml).not.toContain("upstream-failure");
  expect(xml).not.toContain("/blog/problem/");
});

test("paginated HTML stays crawlable, canonical and bounded on both domains", async ({
  page,
  request,
}, testInfo) => {
  await request.post("http://127.0.0.1:4020/test-control/list-reads");
  const second = await request.get("/blog?page=2");
  expect(second.status()).toBe(200);
  const html = await second.text();
  expect(html.match(/<article\b/g)).toHaveLength(12);
  expect(html).not.toContain('href="/blog/lokalna-praktyka"');
  expect(html.match(/<link rel="canonical"[^>]*>/g)).toEqual([
    '<link rel="canonical" href="https://joga.yoga/blog?page=2"/>',
  ]);
  expect(html).toContain("strona 2 | joga.yoga</title>");
  expect(html).toMatch(/<a\b(?=[^>]*href="\/blog")(?=[^>]*rel="prev")/);
  expect(html).toMatch(/<a\b(?=[^>]*href="\/blog\?page=3")(?=[^>]*rel="next")/);
  expect(html).not.toMatch(/<meta name="robots" content="noindex/);
  expect(
    (await (await request.get("http://127.0.0.1:4020/test-control/list-reads")).json()).listReads,
  ).toBe(1);

  const mirror = await request.get("/?page=2", { headers: { host: "wiedza.joga.yoga" } });
  const mirrorHtml = await mirror.text();
  expect(mirrorHtml).toContain('<link rel="canonical" href="https://joga.yoga/blog?page=2"/>');
  expect(mirrorHtml).toMatch(/<a\b(?=[^>]*href="\/\?page=3")(?=[^>]*rel="next")/);
  expect(mirrorHtml).toContain('href="/artykuly/pagination-10"');

  await page.goto("/blog");
  await expect(page.locator("main article")).toHaveCount(12);
  await page
    .getByRole("navigation", { name: "Paginacja bloga" })
    .getByRole("link", { name: "Następna", exact: true })
    .click();
  await expect(page).toHaveURL(/\/blog\?page=2$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog – strona 2");
  await expect(page.locator('nav[aria-label="Paginacja bloga"] [aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('nav[aria-label="Paginacja bloga"] [aria-current="page"]')).toHaveText("2");
  await page.getByRole("link", { name: "Strona 3", exact: true }).click();
  await expect(page.locator("main article")).toHaveCount(1);
  await expect(page.locator('nav[aria-label="Paginacja bloga"] [aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('nav[aria-label="Paginacja bloga"] [aria-current="page"]')).toHaveText("3");
  await expect(page.getByRole("link", { name: "Następna", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("blog-last-page.png"), fullPage: true });
});

test("pagination normalizes duplicate first-page URLs and excludes invalid pages", async ({
  request,
}) => {
  for (const [path, host] of [
    ["/blog", "joga.yoga"],
    ["/", "wiedza.joga.yoga"],
  ]) {
    const headers = { host };
    const first = await request.get(`${path}?page=1`, { headers, maxRedirects: 0 });
    expect(first.status()).toBe(308);
    const destination = new URL(first.headers().location, first.url());
    expect(destination.pathname).toBe(path);
    expect(destination.search).toBe("");
    for (const query of ["page=0", "page=-1", "page=1.5", "page=nope", "page=1&page=2"]) {
      expect((await request.get(`${path}?${query}`, { headers })).status()).toBe(404);
    }
    const beyondEnd = await request.get(`${path}?page=99`, { headers });
    // The shared layout can start streaming before notFound(); Next adds noindex.
    expect(await beyondEnd.text()).toMatch(/<meta name="robots" content="noindex/);
  }
});
