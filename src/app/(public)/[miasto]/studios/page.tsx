import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DirectoryBreadcrumb } from "@/components/directory/DirectoryBreadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCityDirectory, getDirectoryCities } from "@/lib/api/getCityDirectory";
import { cityOpeningSentence, studios, styleInCity } from "@/lib/directoryCopy";
import { cityStudiosPath, cityStylePath } from "@/lib/directoryPaths";
import { buildBreadcrumbJsonLd, buildCityDirectoryJsonLd, buildPageMetadata } from "@/lib/seo";
import { getStyleCopy } from "@/lib/yogaStyleCopy";

import { CityStudioList } from "./CityStudioList";

/**
 * A city's studio directory — `/krakow/studia`, `/wroclaw/studia`.
 *
 * **The city leads the URL** so that `/krakow` can later become a city hub over studios,
 * instructors and events; until it does, `src/proxy.ts` answers `/krakow` with a 302 here. URL
 * shapes live in `lib/directoryPaths.ts`.
 *
 * **Folders:** `[miasto]` is a city name, which has no English form to rewrite from, so it stays
 * as it is; `studios` is English per the i18n convention, and the proxy maps the public `studia`
 * segment onto it (a `next.config` rewrite on `/:city/studia` would also catch
 * `/wydarzenia/studia` — a workshop slugged "studia").
 *
 * ⚠ **The city segment occupies the root namespace.** An unknown segment must be a hard 404, not
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
    path: cityStudiosPath(miasto),
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
          { name: summary.name, path: cityStudiosPath(miasto) },
        ])}
      />
      <JsonLd
        data={buildCityDirectoryJsonLd({
          path: cityStudiosPath(miasto),
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

      <StylePageLinks citySlug={miasto} payload={payload} />
    </div>
  );
}

/**
 * Links to this city's style pages — `/krakow/studia/hatha` — at the foot of the page.
 *
 * **At the bottom, deliberately.** These are here mainly for crawlers and for internal linking;
 * a reader looking for a class uses the style filter at the top, which stays the page's main
 * control. Above the list they competed with it.
 *
 * **A separate row, not the filter chips.** The chips filter this list in place; a chip that
 * sometimes filters and sometimes leaves the page would make every chip a guess. So the chips
 * stay a filter, and the styles that have a page of their own (the backend gate, `has_page`)
 * are named here as plain links — which is also what a crawler needs to find them.
 *
 * Rendered by the server page rather than inside `CityStudioList`, so the links are in the
 * server HTML and the style copy stays out of the client bundle.
 */
function StylePageLinks({
  citySlug,
  payload,
}: {
  citySlug: string;
  payload: NonNullable<Awaited<ReturnType<typeof getCityDirectory>>>;
}) {
  const city = { name: payload.summary.name, locative: payload.summary.city_locative };
  const links = payload.styles.flatMap((facet) => {
    const copy = facet.has_page ? getStyleCopy(facet.slug) : null;
    return copy ? [{ slug: facet.slug, label: styleInCity(copy.heading, city) }] : [];
  });
  if (links.length === 0) return null;

  return (
    <nav
      aria-label="Style jogi"
      className="text-m-sunscript-font border-t border-gray-100 pt-5 text-gray-500"
    >
      Zobacz też:{" "}
      {links.map((link, index) => (
        <span key={link.slug}>
          <Link
            href={cityStylePath(citySlug, link.slug)}
            className="text-gray-900 underline underline-offset-4 hover:text-gray-600"
          >
            {link.label}
          </Link>
          {index < links.length - 2 ? ", " : index === links.length - 2 ? " i " : ""}
        </span>
      ))}
    </nav>
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
