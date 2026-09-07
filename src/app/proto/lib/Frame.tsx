import { FixtureProviders } from "./FixtureProviders";
import { DEFAULT_FRAME_WIDTH, type Mode } from "./meta";

/**
 * The one frame implementation, used by the folder view and the single-variant view (§5).
 *
 * Device chrome lives here so a prototype file is nothing but screen content — "a prototype
 * never repeats that boilerplate".
 *
 * Mode changes what reaches the prototype (§4):
 *
 *   system   frame + tokens + product components (fixture providers applied by the caller)
 *   reframe  frame + tokens, no product components
 *   blank    frame only — no token stylesheet, no product styling
 *
 * How `blank` isolation actually works, and its honest limit: both stylesheets are global to the
 * page (globals.css from the root layout, proto.css from the proto layout), so they cannot be
 * unloaded per variant. What CAN be cut is the vector that actually leaks — INHERITANCE. `all:
 * revert` on the content wrapper drops the product's inherited typography, colour and box
 * defaults back to the browser's, so a blank prototype that writes plain markup renders in the
 * user-agent default rather than in Hind Siliguri.
 *
 * The shell cannot ENFORCE that a blank prototype avoids product classes — that is a
 * design-diverge protocol, not something a renderer can police (see spec-design-skills.md §5).
 * The shell's job is to render honestly and mark clearly.
 */
export function Frame({
  mode,
  width,
  children,
}: {
  mode: Mode;
  width?: number;
  children: React.ReactNode;
}) {
  const w = width ?? DEFAULT_FRAME_WIDTH;

  return (
    <div
      data-proto-frame=""
      data-proto-mode={mode}
      style={{ width: w }}
      className="shrink-0 overflow-hidden rounded-b2b border border-gray-200 bg-white shadow-sm"
    >
      {/* Blank-mode isolation is done in proto.css, keyed on the two data attributes above —
          a cascade layer can neutralise Tailwind's preflight on every descendant, which an
          inline style on this wrapper cannot. */}
      <div data-proto-content="" className={mode === "blank" ? undefined : "min-h-[560px]"}>
        {/* system mode alone gets the fixture providers: §4 says reframe and blank import
            nothing from the product, so they have no context to satisfy. */}
        {mode === "system" ? <FixtureProviders>{children}</FixtureProviders> : children}
      </div>
    </div>
  );
}
