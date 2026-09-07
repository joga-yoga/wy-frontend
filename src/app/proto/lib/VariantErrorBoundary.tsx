"use client";

import { Component, type ReactNode } from "react";

/**
 * Per-variant failure isolation (§6, acceptance criterion 13).
 *
 * A prototype broken by a product refactor shows its error INSIDE its own frame; the index and
 * every sibling variant keep rendering. Errors thrown while rendering the server component that
 * imports a variant surface here too, because React unwinds to the nearest boundary during SSR.
 *
 * Scope note: this catches RUNTIME failure only. A prototype with a TYPE error fails
 * `next build` instead — a deliberate consequence of decision D4, which keeps the archive
 * compiling against current product types. The two are different failures with different
 * correct responses; see plan.md.
 */
export class VariantErrorBoundary extends Component<
  { children: ReactNode; label: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-full w-full flex-col gap-2 overflow-auto bg-b2b-red-bg p-4 text-b2b-red-text">
        <p className="text-sm font-semibold">This prototype failed to render</p>
        <p className="text-xs opacity-80">{this.props.label}</p>
        <pre className="mt-1 text-[11px] leading-relaxed whitespace-pre-wrap">{error.message}</pre>
        <p className="mt-auto pt-2 text-[11px] opacity-70">
          Its siblings and the index are unaffected.
        </p>
      </div>
    );
  }
}
