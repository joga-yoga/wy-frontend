"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PickableInstructor } from "@/app/account/partner/schedule/components/InstructorPicker";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { axiosInstance } from "@/lib/axiosInstance";

/**
 * Which studio's roster an instructor picker should show, when the screen is not itself
 * studio-routed.
 *
 * Mirrors the schedule wizard's resolution exactly — `?studio_id=` (the convention Grafik's
 * "+" button and `GrafikContextChips` already carry), then the partner's single managed
 * studio, then nothing.
 *
 * ⚠ **Deliberately not `useCurrentStudio`.** That hook falls back to `managedStudios[0]`
 * unconditionally, which is right for a studio-scoped Menu screen — it is *about* one studio,
 * and picking the first is a sane default. It is wrong here: a class template is
 * partner-scoped, so silently resolving a multi-studio partner to studio A would hide studio
 * B's instructors behind a choice nobody made. Returning `null` lets the caller decide, and
 * `useAssignableInstructors`'s `"partner-list"` mode answers with *everyone* instead.
 */
export function useAssignableStudioId(): string | null {
  const searchParams = useSearchParams();
  const { capabilities } = usePartnerCapabilities();

  const managed = capabilities?.managedStudios ?? [];
  const requested = searchParams.get("studio_id");
  const match = requested ? managed.find((s) => s.id === requested) : undefined;
  if (match) return match.id;
  return managed.length === 1 ? managed[0].id : null;
}

/**
 * The instructors an `InstructorPicker` can offer.
 *
 * The roster — not the flat `/instructors` list — is the source whenever a studio is in
 * scope: it carries `image_id` and `row_state`, which are what make the picker a picker
 * rather than a dropdown of names (an avatar, and "Oczekuje na zaproszenie" for someone whose
 * invite is still outstanding).
 *
 * @param studioId      the studio whose roster to read, or `null` when none is in scope.
 * @param whenNoStudio  what `null` means for this caller, which is genuinely different in
 *                      the two places this is used:
 *                      - `"empty"` — the schedule wizard. A session belongs to exactly one
 *                        studio, so before one is chosen there is no correct list to show.
 *                      - `"partner-list"` — the class-template form. A template is
 *                        partner-scoped, so falling back to every instructor the partner has
 *                        is better than showing none. Those rows carry no `image_id` or
 *                        `row_state`; `InstructorPicker` degrades to initials without them.
 */
export function useAssignableInstructors(
  studioId: string | null,
  whenNoStudio: "partner-list" | "empty" = "empty",
): PickableInstructor[] {
  return useAssignableInstructorSource(studioId, whenNoStudio).instructors;
}

/** Same source, with an explicit refresh for contextual instructor additions. */
export function useAssignableInstructorSource(
  studioId: string | null,
  whenNoStudio: "partner-list" | "empty" = "empty",
) {
  const [instructors, setInstructors] = useState<PickableInstructor[]>([]);
  const requestRef = useRef(0);

  const refresh = useCallback(async (): Promise<PickableInstructor[] | null> => {
    const request = ++requestRef.current;
    try {
      let rows: PickableInstructor[] = [];
      if (studioId) {
        const { data } = await axiosInstance.get<{ items: PickableInstructor[] }>(
          `/studios/${studioId}/roster`,
        );
        rows = data.items.map(({ id, name, image_id, row_state }) => ({
          id,
          name,
          image_id,
          row_state,
        }));
      } else if (whenNoStudio === "partner-list") {
        const { data } = await axiosInstance.get<
          Array<{
            id: string;
            name: string;
            image_id?: string | null;
            claim_status?: string | null;
          }>
        >("/instructors");
        rows = (data ?? []).map(({ id, name, image_id, claim_status }) => ({
          id,
          name,
          image_id,
          row_state: claim_status === "invited" ? "awaiting" : undefined,
        }));
      }
      if (request !== requestRef.current) return null;
      const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
      setInstructors(unique);
      return unique;
    } catch {
      if (request === requestRef.current) setInstructors([]);
      return null;
    }
  }, [studioId, whenNoStudio]);

  useEffect(() => {
    setInstructors([]);
    void refresh();
    return () => {
      requestRef.current += 1;
    };
  }, [refresh]);

  return { instructors, refresh };
}
