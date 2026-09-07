import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { parseMeta, type ProtoMeta, variantSlug } from "./meta";

/**
 * Discovery layer for the prototype workbench.
 *
 * Metadata is read from disk at request time; variant MODULES are resolved by the bundler
 * (see VariantRenderer). That split is the one real cost of the chosen approach — two
 * mechanisms that could disagree — so this module treats `meta.json` as the ordering
 * authority and reports any `.tsx` on disk it does not list, rather than hiding it.
 *
 * Proven in T01: a folder created against a running dev server is picked up on the next
 * request, with no restart and no registration step (acceptance criterion 4).
 */

export const PROTO_DIR = path.join(process.cwd(), "proto");

/** §3: folders are `YYYY-MM-DD-<slug>`. Slugs repeat across iterations by design, so the
 *  FOLDER NAME is the identifier — never the slug. */
const FOLDER_RE = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

export interface FolderEntry {
  /** Folder name on disk — the stable identifier and URL segment. */
  id: string;
  /** Date parsed from the folder name, or null if it does not follow the convention. */
  folderDate: string | null;
  slug: string | null;
  meta?: ProtoMeta;
  /** Human-readable problems: bad JSON, schema violations, undeclared files. Never thrown. */
  issues: string[];
  /** `.tsx` files present on disk but absent from `meta.json`. */
  undeclared: string[];
  /** Declared variants whose file is missing from disk. */
  missing: string[];
}

async function readFolder(id: string): Promise<FolderEntry> {
  const m = FOLDER_RE.exec(id);
  const entry: FolderEntry = {
    id,
    folderDate: m?.[1] ?? null,
    slug: m?.[2] ?? null,
    issues: [],
    undeclared: [],
    missing: [],
  };

  if (!m) {
    entry.issues.push(`Folder name does not match YYYY-MM-DD-<slug>, so it cannot be date-sorted`);
  }

  let raw: string;
  try {
    raw = await readFile(path.join(PROTO_DIR, id, "meta.json"), "utf8");
  } catch {
    entry.issues.push(`No meta.json — a prototype folder needs one (§3)`);
    return entry;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    entry.issues.push(`meta.json is not valid JSON: ${(e as Error).message}`);
    return entry;
  }

  const { meta, issues } = parseMeta(json);
  entry.meta = meta;
  entry.issues.push(...issues);

  // Cross-check what meta.json claims against what is actually on disk. Silent disagreement
  // between the two discovery mechanisms is this approach's one structural risk.
  let onDisk: string[] = [];
  try {
    onDisk = (await readdir(path.join(PROTO_DIR, id))).filter((f) => f.endsWith(".tsx"));
  } catch {
    /* handled by the meta.json read above */
  }

  if (meta) {
    const declared = new Set(meta.variants.map((v) => variantSlug(v.file)));
    entry.undeclared = onDisk.map(variantSlug).filter((f) => !declared.has(f));
    const present = new Set(onDisk.map(variantSlug));
    entry.missing = meta.variants.map((v) => variantSlug(v.file)).filter((f) => !present.has(f));
  }

  return entry;
}

/** Every folder in `proto/`, newest first (acceptance criterion 5). */
export async function listFolders(): Promise<FolderEntry[]> {
  let names: string[];
  try {
    names = (await readdir(PROTO_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }

  const entries = await Promise.all(names.map(readFolder));

  // Descending by folder name: because the name is `YYYY-MM-DD-slug`, a plain reverse string
  // sort is already chronological. Folders that break the convention sort last rather than
  // disappearing — a broken name must stay visible so it can be fixed.
  return entries.sort((a, b) => {
    if (!a.folderDate && !b.folderDate) return a.id.localeCompare(b.id);
    if (!a.folderDate) return 1;
    if (!b.folderDate) return -1;
    return b.id.localeCompare(a.id);
  });
}

export async function getFolder(id: string): Promise<FolderEntry | null> {
  // The URL segment is used to build a filesystem path, so reject anything that could escape
  // `proto/`. Dev-only tooling still has no excuse for a traversal.
  if (!/^[\w.-]+$/.test(id) || id.includes("..")) return null;

  const names = await listFolders();
  return names.find((f) => f.id === id) ?? null;
}

/** §5 / criterion 9: when a divergent folder carries a `system` control, it is placed first. */
export function orderVariants(entry: FolderEntry): ProtoMeta["variants"] {
  const variants = entry.meta?.variants ?? [];
  if (!entry.meta || entry.meta.mode === "system") return variants;

  const controlFirst = [...variants];
  controlFirst.sort((a, b) => Number(isControl(b)) - Number(isControl(a)));
  return controlFirst;
}

/**
 * A "control" is the `system`-mode rendering of the same screen that a divergent folder should
 * carry (§4). There is no per-variant `mode` field in the §3 schema, so the convention is a
 * label or filename containing "control".
 */
export function isControl(v: { file: string; label: string }): boolean {
  return /control/i.test(v.label) || /control/i.test(v.file);
}

/** §4: the index flags a divergent folder that has no control variant. Flags — never blocks. */
export function lacksControl(entry: FolderEntry): boolean {
  if (!entry.meta || entry.meta.mode === "system") return false;
  return !entry.meta.variants.some(isControl);
}
