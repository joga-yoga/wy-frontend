import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  IssuesBadge,
  ModeBadge,
  NoControlBadge,
  OutcomeBadge,
  StatusBadge,
  UnresolvedBadge,
} from "./lib/badges";
import { isUnresolved } from "./lib/meta";
import { type FolderEntry, lacksControl, listFolders } from "./lib/registry";

/**
 * The index (§5, acceptance criteria 1, 5, 10).
 *
 * Folders newest first, read straight off disk — no registration step anywhere (criterion 4).
 * No search, no filter, no tags: §8 puts all three explicitly out of scope for v1.
 */

function Row({ entry }: { entry: FolderEntry }) {
  const { meta } = entry;

  if (!meta) {
    return (
      <li className="rounded-b2b border border-b2b-red-border bg-b2b-red-bg p-4">
        <div className="flex items-center gap-2">
          <code className="text-sm font-semibold text-b2b-red-text">{entry.id}</code>
          <IssuesBadge count={entry.issues.length} />
        </div>
        <ul className="mt-2 list-disc pl-5 text-xs text-b2b-red-text">
          {entry.issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </li>
    );
  }

  const unresolved = isUnresolved(meta);
  const noControl = lacksControl(entry);
  const divergent = meta.mode !== "system";

  return (
    <li
      className={
        divergent
          ? "rounded-b2b border-2 border-dashed border-b2b-amber-border bg-b2b-amber-bg/40 p-4"
          : "rounded-b2b border border-gray-200 bg-white p-4"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/proto/${entry.id}`}
          className="text-base font-semibold text-gray-900 hover:underline"
        >
          {meta.title}
        </Link>
        <ModeBadge mode={meta.mode} />
        <StatusBadge status={meta.status} />
        {meta.outcome ? <OutcomeBadge outcome={meta.outcome} /> : null}
        {unresolved ? <UnresolvedBadge /> : null}
        {noControl ? <NoControlBadge /> : null}
        {entry.issues.length > 0 ? <IssuesBadge count={entry.issues.length} /> : null}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <span>{meta.date}</span>
        <span>
          {meta.variants.length} {meta.variants.length === 1 ? "variant" : "variants"}
        </span>
        <code className="text-gray-400">{entry.id}</code>
        {meta.spec ? <span className="text-brand-green-700">spec: {meta.spec}</span> : null}
      </div>

      {meta.note ? <p className="mt-2 text-sm text-gray-700">{meta.note}</p> : null}

      {unresolved ? (
        <p className="mt-2 text-xs text-b2b-red-text">
          A divergent exploration with no recorded outcome. Close it with <code>rejected</code>,{" "}
          <code>scoped</code> or <code>promoted</code> in meta.json.
        </p>
      ) : null}

      {entry.issues.length > 0 || entry.undeclared.length > 0 || entry.missing.length > 0 ? (
        <ul className="mt-2 list-disc pl-5 text-xs text-b2b-amber-text">
          {entry.issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
          {entry.undeclared.map((f) => (
            <li key={`u-${f}`}>
              <code>{f}.tsx</code> is on disk but not listed in meta.json — it will not render
            </li>
          ))}
          {entry.missing.map((f) => (
            <li key={`m-${f}`}>
              <code>{f}.tsx</code> is listed in meta.json but missing from disk
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * `cacheComponents: true` is on, which bans `export const dynamic`. `connection()` is its
 * replacement: it marks the render as request-time, which is what reading `proto/` off disk
 * requires. The archive changes while the designer works — a cached index is a stale index.
 */
async function IndexBody() {
  await connection();

  const folders = await listFolders();

  // Group by date descending (§5). Folders with an unparseable name are grouped separately so a
  // naming mistake stays visible rather than vanishing into an arbitrary bucket.
  const groups = new Map<string, FolderEntry[]>();
  for (const f of folders) {
    const key = f.folderDate ?? "unsorted";
    const list = groups.get(key) ?? [];
    list.push(f);
    groups.set(key, list);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-h-middle text-gray-900">Prototypes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Dev-only. Add a folder to <code>proto/</code> with a <code>meta.json</code> and it appears
          here — no registration step.
        </p>
      </header>

      {folders.length === 0 ? (
        <p className="rounded-b2b border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Nothing in <code>proto/</code> yet.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {[...groups.entries()].map(([date, entries]) => (
            <section key={date}>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                {date === "unsorted" ? "Unrecognised folder names" : date}
              </h2>
              <ul className="flex flex-col gap-3">
                {entries.map((e) => (
                  <Row key={e.id} entry={e} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

/**
 * `cacheComponents` requires request-time IO to sit inside a Suspense boundary, so the exported
 * page is a synchronous shell and every filesystem read happens in `IndexBody` beneath it.
 */
export default function ProtoIndex() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-gray-400">Reading proto/…</main>
      }
    >
      <IndexBody />
    </Suspense>
  );
}
