import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  IssuesBadge,
  ModeBadge,
  NoControlBadge,
  OutcomeBadge,
  StatusBadge,
  UnresolvedBadge,
} from "../lib/badges";
import { isUnresolved, variantSlug } from "../lib/meta";
import { getFolder, isControl, lacksControl, orderVariants } from "../lib/registry";
import { Variant } from "../lib/VariantRenderer";

/**
 * Folder view (§5, acceptance criterion 9): every variant side by side, each framed and
 * labelled, horizontal scroll on overflow, control variant first when one exists.
 */
async function FolderBody({ params }: { params: Promise<{ folder: string }> }) {
  await connection();

  const { folder } = await params;
  const entry = await getFolder(folder);
  if (!entry) notFound();

  const { meta } = entry;

  if (!meta) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/proto" className="text-sm text-brand-green-700 hover:underline">
          ← Prototypes
        </Link>
        <div className="mt-6 rounded-b2b border border-b2b-red-border bg-b2b-red-bg p-4">
          <div className="flex items-center gap-2">
            <code className="text-sm font-semibold text-b2b-red-text">{entry.id}</code>
            <IssuesBadge count={entry.issues.length} />
          </div>
          <ul className="mt-2 list-disc pl-5 text-xs text-b2b-red-text">
            {entry.issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  const variants = orderVariants(entry);
  const missing = new Set(entry.missing);

  return (
    <main className="px-6 py-10">
      <header className="mx-auto mb-8 max-w-3xl">
        <Link href="/proto" className="text-sm text-brand-green-700 hover:underline">
          ← Prototypes
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-h-small text-gray-900">{meta.title}</h1>
          <ModeBadge mode={meta.mode} />
          <StatusBadge status={meta.status} />
          {meta.outcome ? <OutcomeBadge outcome={meta.outcome} /> : null}
          {isUnresolved(meta) ? <UnresolvedBadge /> : null}
          {lacksControl(entry) ? <NoControlBadge /> : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
          <span>{meta.date}</span>
          <code className="text-gray-400">{entry.id}</code>
          {meta.spec ? <span className="text-brand-green-700">spec: {meta.spec}</span> : null}
        </div>
        {meta.note ? <p className="mt-2 text-sm text-gray-700">{meta.note}</p> : null}
      </header>

      {/* Horizontal scroll when the variants overflow (§5). The page body never scrolls
          sideways — the overflow is owned by this strip. */}
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-min items-start gap-6">
          {variants.map((v) => {
            const slug = variantSlug(v.file);
            return (
              <figure key={v.file} className="flex flex-col gap-2">
                <figcaption className="flex flex-wrap items-center gap-2 px-1">
                  <Link
                    href={`/proto/${entry.id}/${slug}`}
                    className="text-sm font-medium text-gray-900 hover:underline"
                  >
                    {v.label}
                  </Link>
                  {isControl(v) ? (
                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">
                      control
                    </span>
                  ) : null}
                  {v.note ? <span className="text-xs text-gray-500">{v.note}</span> : null}
                </figcaption>

                {missing.has(slug) ? (
                  <div className="w-[396px] rounded-b2b border border-b2b-red-border bg-b2b-red-bg p-4 text-xs text-b2b-red-text">
                    <code>{v.file}</code> is listed in meta.json but missing from disk.
                  </div>
                ) : (
                  <Variant
                    folder={entry.id}
                    file={v.file}
                    label={v.label}
                    mode={meta.mode}
                    width={meta.width}
                  />
                )}
              </figure>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function FolderView({ params }: { params: Promise<{ folder: string }> }) {
  return (
    <Suspense fallback={<main className="px-6 py-10 text-sm text-gray-400">Loading…</main>}>
      <FolderBody params={params} />
    </Suspense>
  );
}
