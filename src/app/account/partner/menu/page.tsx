"use client";

import { ArrowLeftRight, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StudioLogoTile } from "@/components/b2b/StudioLogoTile";
import { BusinessDirectionCards } from "@/components/menu/BusinessDirectionCards";
import { MenuIconTile, MenuRow } from "@/components/menu/MenuRow";
import { StudioWorkspaceRows } from "@/components/menu/StudioWorkspaceRows";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { ImportEntry } from "../studio/import/fitssey/ImportEntry";
import { SavedImports } from "../studio/import/fitssey/SavedImports";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{children}</h2>
  );
}

/**
 * Menu tab (spec-b2b §4): the studio workspace (flattened for 1 studio, grouped for
 * 2+), account rows, and the calm B2B→B2C switch card — the asymmetric counterpart
 * to T13's pinned B2C profile button.
 */
export default function MenuPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { capabilities, isLoading } = usePartnerCapabilities();
  // Invitations moved to the header bell (WY-65). They used to be listed here *and* on
  // Rezerwacje, both reading `/users/me/invitations` through their own copy of the
  // accept/decline logic — two renderings of one fact, which is how the contradictory
  // statuses in WY-63 arose. One source now, one renderer.

  const managedStudios = capabilities?.managedStudios ?? [];
  const hasTeachingOnly = Boolean(
    capabilities && managedStudios.length === 0 && capabilities.teachingStudios.length > 0,
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
      {!isLoading && managedStudios.length === 1 && (
        <StudioWorkspaceRows
          studioId={managedStudios[0].id}
          studioName={managedStudios[0].name}
          studioImageId={managedStudios[0].image_id}
        />
      )}

      {!isLoading && managedStudios.length >= 2 && (
        <section className="space-y-2">
          <SectionLabel>Twoje studia</SectionLabel>
          <div className="rounded-b2b border bg-white overflow-hidden divide-y">
            {managedStudios.map((studio) => (
              <MenuRow
                key={studio.id}
                href={`/account/partner/menu/studio/${studio.id}`}
                title={studio.name}
                subtitle="Profil, klienci, szablony"
                leading={
                  <StudioLogoTile
                    name={studio.name}
                    imageId={studio.image_id}
                    size={48}
                    className="border bg-white"
                  />
                }
              />
            ))}
          </div>
        </section>
      )}

      {!isLoading && managedStudios.length > 0 && (
        <div className="rounded-b2b border bg-white overflow-hidden">
          <MenuRow
            href="/account/partner/studio/create"
            title="Dodaj kolejne studio"
            subtitle="Utwórz nowy profil studia"
            Icon={Plus}
          />
        </div>
      )}

      {!isLoading && capabilities?.soloStudioId && (
        <StudioWorkspaceRows
          studioId={capabilities.soloStudioId}
          studioName="Własne zajęcia"
          solo
        />
      )}
      {!isLoading && capabilities && !capabilities.businessMode && managedStudios.length === 0 && (
        <section className="space-y-2">
          <SectionLabel>Zarządzanie</SectionLabel>
          <p className="px-1 text-sm text-gray-500">
            Jedno konto, jeden sposób zarządzania. Do drugiego trybu możesz założyć osobne konto
          </p>
          <BusinessDirectionCards />
        </section>
      )}

      {!isLoading && capabilities && capabilities.businessMode !== "solo" && user && (
        <div key={user.id} className="space-y-6">
          <ImportEntry />
          <SavedImports />
        </div>
      )}

      {/* B2B→B2C switch — the calm counterpart to the pinned B2C button (T13);
          calm here because the tab bar already exists (spec-b2b §2). */}
      {/* `bg-b2b-green-bg` is #ECFDF5 — lighter and cooler than the design's #E7F3EB, which
          is exactly the mismatch the user reported. It comes from the token now.
          Stays a bordered card rather than a solid button: B2B already has a tab bar, so
          the switch is calm here, while B2C (which has none) gets the pinned button. */}
      <Link
        href="/account"
        className="flex items-center gap-3 rounded-b2b border bg-white px-4 py-4 hover:bg-gray-50 transition-colors"
      >
        <MenuIconTile>
          <ArrowLeftRight size={18} className="text-b2b-green-text" />
        </MenuIconTile>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-gray-800">Przełącz na konto osobiste</p>
          <p className="text-sm text-gray-500">Twoje rezerwacje, karnety, odkrywanie</p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-gray-400" />
      </Link>
    </div>
  );
}
