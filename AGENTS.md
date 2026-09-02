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
