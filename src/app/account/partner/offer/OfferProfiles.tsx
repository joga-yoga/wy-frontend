"use client";

import { isAxiosError } from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { StudioLogoTile } from "@/components/b2b/StudioLogoTile";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { BusinessDirectionCards } from "@/components/menu/BusinessDirectionCards";
import { Button } from "@/components/ui/button";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { axiosInstance } from "@/lib/axiosInstance";
import type { InstructorProfile } from "@/types/instructor";

import type { StudioApiResponse } from "../studio/[studioId]/edit/types";
import { PublicViewLink } from "./PublicViewLink";

type Profile = { name: string; imageId?: string | null; publicHref: string | null };

function ProfileRow({
  id,
  kind,
  name,
  imageId,
}: {
  id: string;
  kind: "studio" | "instructor";
  name: string;
  imageId?: string | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };
    setProfile(null);
    setHasError(false);
    async function load() {
      try {
        if (kind === "studio") {
          const { data } = await axiosInstance.get<StudioApiResponse>(`/studios/${id}`, config);
          if (controller.signal.aborted) return;
          setProfile({
            name: data.name,
            imageId: data.image_id,
            publicHref:
              data.slug &&
              !data.migration_pending &&
              !data.solo_instructor_id &&
              data.status !== "archived"
                ? `/studio/${data.slug}`
                : null,
          });
        } else {
          const { data } = await axiosInstance.get<InstructorProfile>(`/instructors/${id}`, config);
          if (controller.signal.aborted) return;
          setProfile({ name: data.name, imageId: data.image_id, publicHref: null });
          // Detail responses do not expose migration_pending. Ask the public endpoint
          // whether a destination exists; listing/publication flags govern its content,
          // not direct-link availability.
          if (data.slug) {
            try {
              await axiosInstance.get<unknown>(`/instructor/${data.slug}`, config);
            } catch (error) {
              if (isAxiosError(error) && error.response?.status === 404) return;
              throw error;
            }
            if (!controller.signal.aborted)
              setProfile({
                name: data.name,
                imageId: data.image_id,
                publicHref: `/instruktor/${data.slug}`,
              });
          }
        }
      } catch {
        if (!controller.signal.aborted) setHasError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, kind, name, imageId, attempt]);

  const displayName = profile?.name ?? name;
  const displayImage = profile ? profile.imageId : imageId;
  const label = kind === "studio" ? "Edytuj stronę studia" : "Edytuj swój profil";
  const editHref = `/account/partner/${kind === "studio" ? "studio" : "instructors"}/${id}/edit?from=offer`;

  return (
    <div className="rounded-b2b border bg-white">
      <div className="flex items-center">
        <Link
          href={editHref}
          aria-label={`${label}: ${displayName}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-b2b px-3 py-4 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-b2b-green-strong"
        >
          {kind === "studio" ? (
            <StudioLogoTile name={displayName} imageId={displayImage} size={46} />
          ) : (
            <HashedAvatar seed={id} name={displayName} imageId={displayImage} size={46} />
          )}
          <span className="min-w-0">
            <span className="block break-words text-base font-semibold text-gray-900">
              {displayName}
            </span>
            <span className="block text-sm text-gray-500">{label}</span>
          </span>
        </Link>
        {profile?.publicHref && (
          <div className="shrink-0 pr-3">
            <PublicViewLink href={profile.publicHref} name={displayName} />
          </div>
        )}
      </div>
      {hasError && (
        <div className="px-3 pb-3 text-sm text-gray-500" role="status">
          Nie udało się wczytać podglądu.
          <Button
            variant="link"
            size="sm"
            onClick={() => setAttempt((value) => value + 1)}
            aria-label={`Wczytaj ponownie: ${displayName}`}
          >
            Spróbuj ponownie
          </Button>
        </div>
      )}
    </div>
  );
}

export function OfferProfiles() {
  const { capabilities, isLoading, refetch } = usePartnerCapabilities();
  // The provider handles its initial request. A later tab entry refreshes cached
  // ownership; detail rows remount with Oferta and read the saved profile again.
  const refreshOnEntry = useRef(!isLoading);
  useEffect(() => {
    if (refreshOnEntry.current) refetch();
  }, [refetch]);

  if (isLoading)
    return (
      <p className="text-sm text-gray-500" role="status">
        Ładowanie profili…
      </p>
    );
  if (!capabilities)
    return (
      <div role="status">
        <p>Nie udało się wczytać profili.</p>
        <Button variant="outline" onClick={refetch}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  if (!capabilities.businessMode && capabilities.managedStudios.length === 0)
    return (
      <section className="space-y-2" aria-label="Zarządzanie">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Zarządzanie
        </h2>
        <p className="px-1 text-sm text-gray-500">
          Jedno konto, jeden sposób zarządzania. Do drugiego trybu możesz założyć osobne konto
        </p>
        <BusinessDirectionCards fromOffer />
      </section>
    );
  return (
    <section className="space-y-3" aria-label="Twoje profile">
      {capabilities.managedStudios.map((studio) => (
        <ProfileRow
          key={studio.id}
          id={studio.id}
          kind="studio"
          name={studio.name}
          imageId={studio.image_id}
        />
      ))}
      {capabilities.soloStudioId && capabilities.selfInstructorId && (
        <ProfileRow
          key={capabilities.selfInstructorId}
          id={capabilities.selfInstructorId}
          kind="instructor"
          name="Twój profil instruktora"
        />
      )}
    </section>
  );
}
