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

/** Assignment candidates are separate from independently editable profiles. */
export function useAssignableInstructors(
  studioId: string | null,
  whenNoStudio: "partner-list" | "empty" = "empty",
): PickableInstructor[] {
  return useAssignableInstructorSource(studioId, whenNoStudio).instructors;
}

/** Scope-keyed results keep old rows from flashing when the selected studio changes. */
export function useAssignableInstructorSource(
  studioId: string | null,
  whenNoStudio: "partner-list" | "empty" = "empty",
) {
  const key = studioId || whenNoStudio;
  const empty = !studioId && whenNoStudio === "empty";
  const [result, setResult] = useState<{
    key: string;
    instructors: PickableInstructor[];
    error: boolean;
  } | null>(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async (): Promise<PickableInstructor[] | null> => {
    const request = ++requestRef.current;
    setResult(null);
    try {
      const rows = empty
        ? []
        : (
            await axiosInstance.get<PickableInstructor[]>("/instructors/assignable", {
              params: studioId ? { studio_id: studioId } : undefined,
            })
          ).data;
      if (request !== requestRef.current) return null;
      const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
      setResult({ key, instructors: unique, error: false });
      return unique;
    } catch {
      if (request === requestRef.current) setResult({ key, instructors: [], error: true });
      return null;
    }
  }, [studioId, key, empty]);

  useEffect(() => {
    void refresh();
    return () => {
      requestRef.current += 1;
    };
  }, [refresh]);

  const current = result?.key === key ? result : null;
  return {
    instructors: current?.instructors ?? [],
    loading: !empty && !current,
    error: current?.error ?? false,
    refresh,
  };
}
