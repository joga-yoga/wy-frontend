"use client";

import { ArrowLeftRight, ChevronRight, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StudioLogoTile } from "@/components/b2b/StudioLogoTile";
import { MenuRow } from "@/components/menu/MenuRow";
import { StudioWorkspaceRows } from "@/components/menu/StudioWorkspaceRows";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

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
  const { signOut } = useAuth();
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
                leading={<StudioLogoTile name={studio.name} imageId={studio.image_id} />}
              />
            ))}
          </div>
        </section>
      )}

      {!isLoading && hasTeachingOnly && (
        <section className="space-y-2">
          <SectionLabel>Studio</SectionLabel>
          <Link
            href="/account/partner/studio/create"
            className="flex items-center justify-center rounded-b2b border border-dashed bg-white px-4 py-4 text-center hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm text-gray-500">Prowadzisz własne studio?</p>
              <p className="text-sm font-semibold text-brand-green-700">Utwórz studio</p>
            </div>
          </Link>
        </section>
      )}

      {!isLoading && managedStudios.length === 0 && !hasTeachingOnly && (
        <section className="space-y-2">
          <SectionLabel>Studio</SectionLabel>
          <Link
            href="/account/partner/studio/create"
            className="flex items-center justify-center rounded-b2b border border-dashed bg-white px-4 py-4 text-center hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm text-gray-500">Prowadzisz studio jogi?</p>
              <p className="text-sm font-semibold text-brand-green-700">Utwórz studio</p>
            </div>
          </Link>
        </section>
      )}

      <section className="space-y-2">
        <SectionLabel>Konto</SectionLabel>
        <div className="rounded-b2b border bg-white overflow-hidden divide-y">
          <MenuRow
            href="/account/partner/profile"
            title="Profil"
            subtitle="Imię, e-mail, zdjęcie"
            Icon={UserRound}
          />
        </div>
      </section>

      {/* B2B→B2C switch — the calm counterpart to the pinned B2C button (T13);
          calm here because the tab bar already exists (spec-b2b §2). */}
      {/* `bg-b2b-green-bg` is #ECFDF5 — lighter and cooler than the design's #E7F3EB, which
          is exactly the mismatch the user reported. It comes from the token now.
          Stays a bordered card rather than a solid button: B2B already has a tab bar, so
          the switch is calm here, while B2C (which has none) gets the pinned button. */}
      <Link
        href="/account"
        className="flex items-center gap-3 rounded-b2b border bg-white px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-b2b-green-bg text-b2b-green-text">
          <ArrowLeftRight size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Przełącz na konto osobiste</p>
          <p className="text-xs text-gray-500">Twoje rezerwacje, karnety, odkrywanie</p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-gray-400" />
      </Link>

      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-b2b-red-solid hover:text-b2b-red-solid"
      >
        <LogOut size={14} />
        Wyloguj się
      </button>
    </div>
  );
}
