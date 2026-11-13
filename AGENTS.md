# AGENTS.md

## Scope
- This file applies to `wy-frontend/**`.
- Stack: Next.js App Router, TypeScript, axios, Tailwind CSS, shadcn/ui.

## Product Context
- This frontend serves two similar but different product domains in one app:
- Yoga workshops (`wydarzenia`)
- Retreats / trips (`wyjazdy`)
- Reuse shared UI and infrastructure where possible, but keep domain logic, labels, routing, and types clearly separated per domain.

## Core Conventions
- Keep edits small, composable, and consistent with existing patterns.
- Prefer feature-first organization under `src/app/(feature)/...`.
- Reuse shared UI from `src/components/ui/*` and shared icons/helpers.
- Keep server vs client components appropriate; default to server components unless client interactivity is required.
- Co-locate feature-specific types in `types.ts` and keep them aligned with backend schemas.

## Routing and Structure
- Create routes using App Router conventions under `src/app/(feature)/...`.
- Keep feature-specific components near their route.
- Put shared contexts under `src/context/*`.
- Keep modules focused; split large files into cohesive units.

## API and Environment
- Use `src/lib/axiosInstance.ts` for all HTTP requests.
- Do not create ad-hoc `fetch`/`axios` clients inside components.
- Centralize interceptors, base URL, and auth/error handling in `axiosInstance`.
- Configure API URLs/secrets via `.env.local`; never hardcode them.
- Prefer typed request/response models that match backend Pydantic schemas.

## Tone of Voice (public copy)

A studio's or instructor's public page belongs to **them**, not to joga.yoga. Copy there must
read as if the owner wrote it, so visitors never feel they are reading a directory entry a
third party maintains about the owner.

**Owner voice — profile and presentation copy.** Anything describing who the owner is, what
they offer, or how to reach them:
- Studio pages speak as **"my / nas / nasze"** — "Nie przyjmujemy kart sportowych",
  "Znajdziesz nas też tutaj".
- Instructor pages speak as **"ja / mnie / moje"** — "Prowadzę zajęcia w językach",
  "Style, których uczę", "Napisz do mnie".
- This includes `aria-label`, `alt` and `placeholder` text. Assistive-tech copy is copy.

**Platform voice — everything else.** Keep the neutral, third-person register for:
- Transactional and system copy where joga.yoga is genuinely the actor (payment failures,
  "Nie udało się odwołać rezerwacji", validation).
- Empty states for profiles that have **no owner yet** — "Ten nauczyciel nie ma jeszcze
  publicznego profilu". There is nobody to speak in first person.
- `metadata` descriptions and other SEO chrome. The audience is a crawler, not a visitor.

### Rules that are easy to get wrong

- **Never write "To studio…" / "Ten nauczyciel…" on that owner's own page.** This is the exact
  distancing the rule exists to prevent. If the owner has a profile, they speak for themselves.
- **Check whether the component is shared before switching to "my".** `SessionDetailDrawer`
  renders on studio *and* instructor schedules; on an instructor's page "we" would refer to
  whichever studio hosts the session, not the profile owner. Where a component spans owners,
  **drop the third-person actor instead of inventing a "we"** — name the outcome for the
  reader ("Twoje miejsce wróci do puli") rather than an internal handoff ("Damy znać studiu").
- **Polish gender.** First-person *plural* is gender-neutral, so studio copy is safe. Instructor
  copy is singular and past-tense forms are gendered (`prowadziłam` / `prowadziłem`) — stay in
  the present tense, or use a gender-neutral construction. Never guess the owner's gender.
- **Section headings stay neutral labels** — "Zajęcia", "Cennik", "Udogodnienia", "Instruktorzy".
  The voice lives in sentences, not in nav furniture.
- Some user-facing copy is generated **server-side** (e.g. `cancellation_policy_text` from
  `wy-backend/src/app/services/booking.py`, and HTTP 400 `detail` strings, which the frontend
  displays verbatim). The same rules apply there.

## TypeScript and Naming
- Use strict, explicit typing; avoid `any`.
- Use `unknown` plus type guards when needed.
- Component names: `PascalCase`.
- File/folder naming: follow existing local convention (typically `kebab-case` for folders/files).
- Use descriptive state names such as `isOpen`, `hasItems`, `isLoading`.

## UI and Performance
- Prefer existing shadcn/ui patterns before creating new UI primitives.
- Hind Siliguri is the only product font, including forms, dialogs, maps, error pages and prototypes. Do not introduce Inter or other font families.
- Use the shared font tokens in `src/styles/tokens.css`; standalone HTML uses `src/lib/typography.ts`.
- Keep Tailwind styling declarative and avoid deep specificity.
- Avoid unnecessary re-renders; use memoization only where it clearly helps.
- Use dynamic imports/code splitting for heavy client-only components when appropriate.

## Local Development
- Requirements: Node.js, Yarn.
- Install deps: `yarn install`
- Start dev server: `yarn dev`
- Lint/fix: `yarn lint`
- Build production: `yarn build`
- Start production build: `yarn start`

## References
- Project readme: `wy-frontend/README.md`
- HTTP client: `wy-frontend/src/lib/axiosInstance.ts`
- Shared UI: `wy-frontend/src/components/ui/*`

## Studio catalogue and onboarding contract (H-365)

- Present one catalogue with unowned listings and ordinary owner-managed Studios, reached through search/claim, manual creation or import. Reuse the existing shared editor, save APIs, account drafts and ownership flow; do not build a separate claim wizard.
- For an already-public pending claim, immediately prefill the exact existing slug and all supported source business fields, including prices, pass definitions, address/premises and geo data. Do not regenerate its slug from the name. Preserve user edits when repairing incomplete drafts or receiving optional results.
- Use authoritative source publication state. Pending claims of public profiles show `Zapisz` and optionally `Zobacz profil`, not a publish/unpublish action. Preview opens the current public profile without unsaved edits. Genuinely new/unpublished profiles retain existing publication behavior; the ordinary owner editor remains ordinary after claim.
- Opening a populated editor does not grant ownership. Keep registration/instant Partner and phone verification where they already belong: SMS only before the first actual save/claim/import start for an unverified account, followed by continuation of the same intent and values. No extra ownership verification or Verified badge.
- Source catalogue/parsing is distinct from one background enrichment attempt per active pending claim. Reload/navigation/login/SMS/polling must not start another attempt. Enrichment may improve unedited pending-draft fields but must never update managed Studio content after ownership; backend enforcement is required, not just a UI guard.
- Failure/unconfigured enrichment leaves source data and the manual path usable. Do not wait for it or add new blocking steps. Do not investigate provider keys or build a new parser/sync mechanism for this task.
- Preserve one public URL, visible content, map and city membership across claim. Eligible manually created Studios must join the same public lists/counts exactly once. Respect owner-edited addresses; a building/address match is only a candidate for distinct premises/businesses.
- Preserve the completed Fitssey menu: one standalone main-menu `Przenieś studio z Fitssey`, X with `Ukryj / Anuluj`, persistent per-account dismissal. No editor checkbox, per-studio promotion, undo/restore, timer or automatic reappearance. Keep required existing-job/editor navigation.
- Keep Polish UI natural (`Lokalizacja`, `Adres`, `Cennik`, `Karnety`, `Grafik zajęć`); do not expose claim/job terminology or promise unsupported customer-data transfer.
- Full task/acceptance details: `../H-365-IMPLEMENTATION.md` and Linear H-365; read the latest `../H-365-HANDOFF.md`. Preserve unrelated diffs, use isolated mutation-test databases, do not start real provider jobs, and do not push/merge/deploy without authorization.


## Regular-template pricing (H-367)

- Authoritative specification: [latest H-367](https://linear.app/halamaga/issue/H-367). It supersedes H-366 and all older pricing plans. Read `../PRICING-HANDOFF.md` for actual progress.
- [H-368](https://linear.app/halamaga/issue/H-368) takes precedence for trial: server-enforced first booking per user/studio/template; timely customer and organizer cancellation restore eligibility, late cancellation/no-show/check-in undo do not. Eligible trial is automatic; optional pass purchase uses the standalone flow without consuming an entry.
- One ordinary entry override (amount + currency, optional name/conditions) and automatic eligible first-trial selection per regular template/studio. Labels/trial alone preserve live studio inheritance. Reuse existing template, booking, payment, reception and check-in flows; preserve solo terms.
- No new tariffs, source imports/backfills, pass applicability, per-date pricing, general eligibility engine or schedule rewrite. Preserve H-365 claim/catalogue/late-SMS and Fitssey contracts.
- Use isolated databases and mocked providers; shared data/runtime/queues remain untouched and the shared worker stays stopped. No reset, new branch, commit, push or deploy. Update the checkpoint after each stage with fresh evidence and remaining checks.
