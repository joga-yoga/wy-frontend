"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/**
 * The commit confirmation (mockup S10), shared by the edit and cancel flows.
 *
 * Every figure shown here comes from the **commit response**, never the preview payload: the
 * plan is recomputed at save time and can differ from what was on screen a moment earlier
 * (a booking landing in between, for instance). Callers must pass commit-derived numbers.
 */
export function ScheduleSuccessScreen({
  headline,
  body,
  summary,
  summaryNote = "Grafik odzwierciedla zmiany od razu.",
}: {
  headline: string;
  body: string;
  summary: string;
  summaryNote?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-b2b-green-bg text-b2b-green-text">
        <Check size={34} strokeWidth={2.5} />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-gray-900">{headline}</h2>
        <p className="text-sm text-gray-500">{body}</p>
      </div>
      <div className="w-full rounded-xl border bg-white px-4 py-3.5 text-left">
        <p className="text-sm font-semibold text-gray-900">{summary}</p>
        <p className="mt-0.5 text-xs text-gray-500">{summaryNote}</p>
      </div>
      {/* Black, not green: this is a way out, not another commitment. */}
      <Button className="w-full" onClick={() => router.push("/konto/partner/grafik")}>
        Wróć do grafiku
      </Button>
    </div>
  );
}
