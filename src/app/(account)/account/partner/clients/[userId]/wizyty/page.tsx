"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ClientVisitRow } from "@/components/b2b/ClientVisitRow";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";

import type { ClientVisitMonth } from "../../types";

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function ClientVisitsPage() {
  const params = useParams<{ userId: string }>();
  const { studio, isLoading: isStudioLoading } = useCurrentStudio();
  const [months, setMonths] = useState<ClientVisitMonth[] | null>(null);

  useEffect(() => {
    if (!studio) return;
    axiosInstance
      .get<ClientVisitMonth[]>(`/studios/${studio.id}/clients/${params.userId}/visits`)
      .then(({ data }) => setMonths(data))
      .catch(() => setMonths([]));
  }, [studio, params.userId]);

  if (isStudioLoading || !months) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center text-sm text-gray-400">
        Brak wizyt.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      {months.map(({ month, visits }) => (
        <div key={month} className="space-y-2">
          <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {monthLabel(month)}
          </h2>
          <div className="rounded-xl border bg-white overflow-hidden divide-y">
            {visits.map((v) => (
              <ClientVisitRow key={v.booking_id} visit={v} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
