"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Lets an inner screen push a subtitle up into `DashboardTopBar`.
 *
 * The mockups put a context line directly under the screen title — T1's
 * "AcroYoga · dziś 18:05 · Oleg · Sala 1", T7's client name — and that string is only
 * known once the screen has loaded its data, which the header cannot see. Screens that
 * set nothing render exactly as before.
 */
const PageHeaderContext = createContext<{
  subtitle: string | null;
  setSubtitle: (value: string | null) => void;
}>({ subtitle: null, setSubtitle: () => {} });

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const value = useMemo(() => ({ subtitle, setSubtitle }), [subtitle]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

/** Read side — for the header itself. */
export function usePageSubtitle(): string | null {
  return useContext(PageHeaderContext).subtitle;
}

/**
 * Write side — for screens. Pass `null` while the data is still loading so the header
 * shows the title alone rather than a flash of stale context. Clears on unmount, so a
 * subtitle never leaks into the next screen.
 */
export function useSetPageSubtitle(subtitle: string | null): void {
  const { setSubtitle } = useContext(PageHeaderContext);
  useEffect(() => {
    setSubtitle(subtitle);
    return () => setSubtitle(null);
  }, [subtitle, setSubtitle]);
}
