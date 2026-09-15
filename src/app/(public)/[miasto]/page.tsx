import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DirectoryBreadcrumb } from "@/components/directory/DirectoryBreadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCityDirectory, getDirectoryCities } from "@/lib/api/getCityDirectory";
import { cityOpeningSentence, studios } from "@/lib/directoryCopy";
import { buildBreadcrumbJsonLd, buildCityDirectoryJsonLd, buildPageMetadata } from "@/lib/seo";

import { CityStudioList } from "./CityStudioList";

/**
 * A city hub at the root of the domain — `/krakow`, `/wroclaw`, `/bielsko-biala`.
 *
 * **The folder is `[miasto]` rather than an English name behind a rewrite**, which breaks
 * the convention every other public route here follows (`/instruktorzy → /instructors`,
 * `/zajecia → /classes`). The convention exists so folder names stay language-neutral for
 * future i18n — but the segment *is* the city, and a Polish city name has no English
 * equivalent to rewrite from. There is nothing to translate, so there is nothing to keep
 * neutral.
 *
 * ⚠ **This route occupies the root namespace.** An unknown segment must be a hard 404, not
 * an empty city page: soft-404 sprawl at the root is precisely what this domain, recovering
 * from consolidation, cannot afford. The list it resolves against is the city table, and
 * `wy-backend/tests/test_directory_city_slugs.py` fails the build if a city slug ever
 * collides with a real top-level route. That check is the standing cost of this decision —
 * every future top-level route has to clear it.
 */
interface CityPageProps {
  params: Promise<{ miasto: string }>;
}

export async function generateStaticParams() {
  const cities = await getDirectoryCities();
  return cities.map((city) => ({ miasto: city.slug }));
}

/** Neutral platform voice: a city page belongs to no studio, so it never says "u nas". */
function titleFor(name: string) {
  return `Studia jogi – ${name} | joga.yoga`;
}

function descriptionFor(name: string, locative: string | null | undefined, activeCount: number) {
  // Use the stored locative when there is one — "63 studia jogi w Krakowie" reads as
  // Polish, "w mieście Kraków" reads as a template. The fallback exists only because a
  // city can legitimately have no phrase yet, and a description is not worth guessing a
  // case for.
  const where = locative ?? `w mieście ${name}`;
  return `${studios(activeCount)} jogi ${where}. Adresy, style i kontakt.`;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { miasto } = await params;
  const payload = await getCityDirectory(miasto);

  if (!payload) {
    notFound();
  }

  const { summary } = payload;
  return buildPageMetadata({
    project: "workshops",
    title: titleFor(summary.name),
    description: descriptionFor(summary.name, summary.city_locative, summary.active_count),
    path: `/${miasto}`,
  });
}

export default async function CityPage({ params }: CityPageProps) {
  // ⚠ **`connection()` is what makes an unknown segment a real 404**, and it is not
  // decoration.
  //
  // With Cache Components on, a page is served as a prerendered shell plus streamed
  // content — so a `notFound()` reached while streaming arrives *after* the response has
  // already gone out with `200 OK`. Measured, not assumed: `/nieistniejace-miasto` served
  // the 404 body under `HTTP/1.1 200` with `x-nextjs-prerender: 1`. To a crawler that is a
  // soft 404, which is exactly the failure §7 says this domain cannot afford at the root.
  //
  // Awaiting `connection()` opts this route out of prerendering, so the status is decided
  // with the body. (`dynamicParams = false` would also work and would keep the shell
  // static, but Next rejects it outright under `cacheComponents`.)
  //
  // **The cost is smaller than it looks:** the page renders per request, but
  // `getCityDirectory` is a `"use cache"` function, so the database is not touched per
  // request — only the HTML assembly is repeated. In exchange, §3 keeps healing itself: a
  // city crossing the three-published threshold appears on the next import with no deploy.
  await connection();

  const { miasto } = await params;
  const payload = await getCityDirectory(miasto);

  // A city below the three-published threshold has no page. Its studios are still reachable
  // from /studia, grouped by town, so nothing is orphaned in the sitemap.
  if (!payload) {
    notFound();
  }

  const { summary } = payload;
  // AC10: a city with no stored locative omits the paragraph rather than generating one.
  // Polish locative cannot be derived from the nominative, so a guess would be wrong in the
  // first line of the page — and a wrong case there is more damaging than no line at all.
  const opening = cityOpeningSentence(summary.city_locative, summary.active_count);

  return (
    <div className="flex flex-col gap-6 p-4 pb-10">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Studia jogi", path: "/studia" },
          { name: summary.name, path: `/${miasto}` },
        ])}
      />
      <JsonLd
        data={buildCityDirectoryJsonLd({
          path: `/${miasto}`,
          name: titleFor(summary.name),
          description: descriptionFor(summary.name, summary.city_locative, summary.active_count),
        })}
      />

      <header className="flex flex-col gap-3">
        <div>
          <DirectoryBreadcrumb
            trail={[{ label: "Studia", href: "/studia" }, { label: summary.name }]}
          />
          <h1 className="text-h-middle mt-1 text-gray-900">
            Studia jogi {summary.city_locative ?? `– ${summary.name}`}
          </h1>
        </div>

        {/* The sentence carries only what the style filter below cannot say for itself. The
            style ranking was here in an earlier draft and repeated the filter's own numbers,
            which was padding rather than content. */}
        {opening && <p className="text-descrip-under-header text-gray-700">{opening}</p>}

        <div className="flex flex-wrap gap-2">
          {summary.pilates_count > 0 && (
            <FactChip>{studios(summary.pilates_count)} z pilatesem</FactChip>
          )}
          {summary.meditation_count > 0 && (
            <FactChip>{studios(summary.meditation_count)} z medytacją</FactChip>
          )}
        </div>
      </header>

      <CityStudioList payload={payload} />
    </div>
  );
}

/** Brand green as an **accent carrying a fact about the city**, never as a status.
 *
 * That colour means "state" in the partner panel — active, selected, confirmed — so a chip
 * in the same green on a public page has to be unmistakably a fact rather than a condition
 * of the row it sits near. Keeping it in the header, away from the list, is what separates
 * the two readings.
 */
function FactChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-m-sunscript-font border-b2b-green-border bg-b2b-green-bg text-b2b-green-strong rounded-full border px-3 py-1">
      {children}
    </span>
  );
}
