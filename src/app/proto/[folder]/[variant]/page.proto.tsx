import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { variantSlug } from "../../lib/meta";
import { getFolder } from "../../lib/registry";
import { Variant } from "../../lib/VariantRenderer";

/**
 * Single variant (§5, acceptance criterion 11).
 *
 * One variant, full frame, NO SHELL CHROME — no header, no nav, no back link. This is the
 * screenshot and review-agent target, so its DOM is a contract: T07 locates the frame by
 * `[data-proto-frame]`, and anything added around it changes what gets captured.
 */
async function SingleVariantBody({
  params,
}: {
  params: Promise<{ folder: string; variant: string }>;
}) {
  await connection();

  const { folder, variant } = await params;
  const entry = await getFolder(folder);
  if (!entry?.meta) notFound();

  const declared = entry.meta.variants.find((v) => variantSlug(v.file) === variant);
  if (!declared) notFound();

  return (
    <main className="flex min-h-dvh items-start justify-center p-0">
      <Variant
        folder={entry.id}
        file={declared.file}
        label={declared.label}
        mode={entry.meta.mode}
        width={entry.meta.width}
      />
    </main>
  );
}

/**
 * The Suspense shell is required by `cacheComponents`. Its fallback is deliberately empty: this
 * route is the screenshot target, and any placeholder chrome could end up in a capture.
 */
export default function SingleVariant({
  params,
}: {
  params: Promise<{ folder: string; variant: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <SingleVariantBody params={params} />
    </Suspense>
  );
}
