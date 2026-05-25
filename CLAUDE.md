# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI), axios, Yarn 4.

## Local Development
```bash
yarn install
yarn dev      # http://localhost:3000
yarn lint     # ESLint + auto-fix
yarn build
yarn start
```

## Architecture

This frontend serves two product domains in one app:
- **Workshops** (`wydarzenie` / yoga workshops) — routes under `src/app/workshops/`
- **Retreats** (`wyjazdy` / trips) — routes under `src/app/retreats/`

Keep domain logic, labels, routing, and types clearly separated per domain. Reuse shared infrastructure where possible.

```
src/
  app/
    workshops/       # workshops domain routes (App Router)
    retreats/        # retreats domain routes (App Router)
    profile/         # user profile
    api/             # Next.js API routes (thin proxies if any)
  components/
    ui/              # shadcn/ui primitives — reuse before creating new ones
  lib/
    axiosInstance.ts # THE HTTP client — use this for all backend calls
    schemas/         # shared Zod schemas
    *.ts             # helpers (formatting, SEO, feature flags, etc.)
  context/           # shared React contexts
```

## HTTP Client
Always use `src/lib/axiosInstance.ts`. It wires up:
- `NEXT_PUBLIC_API_ENDPOINT` as base URL (with optional same-host resolution via `NEXT_PUBLIC_API_USE_SAME_HOST=1`)
- Bearer token from `localStorage` (`access_token`) on every request

Never create ad-hoc `fetch` or `axios` instances inside components or feature files.

## Conventions
- Default to **server components**; add `"use client"` only when interactivity requires it.
- Co-locate feature-specific types in a `types.ts` beside the route and keep them aligned with backend Pydantic schemas.
- Use `src/components/ui/*` before creating new UI primitives.
- Avoid `any`; use `unknown` + type guards when input shape is uncertain.
- Use descriptive state names: `isOpen`, `isLoading`, `hasItems`.

## Adding a Feature
Create route folder under `src/app/(domain)/feature/` → reuse shared UI from `components/ui/` → call backend via `axiosInstance` → co-locate `types.ts` aligned with backend schemas.
