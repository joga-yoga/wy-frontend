import { ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * The line above a directory page's `h1`.
 *
 * It used to read `joga.yoga · Kraków`, which spent its first and most prominent word
 * repeating the logo sitting directly above it — and was not a link, so the one genuinely
 * useful thing it could have done, getting the reader back up a level, it did not do.
 *
 * Now it is a real trail: **Studia** goes to the index, and the current page is the last
 * crumb, unlinked because you are on it. `Studia` rather than "wszystkie miasta" because it
 * is that page's actual name and honest anchor text — the index also lists towns, not only
 * cities.
 *
 * A crumb with no `href` renders as plain text. That is how a studio in a town below the
 * three-published threshold shows its city: the name is real, the page is not, and linking
 * it would send the reader to a 404.
 */
export interface Crumb {
  label: string;
  href?: string | null;
}

export function DirectoryBreadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Ścieżka nawigacji">
      <ol className="text-filter-subtitle flex flex-wrap items-center gap-1 text-gray-500">
        {trail.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-gray-400" aria-hidden />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-gray-900 hover:underline">
                {crumb.label}
              </Link>
            ) : (
              // The current page, or a city with no page of its own.
              <span aria-current={index === trail.length - 1 ? "page" : undefined}>
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
