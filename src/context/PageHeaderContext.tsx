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
  title: string | null;
  setTitle: (value: string | null) => void;
}>({ subtitle: null, setSubtitle: () => {}, title: null, setTitle: () => {} });

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const value = useMemo(() => ({ subtitle, setSubtitle, title, setTitle }), [subtitle, title]);
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

/** Read side for the title override — falls back to the route map when null. */
export function usePageTitleOverride(): string | null {
  return useContext(PageHeaderContext).title;
}

/**
 * Write side for the title. Some screens are titled by their *subject* rather than their
 * function — R5 heads the instructor editor with the instructor's name, K2 could do the
 * same — and that string only exists once the screen has loaded. Same clear-on-unmount
 * discipline as the subtitle, so a name never leaks into the next screen.
 */
export function useSetPageTitle(title: string | null): void {
  const { setTitle } = useContext(PageHeaderContext);
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
}
