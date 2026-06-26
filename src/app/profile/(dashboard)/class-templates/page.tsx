"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import type { ClassTemplate } from "./types";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "początkujący",
  intermediate: "średni",
  advanced: "zaawansowany",
  all_levels: "wszystkie poziomy",
};

function templateSubtitle(t: ClassTemplate): string {
  const parts: string[] = [];
  parts.push(`${t.duration_minutes} min`);
  if (t.level && LEVEL_LABELS[t.level]) parts.push(LEVEL_LABELS[t.level]);
  if (t.style) parts.push(t.style);
  return parts.join(" · ");
}

export default function ClassTemplatesPage() {
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
    <div className="p-4 mx-auto max-w-lg">
      <p className="text-xs text-gray-500 mb-4">
        Definicje zajęć używane przy dodawaniu do grafiku.
      </p>

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
          <Link href="/profile/class-templates/create">
            <Button variant="outline" size="sm" className="mt-2">
              <Plus size={14} className="mr-1" />
              Utwórz pierwszy szablon
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/profile/class-templates/${t.id}/edit`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {t.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {templateSubtitle(t)}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </Link>
          ))}
          <Link href="/profile/class-templates/create">
            <button className="w-full text-center py-3 text-sm font-medium text-blue-600 hover:text-blue-700">
              <Plus size={14} className="inline mr-1" />
              Nowy szablon
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
