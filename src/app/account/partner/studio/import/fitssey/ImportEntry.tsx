"use client";
import { ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { importsApi } from "./api";
export function ImportEntry() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    importsApi
      .config()
      .then((config) => {
        if (active) setEnabled(config.enabled);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!enabled) return null;
  return (
    <Link
      href="/account/partner/studio/import/fitssey"
      className="mx-auto my-4 flex max-w-lg items-center gap-3 rounded-xl border bg-white p-4"
    >
      <Download className="size-5 text-brand-green-700" />
      <span className="flex-1">
        <span className="block font-semibold">Przenieś studio z Fitssey</span>
        <span className="text-sm text-gray-500">Sprawdź dane i utwórz prywatną wersję studia</span>
      </span>
      <ChevronRight size={18} />
    </Link>
  );
}
