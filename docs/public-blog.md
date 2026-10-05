# Public article blog

Routes: `/blog` and `/blog/{slug}`, inside the existing public layout. The footer links to
the blog in each public variant. Every published item has native HTML links from the list;
there is no search, CMS or editorial interface.

## Backend contract

Implemented against the actual sibling backend code inspected on 2026-10-02:
`src/app/api/articles.py`, `schemas/article.py`, `services/article_public.py`,
`crud/article.py` and registration in `api/main.py`. The older backend `docs/articles.md`
still described persistence without HTTP routes at the time of inspection; the registered
routes and public response schemas are the contract used here. No provisional endpoint paths.

- `GET /public/articles`: `{ total: number, items: PublicArticleSummary[] }`. Returns **all**
  published articles ordered by title, then slug. No pagination parameters, cursors or limits.
- `GET /public/articles/{slug}`: published-only detail. Unknown, draft and archived articles
  return HTTP 404 with `{ detail: "Article not found" }`. Other HTTP failures, network errors,
  timeouts, mismatched slugs and malformed payloads are service failures, not missing content.
- Summary fields: `slug`, `title`, `description`, `lead`, `canonical_url`, `updated_at`,
  nullable `published_at`. ISO date strings correspond to timezone-aware backend datetimes.
- Detail adds `content`, `seo_metadata`, `citations: string[]`, nullable `author: { name }`.
- Content: `format: "structured_sections"`, `lead`, `headline`,
  `sections: { title, body }[]`, optional/default-empty `faq: { question, answer }[]`,
  optional nullable `medical_disclaimer`. Extra backend content properties are tolerated.
- SEO fields: `title`, `description`, optional nullable `robots`. Historical source canonicals
  are never used. The final public route determines the self-canonical.
- Topic, taxonomy, image/media and source-created/source-modified fields are **not exposed**
  by the public API, so the frontend does not invent them. Author and publication date are
  omitted when absent. `updated_at` is shown explicitly as an update date, not a publication date.
- The complete list supplies sitemap slugs and stable `updated_at` values. The sitemap does
  not manufacture modification dates. It fails on an article API outage rather than returning
  a successful sitemap that silently loses article URLs. Unrelated sitemap groups are unchanged.

`src/app/(public)/blog/api.ts` owns endpoint paths, HTTP access and response adaptation.
`types.ts` validates both real responses and local fixtures with the same Zod schemas.
All article HTTP calls use `src/lib/axiosInstance.ts`; no database connection or backend
publication dataset import is used by the frontend.

The current content contains plain text and Markdown. The focused server renderer supports
paragraphs, unordered/ordered/nested lists, emphasis, inline code, fenced code, quotations,
body headings, Markdown links and URL autolinks. Raw HTML is escaped; unsafe URL protocols
are not linked. Body headings start at H3; section titles use H2 and the article title is the
only H1. The supplied headline is retained as a subtitle. FAQs and citations remain visible
without client interaction. Disclaimers appear only when supplied and nonblank.

## Local configuration

Install the existing dependencies with `yarn install`. In `.env.local`:

```dotenv
NEXT_PUBLIC_API_ENDPOINT=http://localhost:8000
# Optional existing server-side override for a different backend origin:
# API_ENDPOINT=http://127.0.0.1:8000
```

Run `yarn dev`, then open `/blog`. API_ENDPOINT takes precedence on the server; otherwise
the shared NEXT_PUBLIC_API_ENDPOINT setting is used. Do not put secrets into public variables.
The API base origin must be reachable by the Next server, including in production.

For synthetic local previews, explicitly add:

```dotenv
BLOG_USE_LOCAL_FIXTURES=1
```

Restart `yarn dev` after changing environment values. Delete that setting or set it to `0`
to return to real HTTP data. Fixtures only work with NODE_ENV=development. A production
build/server always uses HTTP even when the fixture flag is set. The sitemap always uses
HTTP, including in development. An API outage never triggers a fallback to fixtures.

The three fixtures cover ordinary practice without a disclaimer, multiple sections and
lists, FAQ/citations with a supplied disclaimer, and absent author/publication date/media.
These are clearly labelled local examples, not publication content.

## Status and freshness

Next's existing cacheComponents configuration and global layouts are unchanged. Blog pages
read fresh public data after `connection()`; React `cache` deduplicates article reads between
metadata and content within the render. No persistent article cache or global revalidation
setting is introduced, so edits are visible on the next server request.

The public layout has a streaming Suspense boundary. `src/proxy.ts` therefore checks blog
availability before streaming and returns a complete HTML error document directly
with HTTP 404 or 503, no-store, and noindex. Rewriting to a streamed page can lose the status,
so error responses bypass App Router rendering. Client navigation falls back to a document
request and shows the same error page with a link back to the blog. Service errors additionally
carry Retry-After. Internal error targets have been removed. The blog root is reserved in
directory routing; dots in unknown article slugs also pass through the blog status guard.
The status guard and render perform separate fresh API reads. An outage between those reads
is handled by the blog error boundary; production HTTP verification must include this
streaming behavior. Diagnostic logs contain status/code/validation paths, not article bodies,
credentials or axios request configuration.

## Verification commands

```sh
yarn typecheck
yarn test:blog
yarn eslint 'src/app/(public)/blog' tests/blog playwright.blog.config.ts src/proxy.ts src/app/sitemap.ts src/lib/directoryRouting.ts src/lib/directoryRouting.test.ts src/components/layout/Footer.tsx
yarn build
yarn playwright test --config playwright.blog.config.ts
```

The Playwright suite starts an isolated HTTP contract stub and **the production frontend**
on ports 4020/3220. It checks native server HTML, all article links, one H1, formatting,
optional details/disclaimers, metadata/canonicals, 404 versus 503 (browser and crawler user
agents), malformed responses, sitemap dates and production fixture isolation. Desktop and
mobile projects capture listing, long-article and FAQ screenshots. It must not be pointed
at production or share a backend with other development tasks.

`node --import tsx tests/blog/preview.tsx` optionally generates standalone component HTML in
`/tmp/joga-blog-preview/` with the real Tailwind stylesheet and a system font. These files are
for inspecting component layout; they do not verify the shared layout or HTTP behavior.

## Recorded verification in this environment

- Passed: focused blog regression script, static server-rendered article/list HTML, existing
  SEO and directory-routing regression scripts, lint of touched code, scoped TypeScript check
  covering blog files, tests, proxy and sitemap; no blog type errors.
- Full typecheck is blocked by missing installed `@radix-ui/react-toggle` and
  `@radix-ui/react-toggle-group`, plus the resulting existing implicit-any in
  `ReviewRecords.tsx`. Both packages are already declared in package.json.
- Dependency installation failed because npm registry DNS/network access is unavailable.
- `yarn build` could not complete here; the webpack production-build diagnostic reported
  the missing existing packages and blocked downloads of Inter/Hind Siliguri from Google
  Fonts. No existing dependencies or application fonts were replaced to hide these failures.
- Production HTTP tests and desktop/mobile screenshots remain pending: this sandbox rejects
  local server binds with EPERM. The browser also rejected file:// preview URLs under its
  URL security policy. Static previews were generated, but not visually inspected.
- Real backend HTTP integration is pending. The configured local article endpoint was not
  reachable from this environment. Schema inspection and synthetic fixtures are the evidence
  used so far; this is not a claim of integration with the consolidated published collection.

## Connect the completed backend before release

1. Make the backend API and edited, consolidated published data available locally. Disable
   BLOG_USE_LOCAL_FIXTURES. Confirm the above contract, complete published-only list, date
   serialization and unknown/draft/archived 404s. If the contract changes, align api.ts/types.ts.
2. Restore/install the project's existing dependencies, then run the full typecheck, production
   build and isolated production HTTP suite above. Install the Playwright Chromium browser
   if it is not already available (`yarn playwright install chromium`).
3. Start the production build against the real local backend (`yarn start`). Inspect `/blog`
   and representative ordinary, long, disclaimer, FAQ/citation and missing-optional-field
   articles from the consolidated collection on desktop and mobile. Confirm no text editing
   occurred in the renderer and all published articles have crawlable links.
4. Check actual production-build HTTP responses with curl: existing detail/list 200, unknown
   and unpublished 404, service outage 503. Verify source HTML contains the main article text,
   exactly one self-canonical, truthful metadata, sitemap URLs and backend modification dates.
   Check article updates on a subsequent request. Exercise a failure between the proxy check
   and render as well as a sustained outage.
5. Confirm the root sitemap reads only real HTTP data with fixtures enabled and disabled.
   Restore any local outage simulation after checks.

**Release dependency:** the backend API and edited publication dataset must be available
before releasing this frontend. This task performs no push, PR creation, merge or deployment.

## Local review checkout

The original checkout's `.git` directory is read-only in this execution environment. Source
changes are preserved there, and a separate local checkout at
`/private/tmp/wy-frontend-public-blog-review` contains the commits on `feat/public-article-blog`.
That checkout's origin is copied from the original repository. Review/push can be performed
from that checkout after the outstanding checks, or its commits can be imported locally.
No original Git refs or index were modified.
