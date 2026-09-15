import { Metadata } from "next";
import Link from "next/link";

import { StudioCard } from "@/components/common/StudioCard";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { getStudiosIndex } from "@/lib/api/getCityDirectory";
import {
  miasta,
  miastaLocative,
  miejscowosci,
  miejscowosciLocative,
  studios,
} from "@/lib/directoryCopy";
import { buildCollectionJsonLd, buildPageMetadata } from "@/lib/seo";

// The folder is English and the public URL is Polish — `/studia` reaches this page through a
// rewrite in `next.config.mjs`, exactly as `/instruktorzy` reaches `instructors`.
const PUBLIC_PATH = "/studia";

// Neutral platform voice: this page belongs to no studio, so it never says "u nas".
//
// The title leads with what somebody actually searches for — "studia jogi" and a place —
// rather than with the brand. `joga.yoga` is the one thing a reader who reached this page
// already knows, so it earns the tail of the title, not the head.
const pageTitle = "Studia jogi w Polsce — katalog | joga.yoga";

/** The description carries the two facts that make this page worth opening over a search
 *  result: how much is actually in it, and what each entry tells you. Counts come from the
 *  data rather than being written down, so they cannot go stale against an import. */
function describe(cityCount: number, townCount: number, studioCount: number) {
  return (
    `Katalog ${studios(studioCount)} jogi w Polsce — ${miasta(cityCount)} ` +
    `i ${miejscowosci(townCount)}. Adresy, style, telefony i strony studiów.`
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { cities, towns } = await getStudiosIndex();
  return buildPageMetadata({
    project: "workshops",
    title: pageTitle,
    description: describe(cities.length, towns.length, totalStudios(cities, towns)),
    path: PUBLIC_PATH,
  });
}

function totalStudios(cities: { active_count: number }[], towns: { studios: unknown[] }[]): number {
  return (
    cities.reduce((sum, city) => sum + city.active_count, 0) +
    towns.reduce((sum, town) => sum + town.studios.length, 0)
  );
}

/** How many of them have a page of their own. Every town entry does — a town only appears
 *  here because its studios have pages — and a city contributes its published count. */
function studiosWithPages(
  cities: { published_count: number }[],
  towns: { studios: unknown[] }[],
): number {
  return (
    cities.reduce((sum, city) => sum + city.published_count, 0) +
    towns.reduce((sum, town) => sum + town.studios.length, 0)
  );
}

/**
 * The city index, and then the towns that did not earn a page.
 *
 * The second half is the part that matters structurally. A town with fewer than three
 * published studios gets no page of its own, but its studios still have pages — and a page
 * reachable only from the sitemap is a page search engines treat as an orphan. Listing them
 * inline here is what keeps them internally linked.
 */
export default async function StudiosIndexPage() {
  const { cities, towns } = await getStudiosIndex();
  const studioCount = totalStudios(cities, towns);
  const pagedCount = studiosWithPages(cities, towns);

  return (
    <div className="flex flex-col gap-8 p-4 pb-10">
      <JsonLd
        data={buildCollectionJsonLd({
          project: "workshops",
          path: PUBLIC_PATH,
          name: pageTitle,
          description: describe(cities.length, towns.length, studioCount),
        })}
      />

      <header className="flex flex-col gap-2">
        <h1 className="text-h-middle text-gray-900">Studia jogi w Polsce</h1>
        <p className="text-descrip-under-header text-gray-700">
          Zebraliśmy {studios(studioCount)} jogi w {miastaLocative(cities.length)} i{" "}
          {miejscowosciLocative(towns.length)} w całej Polsce. Przy każdym znajdziesz adres i
          telefon, a przy {pagedCount} — także style i opis.
        </p>
      </header>

      <section>
        <h2 className="text-filter-subtitle mb-3 uppercase tracking-wide text-gray-500">Miasta</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cities.map((city) => (
            <li key={city.slug}>
              <DetailPageLink
                href={`/${city.slug}`}
                className="flex flex-col rounded-xl border-[1.5px] border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50"
              >
                <span className="text-m-header text-gray-900">{city.name}</span>
                <span className="text-m-sunscript-font text-gray-500">
                  {studios(city.active_count)}
                </span>
              </DetailPageLink>
            </li>
          ))}
        </ul>
      </section>

      {towns.length > 0 && (
        <section>
          <h2 className="text-filter-subtitle uppercase tracking-wide text-gray-500">
            Mniejsze miejscowości
          </h2>
          <p className="text-m-sunscript-font mt-1 text-gray-500">
            Za mało studiów na osobną stronę miasta, ale każde z nich ma tu swój profil.
          </p>
          {/* The shared `StudioCard`, not a bare list of links. A studio is a studio wherever
              it happens to be, and a town's entries were the only place on this surface where
              one rendered as an underlined name with no logo and no address — which read as a
              footnote rather than as the same kind of thing the city pages list. */}
          <div className="mt-4 flex flex-col gap-6">
            {towns.map((town) => (
              <div key={town.name}>
                <h3 className="text-m-header text-gray-900">{town.name}</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {town.studios.map((studio) => (
                    <li
                      key={studio.external_id}
                      className="rounded-xl border-[1.5px] border-gray-200 bg-white px-3 py-3 hover:bg-gray-50"
                    >
                      <StudioCard
                        studio={{
                          id: studio.external_id,
                          name: studio.name,
                          slug: studio.slug,
                          // A managed studio's own logo when there is one, and `null`
                          // otherwise — the backend never puts an image on a directory
                          // listing, so this cannot show a third party's photo. Imageless
                          // rows fall back to the id-hashed initials every other surface
                          // already uses.
                          image_id: studio.image_id,
                          address: studio.address,
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-gray-100 pt-5">
        <p className="text-m-descript text-gray-700">Nie ma tu Twojego studia?</p>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link href="/studio/dodaj">Dodaj studio</Link>
        </Button>
      </footer>
    </div>
  );
}
