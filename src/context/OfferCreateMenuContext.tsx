"use client";

import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

// Shared by DashboardTopBar (trigger) and the offer page (the "Co chcesz
// dodać?" drawer) so opening it doesn't need a URL param + navigation round
// trip — that previously raced with Next.js's own navigation and remounted
// the page before the drawer could open.
interface OfferCreateMenuContextState {
  isCreateMenuOpen: boolean;
  openCreateMenu: () => void;
  setIsCreateMenuOpen: (open: boolean) => void;
}

const OfferCreateMenuContext = createContext<OfferCreateMenuContextState | undefined>(undefined);

export const OfferCreateMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const value = useMemo(
    () => ({
      isCreateMenuOpen,
      openCreateMenu: () => setIsCreateMenuOpen(true),
      setIsCreateMenuOpen,
    }),
    [isCreateMenuOpen],
  );

  return (
    <OfferCreateMenuContext.Provider value={value}>{children}</OfferCreateMenuContext.Provider>
  );
};

export const useOfferCreateMenu = (): OfferCreateMenuContextState => {
  const context = useContext(OfferCreateMenuContext);
  if (context === undefined) {
    throw new Error("useOfferCreateMenu must be used within an OfferCreateMenuProvider");
  }
  return context;
};
