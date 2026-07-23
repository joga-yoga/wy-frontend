import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Standard circular chevron-left back button (T04), shared between the `/zajecia`
 * header and the class landing page's image-overlay header (positioning differs per
 * call site via `className`). */
export function BackButton({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="Wróć"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm",
        className,
      )}
    >
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );
}
