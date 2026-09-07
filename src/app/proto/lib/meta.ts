/**
 * The `meta.json` contract, mirroring §3 of plan-drafts/spec-proto-workbench.md.
 *
 * Validation deliberately DEGRADES rather than throws: one malformed folder must render as an
 * error row while every sibling still lists. A prototype index that goes blank because someone
 * left a trailing comma is worse than useless — it hides the whole archive.
 */

export const MODES = ["system", "reframe", "blank"] as const;
export const STATUSES = ["explored", "locked", "shipped", "rejected"] as const;
export const OUTCOMES = ["rejected", "scoped", "promoted"] as const;

export type Mode = (typeof MODES)[number];
export type Status = (typeof STATUSES)[number];
export type Outcome = (typeof OUTCOMES)[number];

export interface VariantMeta {
  file: string;
  label: string;
  note?: string;
}

export interface ProtoMeta {
  title: string;
  date: string;
  note?: string;
  mode: Mode;
  status: Status;
  outcome?: Outcome;
  spec?: string;
  width?: number;
  variants: VariantMeta[];
}

/** `system` is the default per §4 — a folder that omits `mode` is not divergent. */
export const DEFAULT_MODE: Mode = "system";

/** §5: 396px content width unless `meta.width` overrides it. */
export const DEFAULT_FRAME_WIDTH = 396;

export function isDivergent(mode: Mode): boolean {
  return mode !== "system";
}

/**
 * §4: a divergent folder left at `explored` with no `outcome` is an unresolved fork — the failure
 * mode the whole archive exists to make visible. Not an error; a state the index must shout about.
 */
export function isUnresolved(meta: ProtoMeta): boolean {
  return isDivergent(meta.mode) && meta.status === "explored" && !meta.outcome;
}

type Issue = string;

function checkString(v: unknown, field: string, issues: Issue[]): string | undefined {
  if (typeof v !== "string" || v.trim() === "") {
    issues.push(`"${field}" must be a non-empty string`);
    return undefined;
  }
  return v;
}

function checkEnum<T extends string>(
  v: unknown,
  allowed: readonly T[],
  field: string,
  issues: Issue[],
): T | undefined {
  if (typeof v !== "string" || !allowed.includes(v as T)) {
    issues.push(`"${field}" must be one of ${allowed.map((a) => `"${a}"`).join(", ")}`);
    return undefined;
  }
  return v as T;
}

export interface ParseResult {
  meta?: ProtoMeta;
  issues: Issue[];
}

/**
 * Parses and validates one folder's `meta.json`. Returns whatever could be salvaged alongside a
 * list of human-readable issues, so the index can show a folder AND say what is wrong with it.
 */
export function parseMeta(raw: unknown): ParseResult {
  const issues: Issue[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { issues: ["meta.json must contain a JSON object"] };
  }
  const o = raw as Record<string, unknown>;

  const title = checkString(o.title, "title", issues);
  const date = checkString(o.date, "date", issues);

  // `mode` defaults to "system"; anything else present must be valid.
  const mode = o.mode === undefined ? DEFAULT_MODE : checkEnum(o.mode, MODES, "mode", issues);
  const status = checkEnum(o.status, STATUSES, "status", issues);
  const outcome =
    o.outcome === undefined ? undefined : checkEnum(o.outcome, OUTCOMES, "outcome", issues);

  if (o.width !== undefined && (typeof o.width !== "number" || !Number.isFinite(o.width))) {
    issues.push(`"width" must be a number when present`);
  }

  const variants: VariantMeta[] = [];
  if (!Array.isArray(o.variants)) {
    issues.push(`"variants" must be an array`);
  } else {
    o.variants.forEach((v, i) => {
      if (typeof v !== "object" || v === null) {
        issues.push(`variants[${i}] must be an object`);
        return;
      }
      const vo = v as Record<string, unknown>;
      const file = checkString(vo.file, `variants[${i}].file`, issues);
      const label = checkString(vo.label, `variants[${i}].label`, issues);
      if (file && label) {
        variants.push({
          file,
          label,
          note: typeof vo.note === "string" ? vo.note : undefined,
        });
      }
    });
    if (o.variants.length === 0) issues.push(`"variants" is empty — nothing to render`);
  }

  if (!title || !date || !mode || !status) return { issues };

  return {
    meta: {
      title,
      date,
      mode,
      status,
      outcome,
      note: typeof o.note === "string" ? o.note : undefined,
      spec: typeof o.spec === "string" ? o.spec : undefined,
      width: typeof o.width === "number" ? o.width : undefined,
      variants,
    },
    issues,
  };
}

/** Strips the `.tsx` extension so `meta.json` may list either form. */
export function variantSlug(file: string): string {
  return file.replace(/\.tsx$/, "");
}
