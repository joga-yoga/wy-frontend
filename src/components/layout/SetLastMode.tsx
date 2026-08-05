"use client";

import { useEffect } from "react";

import { type AppMode, setLastMode } from "@/lib/partnerMode";

/** Records which mode (B2C/B2B) the device last used — see `lib/partnerMode.ts`. */
export function SetLastMode({ mode }: { mode: AppMode }) {
  useEffect(() => {
    setLastMode(mode);
  }, [mode]);

  return null;
}
