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
