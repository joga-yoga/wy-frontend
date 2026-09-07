# The prototype workbench shell

Dev-only. Routes live in `src/app/proto/` as `*.proto.tsx` files, which are routes **only** while
`next dev` is running — `pageExtensions` in `next.config.mjs` includes `"proto.tsx"` for
`PHASE_DEVELOPMENT_SERVER` and nothing else.

For authoring prototypes, see `proto/README.md`. For which product components render here, see
`PORTABILITY.md` beside this file.

## How it fits together

| File | Role |
|---|---|
| `registry.ts` | reads `proto/` from disk each request; validates `meta.json`; cross-checks it against the files actually there |
| `meta.ts` | the `meta.json` contract, and validation that degrades instead of throwing |
| `Frame.tsx` | the one frame — 396px default, `meta.width` override, per-mode isolation |
| `VariantRenderer.tsx` | resolves a variant module, wrapped in Suspense and an error boundary |
| `VariantErrorBoundary.tsx` | renders a failure inside its own frame, leaving siblings alone |
| `FixtureProviders.tsx` | the single fixture-driven provider wrapper; blocks all network |
| `badges.tsx` | mode / status / outcome / unresolved / no-control chips |

Discovery is two mechanisms: **filesystem** for metadata, **bundler** for variant modules. They can
disagree, so `registry.ts` treats `meta.json` as the ordering authority and reports any `.tsx` on
disk it does not list, plus any listed file that is missing. Neither is hidden.

## Three things that will bite you

**1. `page.tsx` instead of `page.proto.tsx` ships the shell to production.** This is the single most
dangerous mistake in the whole feature. `yarn proto:verify` fails loudly on it, and CI runs that on
every PR.

**2. The dynamic import's `.tsx` suffix is load-bearing.**

```ts
await import(`../../../../proto/${folder}/${slug}.tsx`)
```

Turbopack builds its context module from the static prefix **and** suffix. Drop the suffix and the
context becomes every file under `proto/` — then the first `README.md` or `before.png` in a
prototype folder takes down every route with `Unknown module type`. Both are files the brief expects
those folders to contain.

**3. `cacheComponents: true` bans `export const dynamic`.** Use `await connection()` instead, and
keep it under a `<Suspense>` boundary — hence the sync-shell / async-body shape of all three routes.

## Styling

`proto.css` is a second, independent Tailwind build (`source(none)` plus explicit `@source` lines)
that imports `src/styles/tokens.css` for the product's real theme. `globals.css` carries a permanent
`@source not "../../proto"`, so prototype classes can never reach the production stylesheet.

`proto.css` has exactly one importer, `layout.proto.tsx`. **Do not add a second.** Next only runs
PostCSS on CSS reachable from the module graph, and that single dev-only importer is what keeps the
whole prototype class surface out of production.

## The three CI checks

| Check | Proves | Criterion |
|---|---|---|
| route table + module markers + shell marker in `.next/` | no prototype route or code in a production build | 2 |
| sentinel class absent from `.next/static/chunks/*.css` | no prototype classes in the production stylesheet | 3 |
| `tsc --noEmit` over `proto/` | the archive still compiles against current product types | D4 |

All three were verified **by being made to fail** — a rename to `page.tsx`, removing the
`@source not` line, and a type error in a prototype. That matters: the first draft of the criterion-3
check pointed at `.next/static/css/`, which does not exist, and reported a pass. A check that has
never been observed failing is not known to work.

`proto/2026-09-03-spike` carries both sentinels — the marker strings and one `bg-fuchsia-*`
utility. Do not delete it.

**Never write that class name in full outside `proto/`.** Tailwind's scanner extracts candidates
from prose too, so spelling it out in a comment or a doc under `src/` generates the rule and the
criterion-3 check fails — which is exactly how this paragraph came to be worded like this.
`proto:verify` guards the sentinel for that reason.
