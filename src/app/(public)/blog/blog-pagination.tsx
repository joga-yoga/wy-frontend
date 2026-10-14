import Link from "next/link";
import { Fragment } from "react";

import { buttonVariants } from "@/components/ui/button";

import { blogIndexPath, blogPageNumbers } from "./pagination";

export function BlogPagination({
  page,
  totalPages,
  mirror,
}: {
  page: number;
  totalPages: number;
  mirror: boolean;
}) {
  if (totalPages <= 1) return null;
  const pages = blogPageNumbers(page, totalPages);

  return (
    <nav aria-label="Paginacja bloga" className="mt-10 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        {page > 1 ? (
          <Link
            href={blogIndexPath(page - 1, mirror)}
            prefetch={false}
            rel="prev"
            className={buttonVariants({ variant: "outline" })}
          >
            Poprzednia
          </Link>
        ) : (
          <span />
        )}
        <p className="text-sm text-muted-foreground">
          Strona {page} z {totalPages}
        </p>
        {page < totalPages ? (
          <Link
            href={blogIndexPath(page + 1, mirror)}
            prefetch={false}
            rel="next"
            className={buttonVariants({ variant: "outline" })}
          >
            Następna
          </Link>
        ) : (
          <span />
        )}
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {pages.map((number, index) => (
          <Fragment key={number}>
            {index > 0 && number - pages[index - 1] > 1 && (
              <li aria-hidden="true" className="px-1 text-muted-foreground">
                …
              </li>
            )}
            <li>
              <Link
                href={blogIndexPath(number, mirror)}
                prefetch={false}
                aria-label={`Strona ${number}`}
                aria-current={number === page ? "page" : undefined}
                className={buttonVariants({
                  variant: number === page ? "outline" : "ghost",
                  size: "icon",
                })}
              >
                {number}
              </Link>
            </li>
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}
