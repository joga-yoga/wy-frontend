"use client";
import { ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { importsApi } from "./api";
import type { ImportJob } from "./types";
export function SavedImports() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([importsApi.list(), importsApi.config()])
      .then(([list, config]) => {
        if (active) {
          setJobs(list.filter((job) => !["expired", "cancelled"].includes(job.state)));
          setEnabled(config.enabled);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!enabled && !jobs.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase text-gray-400">Przenoszenie studia</h2>
      <div className="divide-y overflow-hidden rounded-xl border bg-white">
        {jobs.slice(0, 3).map((job) => (
          <Link
            key={job.id}
            href={`/account/partner/studio/import/fitssey/${job.id}`}
            className="flex items-center gap-3 p-4"
          >
            <Download size={18} />
            <span className="flex-1">
              <span className="block text-sm font-medium">Fitssey · {job.source_uuid}</span>
              <span className="text-xs text-gray-500">
                {job.state === "completed"
                  ? "Sprawdź studia i publikację"
                  : job.state === "review"
                    ? "Wybierz dane do importu"
                    : job.state === "reconnect_required"
                      ? "Połącz ponownie konto"
                      : "Kontynuuj import"}
              </span>
            </span>
            <ChevronRight size={16} />
          </Link>
        ))}
        {enabled && (
          <Link
            href="/account/partner/studio/import/fitssey"
            className="block p-4 text-sm font-medium text-brand-green-700"
          >
            Przenieś studio z Fitssey →
          </Link>
        )}
      </div>
    </section>
  );
}
