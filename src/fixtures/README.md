# Fixtures

Deterministic persona data shared by the prototype workbench (`proto/`) and the Playwright mock
API server (`tests/e2e/mock-instructor-api.mjs`).

Built by `.plans/proto-workbench/` T04.

## Rules

1. **Plain data only.** No React, no `axiosInstance`, no `fs`, no side effects. These modules are
   imported into the client bundle by prototypes and into a Node script by the mock server.

2. **Every export is annotated with a real product type**, imported from the route that owns it.
   This is the mechanism that enforces the design protocol's hardest rule — *"Never invent data. A
   prototype may only show fields that exist"* (`spec-design-skills.md` §4). An invented field is a
   compile error, not a judgement call. If a persona wants something no type provides, that is a
   **finding to surface**, not a type to write.

3. **One coherent world.** Ids cross-reference: the client holding a pass appears in the visits;
   the session in the schedule week is the session the front desk shows; the B2C persona's bookings
   point at those same occurrences. Incoherent fixtures produce prototypes that quietly lie, which
   is the exact failure this layer exists to prevent.

4. **Deterministic.** No `Date.now()`, no randomness, no locale-dependent formatting. All dates are
   fixed ISO strings anchored to `TODAY`. Two runs a month apart must produce identical screenshots
   — that is what makes a design-review agent's critique reproducible.

5. **Polish copy, real forms** (`product-language`): frozen glossary (Wyjazd / Wydarzenie / Kurs /
   Zajęcia / Oferta), gender-neutral noun forms, "no-show" never in UI copy. No placeholders — a
   `"Test User"` hides the layout problem a 28-character Polish name would have revealed.

## The world

**B2B — Bodhi Yoga Shala**, a studio in Łódź. Four instructors spanning the roster states, six
clients spanning every `ChipState`, passes spanning every `WalletState`, a full week of sessions
around `TODAY` (2026-09-09, a Wednesday), and a front desk with money owed, a paid-without-seat
casualty and a review item.

**B2C — Marta Zielińska**, client `u-marta`, who is also row 2 of the studio's client list. Her
bookings point at the same occurrences the partner sees in Grafik, and her pass is the same pass
row the studio's client detail shows.
