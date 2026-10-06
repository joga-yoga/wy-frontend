import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

import { ArticleText, safeArticleHref } from "./article-text";
import { blogNavigationPath } from "./mirror";
import { articleJsonLd, blogPath } from "./seo";
import type { ArticleDetail } from "./types";

function ArticleDate({ value, label }: { value: string; label: string }) {
  return (
    <span>
      {label}{" "}
      <time dateTime={value}>
        {new Intl.DateTimeFormat("pl-PL", { dateStyle: "long", timeZone: "Europe/Warsaw" }).format(
          new Date(value),
        )}
      </time>
    </span>
  );
}

export function ArticleView({
  article,
  mirror = false,
}: {
  article: ArticleDetail;
  mirror?: boolean;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 md:px-8 py-8 md:py-14">
      <nav aria-label="Okruszki" className="mb-8 text-sm text-gray-600">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href={mirror ? "https://joga.yoga/" : "/"} className="hover:underline">
              Strona główna
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={blogNavigationPath(undefined, mirror)} className="hover:underline">
              Blog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="min-w-0 break-words">
            {article.title}
          </li>
        </ol>
      </nav>
      <article className="text-gray-800">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight text-gray-900 break-words">
            {article.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
            {article.author && <span>{article.author.name}</span>}
            {article.published_at && (
              <ArticleDate value={article.published_at} label="Opublikowano" />
            )}
            <ArticleDate value={article.updated_at} label="Aktualizacja" />
          </div>
          <div className="mt-6 text-xl leading-relaxed">
            <ArticleText text={article.content.lead} />
          </div>
          {article.content.headline && article.content.headline !== article.title && (
            <p className="mt-6 text-lg font-semibold">{article.content.headline}</p>
          )}
        </header>
        <div className="space-y-10 text-lg leading-relaxed">
          {article.content.sections.map((section, index) => (
            <section key={index}>
              {section.title && (
                <h2 className="mb-4 text-2xl font-semibold leading-snug text-gray-900">
                  {section.title}
                </h2>
              )}
              <ArticleText text={section.body} />
            </section>
          ))}
          {!!article.content.faq.length && (
            <section aria-labelledby="article-faq">
              <h2 id="article-faq" className="mb-6 text-2xl font-semibold">
                Pytania i odpowiedzi
              </h2>
              <div className="space-y-6">
                {article.content.faq.map((faq, index) => (
                  <div key={index}>
                    <h3 className="mb-3 text-xl font-semibold">{faq.question}</h3>
                    <ArticleText text={faq.answer} />
                  </div>
                ))}
              </div>
            </section>
          )}
          {article.content.medical_disclaimer?.trim() && (
            <aside
              aria-labelledby="article-disclaimer"
              className="rounded-2xl bg-gray-100 p-5 md:p-6 text-base"
            >
              <h2 id="article-disclaimer" className="mb-3 text-lg font-semibold">
                Informacja medyczna
              </h2>
              <ArticleText text={article.content.medical_disclaimer} />
            </aside>
          )}
          {!!article.citations.length && (
            <section aria-labelledby="article-sources" className="text-base">
              <h2 id="article-sources" className="mb-4 text-2xl font-semibold">
                Źródła
              </h2>
              <ol className="list-decimal pl-6 space-y-3">
                {article.citations.map((citation, index) => {
                  const href = safeArticleHref(citation);
                  return (
                    <li key={index} className="break-words">
                      {href ? (
                        <a href={href} className="underline underline-offset-4 hover:text-gray-600">
                          {citation}
                        </a>
                      ) : (
                        citation
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>
      </article>
      <div className="mt-12 border-t pt-6">
        <Link
          href={blogNavigationPath(undefined, mirror)}
          className="font-semibold underline underline-offset-4"
        >
          ← Wróć do bloga
        </Link>
      </div>
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Blog", path: "/blog" },
          { name: article.title, path: blogPath(article.slug) },
        ])}
      />
    </main>
  );
}
