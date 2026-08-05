"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Lets an inner screen push a subtitle up into `DashboardTopBar`.
 *
 * The mockups put a context line directly under the screen title — T1's
 * "AcroYoga · dziś 18:05 · Oleg · Sala 1", T7's client name — and that string is only
 * known once the screen has loaded its data, which the header cannot see. Screens that
 * set nothing render exactly as before.
 *
 * Split into two contexts (values vs. setters) rather than one: `useContext` subscribes a
 * component to *every* field of whatever it reads, not just the ones it names. A single
 * combined context means a write-only hook (which only wants a stable `setX` function) still
 * re-renders whenever any *value* changes — harmless for primitive subtitle/title strings,
 * but for `action` (a JSX element, a fresh object identity every render) that re-render
 * recreates the JSX, which re-fires the effect, which calls `setAction` again — an infinite
 * `useEffect` loop. Setters from `useState` never change identity, so a setters-only context
 * never re-renders its consumers at all, which breaks the cycle regardless of whether the
 * caller's JSX is memoized.
 */
const PageHeaderValuesContext = createContext<{
  subtitle: string | null;
  title: string | null;
  action: React.ReactNode | null;
}>({ subtitle: null, title: null, action: null });

const PageHeaderSettersContext = createContext<{
  setSubtitle: (value: string | null) => void;
  setTitle: (value: string | null) => void;
  setAction: (value: React.ReactNode | null) => void;
}>({ setSubtitle: () => {}, setTitle: () => {}, setAction: () => {} });

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [action, setAction] = useState<React.ReactNode | null>(null);

  const values = useMemo(() => ({ subtitle, title, action }), [subtitle, title, action]);
  // Deps are the setter functions themselves — stable for the provider's whole lifetime, so
  // this object never changes identity either, and setter-only consumers never re-render.
  const setters = useMemo(
    () => ({ setSubtitle, setTitle, setAction }),
    [setSubtitle, setTitle, setAction],
  );

  return (
    <PageHeaderSettersContext.Provider value={setters}>
      <PageHeaderValuesContext.Provider value={values}>{children}</PageHeaderValuesContext.Provider>
    </PageHeaderSettersContext.Provider>
  );
}

/** Read side — for the header itself. */
export function usePageSubtitle(): string | null {
  return useContext(PageHeaderValuesContext).subtitle;
}

/**
 * Write side — for screens. Pass `null` while the data is still loading so the header
 * shows the title alone rather than a flash of stale context. Clears on unmount, so a
 * subtitle never leaks into the next screen.
 */
export function useSetPageSubtitle(subtitle: string | null): void {
  const { setSubtitle } = useContext(PageHeaderSettersContext);
  useEffect(() => {
    setSubtitle(subtitle);
    return () => setSubtitle(null);
  }, [subtitle, setSubtitle]);
}

/** Read side for the title override — falls back to the route map when null. */
export function usePageTitleOverride(): string | null {
  return useContext(PageHeaderValuesContext).title;
}

/**
 * Write side for the title. Some screens are titled by their *subject* rather than their
 * function — R5 heads the instructor editor with the instructor's name, K2 could do the
 * same — and that string only exists once the screen has loaded. Same clear-on-unmount
 * discipline as the subtitle, so a name never leaks into the next screen.
 */
export function useSetPageTitle(title: string | null): void {
  const { setTitle } = useContext(PageHeaderSettersContext);
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
}

/** Read side — for the header itself. */
export function usePageHeaderAction(): React.ReactNode | null {
  return useContext(PageHeaderValuesContext).action;
}

/**
 * Write side — lets a screen put an interactive control (spec §7's overflow menu) in the
 * header's right-hand slot, next to the title. Same clear-on-unmount discipline as title and
 * subtitle, so an action never leaks into the next screen.
 */
export function useSetPageHeaderAction(action: React.ReactNode | null): void {
  const { setAction } = useContext(PageHeaderSettersContext);
  useEffect(() => {
    setAction(action);
    return () => setAction(null);
  }, [action, setAction]);
}
