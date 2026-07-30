"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { useSetPageSubtitle } from "@/context/PageHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { COLOR_SWATCH_MAP } from "@/lib/classColors";
import { szablony } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";

import type { ClassTemplate } from "./types";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "początkujący",
  intermediate: "średni",
  advanced: "zaawansowany",
  all_levels: "wszystkie poziomy",
};

function templateSubtitle(t: ClassTemplate): string {
  // U1 renders an unset default as an explicit "— brak —" rather than dropping the slot,
  // so every row has the same shape and a missing default is visible instead of implied.
  return [
    `${t.duration_minutes} min`,
    t.level && LEVEL_LABELS[t.level] ? LEVEL_LABELS[t.level] : "— brak —",
    t.style || "— brak —",
  ].join(" · ");
}

export default function ClassTemplatesPage() {
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // U1 subtitles the header with the count. It also names the studio — templates are
  // partner-scoped and belong to no single studio, so that half is deliberately omitted
  // rather than fabricated (user's call).
  useSetPageSubtitle(isLoading ? null : szablony(templates.length));

  useEffect(() => {
    setIsLoading(true);
    axiosInstance
      .get<ClassTemplate[]>("/class-templates")
      .then((r) => setTemplates(r.data ?? []))
      .catch(() => {
        toast({
          description: "Nie udało się załadować szablonów.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  return (
    <div className="mx-auto max-w-lg p-4">
      {isLoading ? (
        <p className="text-center text-gray-400 py-8">Ładowanie...</p>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-gray-50 py-8 px-4 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <Plus size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Brak szablonów zajęć</p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Szablon to definicja zajęć (np. &ldquo;Vinyasa Flow&rdquo;, 60 min). Tworzysz go raz,
            potem szybko dodajesz do grafiku.
          </p>
          <Link href="/konto/partner/szablony-zajec/create">
            <Button variant="outline" size="sm" className="mt-2">
              <Plus size={14} className="mr-1" />
              Utwórz pierwszy szablon
            </Button>
          </Link>
        </div>
      ) : (
        // U1 draws one container with dividers, not a stack of cards — the same shape
        // part 1 landed for Grafik. Cards imply each row is a separate object; this is
        // one catalogue.
        <div className="divide-y overflow-hidden rounded-xl border bg-white">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/konto/partner/szablony-zajec/${t.id}/edit`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  t.color ? COLOR_SWATCH_MAP[t.color] : "bg-gray-200",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{t.title}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{templateSubtitle(t)}</p>
              </div>
              <IoChevronForward className="h-4 w-4 shrink-0 text-gray-300" />
            </Link>
          ))}
          <Link
            href="/konto/partner/szablony-zajec/create"
            className="flex items-center justify-center gap-1.5 px-4 py-3.5 text-sm font-semibold text-b2b-green-text transition-colors hover:bg-gray-50"
          >
            <Plus size={16} />
            Nowy szablon
          </Link>
        </div>
      )}
    </div>
  );
}
