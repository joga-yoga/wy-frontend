"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function MenuRow({
  href,
  title,
  subtitle,
  Icon,
  /** Replaces the icon tile — the studio rows put their logo here (R1, D2). */
  leading,
}: {
  href: string;
  title: string;
  subtitle: string;
  Icon?: React.ElementType;
  leading?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      {leading ?? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          {Icon && <Icon size={18} className="text-gray-600" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </Link>
  );
}
