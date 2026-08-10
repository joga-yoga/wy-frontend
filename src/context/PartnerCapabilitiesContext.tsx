"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";

export interface CapabilityStudio {
  id: string;
  name: string;
  /** `Studio.image_id` — the studio's logo, drawn as the Menu row's leading tile. */
  image_id: string | null;
}

export interface PartnerCapabilities {
  managedStudios: CapabilityStudio[];
  teachingStudios: CapabilityStudio[];
  hasEvents: boolean;
  /** Whether the partner has claimed an Instructor identity of their own — lets screens
   *  hide "create your instructor profile" CTAs without a second /instructors call. */
  hasInstructorProfile: boolean;
  landingTab: "grafik" | "rezerwacje";
}

interface PartnerCapabilitiesContextValue {
  capabilities: PartnerCapabilities | null;
  isLoading: boolean;
  refetch: () => void;
}

const PartnerCapabilitiesContext = createContext<PartnerCapabilitiesContextValue | undefined>(
  undefined,
);

/**
 * One cached `GET /partner/capabilities` call per shell session (spec-b2b §3): which
 * schedule sources the partner has and whether they organize any events. Drives the
 * conditional tab bar, the Grafik context selector, and the Rezerwacje/Oferta empty
 * states — none of them should ask the user who they are.
 */
export function PartnerCapabilitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const hasPartner = Boolean(user?.partner);
  const [capabilities, setCapabilities] = useState<PartnerCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!hasPartner) {
      setCapabilities(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    axiosInstance
      .get("/partner/capabilities")
      .then((res) => {
        setCapabilities({
          managedStudios: res.data.managed_studios,
          teachingStudios: res.data.teaching_studios,
          hasEvents: res.data.has_events,
          hasInstructorProfile: res.data.has_instructor_profile,
          landingTab: res.data.landing_tab,
        });
      })
      .catch(() => setCapabilities(null))
      .finally(() => setIsLoading(false));
  }, [hasPartner]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <PartnerCapabilitiesContext.Provider value={{ capabilities, isLoading, refetch }}>
      {children}
    </PartnerCapabilitiesContext.Provider>
  );
}

export function usePartnerCapabilities() {
  const ctx = useContext(PartnerCapabilitiesContext);
  if (ctx === undefined) {
    throw new Error("usePartnerCapabilities must be used within a PartnerCapabilitiesProvider");
  }
  return ctx;
}
