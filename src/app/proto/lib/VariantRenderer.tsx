import { Suspense } from "react";

import { Frame } from "./Frame";
import { type Mode, variantSlug } from "./meta";
import { VariantErrorBoundary } from "./VariantErrorBoundary";

/**
 * Resolves one variant module and renders it.
 *
 * The dynamic segment in this import is the whole discovery mechanism for variant MODULES:
 * Turbopack builds a context module over `proto/*` from the static prefix, so a brand-new file
 * is resolvable without a restart and without any registration step (T01, criterion 4).
 *
 * Anything this throws — module not found, syntax error, a component that blows up on render —
 * is caught by the boundary in `Variant` below and shown inside the frame.
 */
async function VariantModule({ folder, file }: { folder: string; file: string }) {
  // The `.tsx` suffix is load-bearing, not tidiness. Turbopack builds a context module from the
  // static prefix AND suffix around the dynamic segment; without the suffix the context is every
  // file under proto/, and the first README.md or before.png in there fails the whole route with
  // "Unknown module type". Both are files the brief expects prototype folders to contain (§3).
  const mod = (await import(`../../../../proto/${folder}/${variantSlug(file)}.tsx`)) as {
    default?: unknown;
  };

  const Component = mod.default;
  if (typeof Component !== "function") {
    throw new Error(
      `${folder}/${file} has no default-exported component. A variant is a .tsx file with a ` +
        `default export rendering screen content only (§5).`,
    );
  }

  const Rendered = Component as () => React.ReactNode;
  return <Rendered />;
}

export function Variant({
  folder,
  file,
  label,
  mode,
  width,
}: {
  folder: string;
  file: string;
  label: string;
  mode: Mode;
  width?: number;
}) {
  return (
    <Frame mode={mode} width={width}>
      <VariantErrorBoundary label={`${folder}/${file}`}>
        <Suspense fallback={<div className="p-4 text-xs text-gray-400">Loading {label}…</div>}>
          <VariantModule folder={folder} file={file} />
        </Suspense>
      </VariantErrorBoundary>
    </Frame>
  );
}
