import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DirectoryBreadcrumb } from "@/components/directory/DirectoryBreadcrumb";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStyleHub, getStyleHubs } from "@/lib/api/getCityDirectory";
import { studios } from "@/lib/directoryCopy";
import { cityStudiosPath, cityStylePath, styleHubPath } from "@/lib/directoryPaths";
import {
  buildBreadcrumbJsonLd,
  buildCityDirectoryJsonLd,
  buildPageMetadata,
  truncateDescription,
} from "@/lib/seo";
import { getStyleCopy } from "@/lib/yogaStyleCopy";

/**
 * A style, nationally — `/studia/hatha`, reached through the `/studia/:path*` rewrite.
 *
 * The hub is the parent every `/{miasto}/studia/{styl}` page links up to, and the page that carries the
 * style's own text in full. It lists the cities where the style is taught: a city links to its
 * style page (`/krakow/studia/hatha`) when that exists, and to the city page otherwise — never to a page the backend gate
 * (`services/style_pages`) has not opened.
 *
 * ⚠ Static siblings `przejmij` and `usun-dane` win over this dynamic segment, and the backend's
 * `RESERVED_STUDIA_SEGMENTS` keeps any style slug from ever colliding with them. A new route under
 * `/studia/` must be added to that list.
 *
 * 404 below the gate and for a style with no copy in `yogaStyleCopy.ts` — as a status from
 * `src/proxy.ts`, as a body from `notFound()` here.
 */
interface StyleHubPageProps {
  params: Promise<{ style: string }>;
}

async function load(params: StyleHubPageProps["params"]) {
  const { style } = await params;
  const [payload, copy] = [await getStyleHub(style), getStyleCopy(style)];
  if (!payload || !copy) notFound();
  return { style, payload, copy };
}

export async function generateMetadata({ params }: StyleHubPageProps): Promise<Metadata> {
  const { style, payload, copy } = await load(params);
  return buildPageMetadata({
    project: "workshops",
    title: `${copy.heading} – ${studios(payload.count)} jogi w Polsce | joga.yoga`,
    description: truncateDescription(copy.lead),
    path: styleHubPath(style),
  });
}

export default async function StyleHubPage({ params }: StyleHubPageProps) {
  // ⚠ The real 404 status for an ungated style comes from `src/proxy.ts`, not from the
  // `notFound()` below — that one lands mid-stream under the public layout's Suspense boundary.
  await connection();

  const { style, payload, copy } = await load(params);
  const otherHubs = (await getStyleHubs()).filter(
    (hub) => hub.slug !== style && getStyleCopy(hub.slug),
  );

  return (
    <div className="flex flex-col gap-8 p-4 pb-10">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Studia jogi", path: "/studia" },
          { name: copy.heading, path: styleHubPath(style) },
        ])}
      />
      <JsonLd
        data={buildCityDirectoryJsonLd({
          path: styleHubPath(style),
          name: copy.heading,
          description: copy.lead,
        })}
      />

      <header className="flex flex-col gap-3">
        <div>
          <DirectoryBreadcrumb
            trail={[{ label: "Studia", href: "/studia" }, { label: copy.heading }]}
          />
          <h1 className="text-h-middle mt-1 text-gray-900">{copy.heading}</h1>
        </div>
        <p className="text-descrip-under-header text-gray-700">{copy.lead}</p>
      </header>

      <section className="flex max-w-3xl flex-col gap-4">
        {copy.body.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="text-m-descript text-gray-700">
            {paragraph}
          </p>
        ))}
      </section>

      <section>
        <h2 className="text-filter-subtitle mb-1 uppercase tracking-wide text-gray-500">Miasta</h2>
        <p className="text-m-sunscript-font mb-3 text-gray-500">
          {studios(payload.count)} w całej Polsce. Poniżej miasta, w których je znajdziesz.
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {payload.cities.map((city) => (
            <li key={city.slug}>
              <DetailPageLink
                href={city.has_page ? cityStylePath(city.slug, style) : cityStudiosPath(city.slug)}
                className="flex h-full flex-col rounded-xl border-[1.5px] border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50"
              >
                <span className="text-m-header text-gray-900">{city.name}</span>
                <span className="text-m-sunscript-font text-gray-500">{studios(city.count)}</span>
              </DetailPageLink>
            </li>
          ))}
        </ul>
      </section>

      {otherHubs.length > 0 && (
        <nav aria-labelledby="other-styles" className="border-t border-gray-100 pt-5">
          <h2
            id="other-styles"
            className="text-filter-subtitle mb-3 uppercase tracking-wide text-gray-500"
          >
            Inne style jogi
          </h2>
          <ul className="flex flex-wrap gap-2">
            {otherHubs.map((hub) => (
              <li key={hub.slug}>
                <Link
                  href={styleHubPath(hub.slug)}
                  className="text-filter-subtitle inline-block rounded-full border-2 border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:border-gray-400"
                >
                  {getStyleCopy(hub.slug)?.heading}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
