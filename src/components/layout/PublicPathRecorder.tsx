"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { rememberPublicPath } from "@/lib/publicReturn";

/**
 * Records every public page visit, so the B2C profile's close button can return the user
 * to the exact page they came from.
 *
 * Mounted at the root rather than inside `(public)` on purpose: `/book/...` and
 * `/create/...` are public too and live outside that group. `rememberPublicPath` skips
 * anything under `/account`, so the account app never records itself.
 */
export function PublicPathRecorder() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    rememberPublicPath(pathname, query ? `?${query}` : "");
  }, [pathname, searchParams]);

  return null;
}
