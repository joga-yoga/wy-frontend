# Session Detail Modal — Cennik Row + Pricing Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline-collapsible "Cennik i dostęp" pricing section in the Session Detail Modal with a compact tappable row in the hero fact-cluster that opens the same pricing content as a bottom-sheet drawer.

**Architecture:** Single-file change to `SessionDetailModal.tsx`. The existing `PricingSection` function (accordion header + collapsible body) is replaced by a new `PricingRow` function that renders a tappable summary row plus a `Drawer` (vaul, via the existing `@/components/ui/drawer` wrapper) containing the same pass/sport-card list markup, unchanged. `PricingRow` is called from inside `ModalHeader` instead of from the divided section list further down.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, lucide-react icons, vaul (via `@/components/ui/drawer`).

## Global Constraints

- Copy is verbatim Polish, exact strings: `Cennik`, `· od {price}`, `Sprawdź karnety i karty sportowe`, `Cennik i dostęp`, `Pojedyncze wejście`, `Bez karnetu i karty sportowej`, `Pokaż wszystkie karnety (+{N})`, `Akceptujemy karty sportowe. Przy niektórych kartach może obowiązywać dopłata za wejście.`, `dopłata {X} zł`, `bez dopłaty`.
- `{min}` price anchor = `studio.drop_in_price` only. No fallback to a computed per-entry karnet rate. If `null`/`undefined`, omit the `· od {price}` fragment entirely — never fabricate a price.
- No change to any other modal section (header facts, instructor, language, description, location, CTA, states, cancellation flow). Booking flow unaffected.
- Reuse existing helpers verbatim — do not modify `@/components/page-contents/studio/pricingHelpers` (`formatMoney`, `perEntry`, `discountPercent`, `LightPassTile`).
- **No component test framework exists in `wy-frontend`** (no jest/vitest/RTL — `package.json` has no `test` script; the few `*.test.ts` files in this repo are plain `node:assert` scripts for pure utility functions, not components). Verification for this change is: `yarn lint`, `yarn build` (catches type errors), and manual browser check via `yarn dev` per the project's UI-change convention. This is intentional, not a gap to fill.

---

### Task 1: Replace the inline pricing accordion with a `PricingRow` (row + drawer)

**Files:**
- Modify: `src/app/(public)/studio/[slug]/schedule/SessionDetailModal.tsx:1-46` (imports)
- Modify: `src/app/(public)/studio/[slug]/schedule/SessionDetailModal.tsx:205-281` (`ModalHeader`)
- Modify: `src/app/(public)/studio/[slug]/schedule/SessionDetailModal.tsx:508-672` (`minPrice` + `PricingSection` → replaced by `PricingRow`)
- Modify: `src/app/(public)/studio/[slug]/schedule/SessionDetailModal.tsx:1129-1134` (remove old call site)

**Interfaces:**
- Consumes (unchanged, already imported in this file): `formatMoney`, `discountPercent`, `LightPassTile`, `perEntry` from `@/components/page-contents/studio/pricingHelpers`; `Drawer`, `DrawerContent` from `@/components/ui/drawer`; types `OccurrenceDetail`, `OccurrenceDetailStudioPass`, `OccurrenceDetailStudioSportCardAcceptance` from `./types`; `cn` from `@/lib/utils`; `WyImage` from `@/components/custom/WyImage`.
- Produces: `PricingRow({ studio }: { studio: OccurrenceDetail["studio"] })` — a self-contained component (owns its own `isOpen`/`showAllPasses` state), rendered by `ModalHeader`. No other task depends on this — it's the last task in this plan.

- [ ] **Step 1: Update the icon imports**

In the `lucide-react` import block at the top of the file, remove `ChevronDown` (no longer used anywhere in the file after this change) and add `Wallet`:

```tsx
import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  ClockAlert,
  DoorOpen,
  Flower2,
  Languages,
  Share2,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
```

- [ ] **Step 2: Add `DrawerTitle` to the drawer import**

Change:

```tsx
import { Drawer, DrawerContent } from "@/components/ui/drawer";
```

to:

```tsx
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
```

- [ ] **Step 3: Delete `minPrice()` and the old `PricingSection` function**

Delete the entire block from the `// ── Pricing section (T07) ──` comment through the end of `PricingSection` (current lines 508–672):

```tsx
// ── Pricing section (T07) ─────────────────────────────────────

function minPrice(studio: OccurrenceDetail["studio"]): number | null {
  const values = [studio.drop_in_price ?? null, ...studio.passes.map((p) => p.price)].filter(
    (v): v is number => v != null,
  );
  if (values.length === 0) return null;
  return Math.min(...values);
}

function PricingSection({ detail }: { detail: OccurrenceDetail }) {
  // ... (entire existing body)
}
```

Replace it with the new `PricingRow`:

```tsx
// ── Pricing row + drawer (T07) ─────────────────────────────────

function PricingRow({ studio }: { studio: OccurrenceDetail["studio"] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllPasses, setShowAllPasses] = useState(false);
  const hasDropIn = studio.drop_in_price != null;
  const hasPricing = hasDropIn || studio.passes.length > 0;
  const hasSportCards = studio.accepts_sport_cards != null;
  if (!hasPricing && !hasSportCards) return null;

  const passLimit = hasDropIn ? 2 : 3;
  const visiblePasses = showAllPasses ? studio.passes : studio.passes.slice(0, passLimit);
  const hiddenPassCount = studio.passes.length - passLimit;

  return (
    <>
      <div className="border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-900">
              Cennik
              {hasDropIn && (
                <span className="ml-1 text-sm font-normal text-gray-500">
                  · od {formatMoney(studio.drop_in_price, studio.currency)}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500">Sprawdź karnety i karty sportowe</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
        </button>
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <div className="flex items-center justify-between px-4 pb-3 pt-2">
            <DrawerTitle className="text-lg font-semibold text-gray-900">
              Cennik i dostęp
            </DrawerTitle>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Zamknij"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 pb-6">
            <div className="space-y-4">
              {hasPricing && (
                <div className="divide-y divide-gray-100">
                  {hasDropIn && (
                    <div className="flex items-center gap-4 py-3">
                      <LightPassTile sessionCount={1} durationDays={0} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">Pojedyncze wejście</h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Bez karnetu i karty sportowej
                        </p>
                      </div>
                      <span className="shrink-0 text-base font-semibold text-gray-900">
                        {formatMoney(studio.drop_in_price, studio.currency)}
                      </span>
                    </div>
                  )}
                  {visiblePasses.map((pass: OccurrenceDetailStudioPass) => {
                    const entry = perEntry(pass);
                    const discount = discountPercent(pass, studio.drop_in_price);
                    return (
                      <div key={pass.id} className="flex items-center gap-4 py-3">
                        <LightPassTile
                          sessionCount={pass.session_count}
                          durationDays={pass.duration_days}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{pass.name}</h3>
                            {discount != null && (
                              <span className="text-xs font-semibold text-emerald-600">
                                −{discount}%
                              </span>
                            )}
                          </div>
                          {entry != null && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {formatMoney(entry, pass.currency || studio.currency)}/wejście
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-base font-semibold text-gray-900">
                          {formatMoney(pass.price, pass.currency || studio.currency)}
                        </span>
                      </div>
                    );
                  })}
                  {!showAllPasses && hiddenPassCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllPasses(true)}
                      className="w-full py-3 text-center text-sm font-medium text-gray-900"
                    >
                      Pokaż wszystkie karnety (+{hiddenPassCount})
                    </button>
                  )}
                </div>
              )}

              {hasSportCards && (
                <div>
                  <p className="mb-2 text-xs text-gray-500">
                    Akceptujemy karty sportowe. Przy niektórych kartach może obowiązywać dopłata za
                    wejście.
                  </p>
                  {studio.sport_card_acceptances.map(
                    (item: OccurrenceDetailStudioSportCardAcceptance, i: number) => {
                      const name = item.sport_card?.name ?? item.name ?? "Karta sportowa";
                      const photo = item.sport_card?.photo ?? item.photo ?? null;
                      const hasFee = item.fee != null && item.fee > 0;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-3 py-2.5",
                            i > 0 && "border-t border-gray-100",
                          )}
                        >
                          <div className="relative flex h-8 w-11 shrink-0 items-center justify-center overflow-hidden rounded bg-[#F5F3EE]">
                            {photo ? (
                              <WyImage
                                src={photo}
                                alt={name}
                                width={44}
                                height={32}
                                className="h-8 w-11 object-fill"
                              />
                            ) : (
                              <span className="text-[10px] font-semibold text-gray-400">
                                Karta
                              </span>
                            )}
                          </div>
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                            {name}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 text-xs",
                              hasFee ? "text-gray-500" : "font-medium text-emerald-600",
                            )}
                          >
                            {hasFee
                              ? `dopłata ${formatMoney(item.fee, studio.currency)}`
                              : "bez dopłaty"}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
```

Note: the row's own wrapper only carries `border-t border-gray-100 pt-3` (no `mt-*`) — the gap above it comes from `ModalHeader`'s existing `space-y-4` wrapper (Step 4), so the divider doesn't get doubled spacing.

- [ ] **Step 4: Render `PricingRow` from inside `ModalHeader`, after the instructor-change banner**

In `ModalHeader` (current lines 205–281), the last block before the closing `</div>` is:

```tsx
      {showInstructorChange && detail.previous_instructor_name && (
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
          <span>Zastępstwo na tych zajęciach</span>
        </div>
      )}
    </div>
  );
}
```

Add `<PricingRow studio={detail.studio} />` right after that block, still inside the `space-y-4` container:

```tsx
      {showInstructorChange && detail.previous_instructor_name && (
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
          <span>Zastępstwo na tych zajęciach</span>
        </div>
      )}

      <PricingRow studio={detail.studio} />
    </div>
  );
}
```

- [ ] **Step 5: Remove the old `PricingSection` call site from the divided section list**

In the root component's render (around line 1129–1134), change:

```tsx
          <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100">
            <InstructorSection detail={detail} />
            <AboutClassSection detail={detail} />
            <PricingSection detail={detail} />
            <StudioSection studio={detail.studio} />
          </div>
```

to:

```tsx
          <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100">
            <InstructorSection detail={detail} />
            <AboutClassSection detail={detail} />
            <StudioSection studio={detail.studio} />
          </div>
```

- [ ] **Step 6: Lint and type-check**

Run: `cd wy-frontend && yarn lint`
Expected: no errors (in particular, no "unused import" for `ChevronDown`, no "PricingSection is not defined" reference errors).

Run: `cd wy-frontend && yarn build`
Expected: build succeeds — confirms `PricingRow`'s JSX and prop types (`OccurrenceDetail["studio"]`, `OccurrenceDetailStudioPass`, `OccurrenceDetailStudioSportCardAcceptance`) type-check cleanly.

- [ ] **Step 7: Manual verification in the browser**

Run: `cd wy-frontend && yarn dev`, open a studio schedule page (`/studio/[slug]/schedule`), click a session to open the Session Detail Modal. Check each state below (use studios/sessions with different pricing data if available, or temporarily edit `OccurrenceDetail` mock data via the network tab / a test studio):

1. **Studio with drop-in price + passes + sport cards:** row shows `Cennik · od {drop_in_price}`, subtitle `Sprawdź karnety i karty sportowe`, wallet icon tile, chevron. Row sits directly below "Wolne miejsca" (and below the amber "Zastępstwo" banner if present) with a visible divider above it, and above the cancellation strip / CTA.
2. **Tap the row:** bottom sheet opens over the dimmed modal with grabber, title "Cennik i dostęp" + × button, drop-in row, pass rows with discount %/per-entry/total, sport-cards block.
3. **Dismiss the drawer** three ways — tap ×, tap the scrim, swipe down — confirm each returns to the modal (not closing the whole modal).
4. **Studio with >2 passes (or >3 with no drop-in):** confirm "Pokaż wszystkie karnety (+N)" appears and reveals the rest on tap.
5. **Studio with no `drop_in_price`, only passes:** row title is plain `Cennik` (no `· od` fragment); drawer still lists passes correctly.
6. **Studio with `accepts_sport_cards` false/null and no passes/drop-in:** confirm the whole row is absent (`hasPricing && hasSportCards` both false).
7. **Long content (many passes + many sport cards):** confirm the drawer body scrolls internally (`overflow-y-auto`) instead of the sheet overflowing the viewport.
8. Confirm no other modal section changed (header facts, instructor, about, studio, location, CTA, cancellation strip, cancel sheet) by comparing against the previous behavior.

If any state can't be reproduced with real data, say so explicitly rather than skipping silently.

- [ ] **Step 8: Commit**

```bash
cd wy-frontend
git add "src/app/(public)/studio/[slug]/schedule/SessionDetailModal.tsx"
git commit -m "$(cat <<'EOF'
feat: replace pricing accordion with Cennik row + drawer in session modal

Compact hero-row summary opens the existing pricing/sport-card content
as a bottom sheet instead of expanding inline.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
