"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function MenuIconTile({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white"
    >
      {children}
    </span>
  );
}

export function MenuRow({
  href,
  title,
  subtitle,
  Icon,
  onClick,
  /** Replaces the icon tile — the studio rows put their logo here (R1, D2). */
  leading,
}: {
  href: string;
  title: string;
  subtitle: string;
  Icon?: React.ElementType;
  leading?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
    >
      {leading ?? (
        <MenuIconTile>{Icon && <Icon size={18} className="text-gray-600" />}</MenuIconTile>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </Link>
  );
}
