"use client";
import { ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { importsApi } from "./api";
import type { ImportJob } from "./types";
export function SavedImports() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  useEffect(() => {
    let active = true;
    importsApi
      .list()
      .then((list) => {
        if (active) {
          setJobs(
            list.filter(
              (job) =>
                !["expired", "cancelled"].includes(job.state) &&
                (!job.transfer_closed ||
                  job.state === "importing" ||
                  ["apply", "asset"].includes(job.stage) ||
                  job.imported_count > 0),
            ),
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!jobs.length) return null;
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
      </div>
    </section>
  );
}
