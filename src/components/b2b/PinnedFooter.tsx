import { cn } from "@/lib/utils";

/**
 * The pinned action bar from the design HTML (`.footbar`).
 *
 * Two things the hand-rolled versions in this panel got wrong:
 *
 * 1. **No top border.** `.footbar` has `margin-top:16px` and nothing else — the pill
 *    buttons already separate themselves from the content. A hairline above them reads as
 *    a second, competing edge on a screen that already has the tab bar.
 * 2. **Safe-area padding.** A fixed bar with a flat `py-3` sits under the home indicator
 *    on any device that has one. Part 1 shipped a FAB with exactly that bug.
 *
 * Children are expected to be `<Button size="action">`, which is the pill the design
 * draws; `gap-2.5` is the HTML's `gap:10px`.
 */
export function PinnedFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("fixed inset-x-0 bottom-0 z-40 bg-background px-4 pt-3", className)}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg gap-2.5 [&>*]:flex-1">{children}</div>
    </div>
  );
}

/**
 * Spacer to reserve the pinned bar's height in normal flow, so the last item of a list is
 * never trapped underneath it. Screens that use `PinnedFooter` should render this at the
 * end of their scrolling content.
 */
export function PinnedFooterSpacer() {
  return <div aria-hidden style={{ height: "calc(4.5rem + env(safe-area-inset-bottom))" }} />;
}
