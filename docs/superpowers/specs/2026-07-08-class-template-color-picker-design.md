# Class Template Color Picker — Design

## Context

Occurrences/classes already render with a colored border on the public schedule
(`SessionCard.tsx`'s `COLOR_BORDER_MAP`, keyed by `ClassColor` = `rose | amber | lime |
teal | sky | violet | slate`). The color is sourced from `class_details.color` on the
backend (`ClassDetail.color`, `models/event.py`), which already has a DB check
constraint restricting it to the same 7-value palette (`CLASS_COLOR_PALETTE`). This
color already flows read-side into every public schedule/occurrence response
(`api/studio.py`: `GrafikOccurrencePublic`, `OccurrenceDetailPublic`).

What's missing: there is no way for a partner to actually set the color. The
`ClassTemplateCreate` / `ClassTemplateUpdate` / `ClassTemplateResponse` schemas don't
expose `color`, the CRUD layer doesn't read/write it, and the Class Template form
(`TemplateEditor.tsx`, under `wy-frontend/src/app/profile/(dashboard)/class-templates/`)
has no picker.

Color must live on the **Class Template** (`ClassDetail`), not on individual
occurrences or schedules — a partner sets it once per class, and every generated
occurrence inherits it. No per-occurrence or per-schedule override is in scope.

## Backend changes (`wy-backend`)

**`src/app/schemas/class_template.py`**
Add a `ClassColor` literal type (mirrors `CLASS_COLOR_PALETTE` from
`models/event.py`) and a `color` field to all three schemas:

```python
ClassColor = Literal["rose", "amber", "lime", "teal", "sky", "violet", "slate"]

class ClassTemplateCreate(BaseModel):
    ...
    color: Optional[ClassColor] = None

class ClassTemplateUpdate(BaseModel):
    ...
    color: Optional[ClassColor] = None

class ClassTemplateResponse(BaseModel):
    ...
    color: Optional[ClassColor] = None
```

Using `Literal` (rather than relying solely on the DB check constraint) means an
invalid value is rejected with a normal 422 at the API boundary instead of surfacing
as a raw `IntegrityError`.

**`src/app/crud/class_template.py`**
- `create_template`: pass `color=data.get("color")` into the `ClassDetail(...)` constructor.
- `update_template`: add `"color"` to the `detail_fields` set so it's settable via PATCH.

**`src/app/api/class_templates.py`**
- `_to_response`: add `color=d.color if d else None`.

**Migrations:** none needed. `class_details.color` and
`ck_class_details_color_palette` already exist (added in a prior migration).

## Frontend changes (`wy-frontend`)

**New shared module `src/lib/classColors.ts`** — single source of truth for the
palette (mirrors backend `CLASS_COLOR_PALETTE` order), replacing the copy currently
inlined in `SessionCard.tsx`:

```ts
export const CLASS_COLORS = ["rose", "amber", "lime", "teal", "sky", "violet", "slate"] as const;
export type ClassColor = (typeof CLASS_COLORS)[number];

export const COLOR_BORDER_MAP: Record<ClassColor, string> = { ... };   // moved as-is from SessionCard.tsx
export const DEFAULT_BORDER = "border-gray-200";                       // moved as-is

export const COLOR_SWATCH_MAP: Record<ClassColor, string> = {          // new: solid fill for picker
  rose: "bg-rose-400",
  amber: "bg-amber-400",
  lime: "bg-lime-400",
  teal: "bg-teal-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  slate: "bg-slate-400",
};

export const COLOR_LABELS: Record<ClassColor, string> = {              // new: for aria-label
  rose: "Różowy", amber: "Bursztynowy", lime: "Limonkowy",
  teal: "Turkusowy", sky: "Błękitny", violet: "Fioletowy", slate: "Szary",
};
```

- `schedule/types.ts`: replace the inline `ClassColor` type with
  `export type { ClassColor } from "@/lib/classColors";`
- `SessionCard.tsx`: replace the local `COLOR_BORDER_MAP`/`DEFAULT_BORDER`
  definitions with re-exports from `@/lib/classColors`, so
  `SessionDetailDrawer.tsx` (which imports both from `SessionCard.tsx`) needs no
  changes.
- `class-templates/types.ts`: add `color?: ClassColor | null` to `ClassTemplate` and
  `ClassTemplateCreate` (import `ClassColor` from `@/lib/classColors`).

**`TemplateEditor.tsx`** — new "Kolor" field, placed in the "Czym są te zajęcia"
section, directly after the Language select (last field in that section):

- State: `const [color, setColor] = useState<ClassColor | null>(initial?.color ?? null)`.
- UI: a row of 8 circular buttons (`w-8 h-8 rounded-full`):
  - 7 palette swatches, solid-filled via `COLOR_SWATCH_MAP[c]`.
  - 1 "None" swatch: white/transparent fill, dashed gray border, small slash icon
    (lucide `Ban`), to explicitly clear the color.
  - Selected swatch: `ring-2 ring-offset-2 ring-gray-900` + a small white check
    icon (lucide `Check`) centered on the circle. No brand-green, no colored text —
    consistent with the project's minimalistic-toggle convention, except the swatch
    fill itself is necessarily the palette color (that's the content being chosen,
    not decoration).
  - Each button gets `aria-label={COLOR_LABELS[c]}` / `aria-label="Brak koloru"` and
    `aria-pressed`.
- Submit behavior: unlike the form's other optional fields (`level`, `style`, etc.,
  which are only included in the payload when truthy — a pre-existing quirk where
  clearing them in edit mode doesn't actually clear them server-side), `color` is
  **always** included in the submitted `data` object as either the selected value or
  `null`. This is a deliberate, scoped exception so choosing "None" reliably clears
  an existing color on save. No other field's submit behavior changes.

## Out of scope

- Per-occurrence or per-schedule color override (explicitly rejected — color is a
  template-level property only).
- Fixing the pre-existing "clearing an optional field in edit mode doesn't persist"
  quirk for fields other than `color`.
- Any change to `ClassMetaSection.tsx` (a separate, apparently-unused legacy
  `EventForm` component) — not part of the active class-template creation flow.
- CRM (`wy-crm`) — it has no class-template management UI today; nothing to change there.

## Testing

- Backend: extend/add a test for `class_templates` CRUD covering create/update with a
  valid color, update clearing color to `null`, and rejection of an invalid color
  value (422).
- Frontend: manual verification via `run`/browser — create a template with a color,
  confirm it renders on the public schedule border; edit a template to change/clear
  the color; confirm the "None" swatch clears an existing color on save.
