import Link from "next/link";

import { ArticleText } from "./article-text";
import { blogPath } from "./seo";
import type { ArticleSummary } from "./types";

export function BlogIndex({ items }: { items: ArticleSummary[] }) {
  return (
    <main className="container-wy mx-auto px-5 md:px-8 py-10 md:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Blog</h1>
        <p className="mt-4 text-lg text-gray-600">
          Artykuły o jodze, codziennej praktyce i odpoczynku.
        </p>
      </header>
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <article
              key={article.slug}
              className="flex flex-col rounded-2xl border border-gray-200 p-6 md:p-7"
            >
              <h2 className="text-xl font-semibold leading-snug text-gray-900">
                <Link
                  href={blogPath(article.slug)}
                  prefetch={false}
                  className="hover:underline underline-offset-4"
                >
                  {article.title}
                </Link>
              </h2>
              <div className="mt-4 mb-6 text-base leading-relaxed text-gray-600">
                <ArticleText text={article.lead || article.description} />
              </div>
              <Link
                href={blogPath(article.slug)}
                prefetch={false}
                className="mt-auto text-sm font-semibold underline underline-offset-4"
                aria-label={`Czytaj artykuł: ${article.title}`}
              >
                Czytaj artykuł <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Nie ma jeszcze opublikowanych artykułów.</p>
      )}
    </main>
  );
}
