"use client";

import { createContext, ReactNode, useCallback, useContext, useState } from "react";

import useIsMobile from "@/hooks/useIsMobile";

interface EventHelpBarContextType {
  activeTipId: string | undefined;
  isHelpBarOpen: boolean;
  setIsHelpBarOpen: (isOpen: boolean) => void;
  isMobileHelpModalOpen: boolean;
  setIsMobileHelpModalOpen: (isOpen: boolean) => void;
  focusTip: (tipId: string) => void;
  openTip: (tipId: string) => void;
}

const EventHelpBarContext = createContext<EventHelpBarContextType | undefined>(undefined);

export const useEventHelpBar = () => {
  const context = useContext(EventHelpBarContext);
  if (!context) {
    throw new Error("useEventHelpBar must be used within a EventHelpBarProvider");
  }
  return context;
};

interface EventHelpBarProviderProps {
  children: ReactNode;
}

export const EventHelpBarProvider = ({ children }: EventHelpBarProviderProps) => {
  const [isHelpBarOpen, setIsHelpBarOpen] = useState(true);
  const [isMobileHelpModalOpen, setIsMobileHelpModalOpen] = useState(false);
  const [activeTipId, setActiveTipId] = useState<string | undefined>(undefined);
  // const isMobile = useIsMobile();

  const focusTip = (tipId: string) => {
    setActiveTipId(tipId);
  };

  const openTip = (tipId: string) => {
    setIsHelpBarOpen(true);
    setIsMobileHelpModalOpen(true);
    setActiveTipId(tipId);
  };

  // const openDesktopHelpBar = useCallback(
  //   (tipId: string) => {
  //     if (isMobile) {
  //       return;
  //     }
  //     setIsHelpBarOpen(true);
  //     setActiveTipId(tipId);
  //   },
  //   [isMobile],
  // );

  return (
    <EventHelpBarContext.Provider
      value={{
        isHelpBarOpen,
        setIsHelpBarOpen,
        isMobileHelpModalOpen,
        setIsMobileHelpModalOpen,
        activeTipId,
        focusTip,
        openTip,
      }}
    >
      {children}
    </EventHelpBarContext.Provider>
  );
};
