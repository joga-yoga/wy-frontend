import "./proto.css";

import type { Metadata } from "next";

/**
 * Prototype workbench shell layout. Dev-only: this file is a route solely because
 * `pageExtensions` includes "proto.tsx" during `next dev`.
 *
 * It is the single importer of proto.css — see the warning in that file.
 */
export const metadata: Metadata = {
  title: "Prototypes",
  // Internal tooling. Never indexed, per the brief's opening constraint.
  robots: { index: false, follow: false },
};

export default function ProtoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
