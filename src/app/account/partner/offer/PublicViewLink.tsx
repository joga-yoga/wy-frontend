import { ExternalLink } from "lucide-react";
import Link from "next/link";

export const offerActionClassName =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-b2b-green-strong";

export function PublicViewLink({ href, name }: { href: string; name: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Zobacz stronę publiczną: ${name} (nowa karta)`}
      className={offerActionClassName}
    >
      <ExternalLink size={18} className="size-4.5 bg-transparent fill-none" aria-hidden="true" />
    </Link>
  );
}
