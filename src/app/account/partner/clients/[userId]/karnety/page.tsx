"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PassCard } from "@/components/b2b/PassCard";
import { useSetPageSubtitle } from "@/context/PageHeaderContext";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";
import { personLabel } from "@/lib/personDisplay";

import type { ClientDetail, ClientPassOut } from "../../types";

/**
 * Karnety klienta (mockup K3) — every pass this client has ever held at this studio.
 *
 * The profile card shows one pass: the usable one, or the most recent if none is usable.
 * That is the right answer to "can they train today?" and the wrong one to "what did they
 * buy in April?". This screen answers the second, which is the question a desk gets when
 * a client disputes a charge.
 *
 * Every state comes from the server's `pass_state`, the same helper behind the profile
 * card, so a pass cannot read "Aktywny" here and "Wygasł" there.
 */
export default function ClientPassesPage() {
  const params = useParams<{ userId: string }>();
  const { studio, isLoading: isStudioLoading } = useCurrentStudio();
  const [passes, setPasses] = useState<ClientPassOut[] | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);

  useSetPageSubtitle(clientName);

  useEffect(() => {
    if (!studio) return;
    axiosInstance
      .get<ClientPassOut[]>(`/studios/${studio.id}/clients/${params.userId}/passes`)
      .then(({ data }) => setPasses(data))
      .catch(() => setPasses([]));
    axiosInstance
      .get<ClientDetail>(`/studios/${studio.id}/clients/${params.userId}`)
      .then(({ data }) => setClientName(personLabel(data.name, data.email).primary))
      .catch(() => undefined);
  }, [studio, params.userId]);

  if (isStudioLoading || !passes) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-gray-400">
        Brak karnetów.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3 px-4 py-5">
      {passes.map((pass) => (
        <PassCard key={pass.id} pass={pass} />
      ))}
    </div>
  );
}
