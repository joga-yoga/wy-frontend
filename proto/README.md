# Prototypes

Dev-only. Browse at **http://localhost:3000/proto** while `yarn dev` is running.

These folders are committed on purpose. Six months on, the useful question is what was rejected and
why — not what was drawn.

## Adding one

Create a folder and it appears in the index. There is no registration step, no generated registry,
and nothing to restart.

```
proto/2026-09-14-grafik-rows/
  meta.json
  a-inline.tsx
  b-drawer.tsx
  before.png        # optional: the current live screen, for a redesign
```

Folder names are `YYYY-MM-DD-<slug>`. Slugs may repeat across iterations — the folder name is the
identifier, so `2026-07-10-grafik-rows` and `2026-09-14-grafik-rows` are two attempts at one screen.

### `meta.json`

```jsonc
{
  "title": "Konfiguracja płatności — Recepcja",
  "date": "2026-09-14",
  "note": "One line: what question this exploration answers.",
  "mode": "system",              // "system" | "reframe" | "blank"   (default "system")
  "status": "explored",          // "explored" | "locked" | "shipped" | "rejected"
  "outcome": "rejected",         // "rejected" | "scoped" | "promoted"  — divergent modes only
  "spec": "plan-drafts/spec-x.md",
  "width": 396,                  // frame width override
  "variants": [{ "file": "a-inline.tsx", "label": "A — inline", "note": "optional" }]
}
```

The index reports anything inconsistent — a `.tsx` on disk that `meta.json` does not list, a listed
file that is missing, malformed JSON — as a warning on that folder, without hiding its siblings.

### A variant file

A default-exported component rendering **screen content only**. The phone frame, product fonts and
(mode permitting) the token stylesheet come from the shell. Never repeat that boilerplate.

## Modes

| mode | frame | tokens | product imports |
|---|---|---|---|
| `system` | ✅ | ✅ | free — plus fixture-fed auth/capabilities context, and the network is blocked |
| `reframe` | ✅ | ✅ | **none** — brand identity held, component conventions free |
| `blank` | ✅ | ❌ | **none** — only Polish copy and the mobile constraint held |

Divergent folders are drawn differently in the index, and one left at `explored` with no `outcome`
is flagged **unresolved**. Unresolved forks are how a design system rots; closing one costs a single
line of JSON.

A divergent folder should normally also carry a `system` control of the same screen — name the
variant or its label `control` and the shell places it first. Without the pair, "better" and
"different" are indistinguishable.

## Data

`system` prototypes import from `@/fixtures` — one studio persona and one B2C persona, typed against
the product's own types. Use them rather than inventing data: a prototype may only show fields that
exist.

The network is blocked while a prototype is mounted. A blocked call is logged with its URL — that
means the screen wants data the fixture layer does not yet provide, which is a finding worth acting
on, not an obstacle to route around.

See `src/app/proto/lib/PORTABILITY.md` for which product components render here and which cannot.

## Screenshots

```bash
yarn proto:shot 2026-09-14-grafik-rows              # every variant, 2x, beside the source
yarn proto:shot 2026-09-14-grafik-rows a-inline     # just one
yarn proto:shot 2026-09-14-grafik-rows --url http://localhost:3000/konto/partner/grafik
```

Needs `yarn dev` running — `/proto` does not exist in a production build, which is the point.
Screenshot only when someone cannot see the browser, or when a subagent needs to review. Otherwise
the hot-reloading tab is the render.
