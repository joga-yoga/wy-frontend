import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { DirectoryBreadcrumb } from "@/components/directory/DirectoryBreadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCityStyle } from "@/lib/api/getCityDirectory";
import { studios, styleInCity } from "@/lib/directoryCopy";
import { cityStudiosPath, cityStylePath, styleHubPath } from "@/lib/directoryPaths";
import {
  buildBreadcrumbJsonLd,
  buildCityDirectoryJsonLd,
  buildPageMetadata,
  truncateDescription,
} from "@/lib/seo";
import { getStyleCopy } from "@/lib/yogaStyleCopy";

import { RaisedStudioCard } from "../StudioCards";

/**
 * One style in one city — `/krakow/studia/hatha`.
 *
 * ⚠ **Exists only above a gate**, and the gate is the backend's
 * (`services/style_pages.MIN_STUDIOS_PER_CITY_STYLE`): the same one that decides the sitemap
 * entry and whether the city page links here. Below it this is a hard 404, never a short list —
 * the directory's spec ruled out ~600 style×city pages as the thin-page risk in its purest form,
 * and these ~40 exist because every one of them is a real list with its own text.
 *
 * The 404 *status* comes from `src/proxy.ts`, which reads the same gated list; `notFound()` here
 * only supplies the body. A page also 404s when its style has no copy in `yogaStyleCopy.ts`. Without the text it is the
 * city page filtered, which is precisely the page that should not exist.
 *
 * Platform voice throughout: a style page belongs to no studio.
 */
interface CityStylePageProps {
  params: Promise<{ miasto: string; style: string }>;
}

async function load(params: CityStylePageProps["params"]) {
  const { miasto, style } = await params;
  const [payload, copy] = [await getCityStyle(miasto, style), getStyleCopy(style)];
  if (!payload || !copy) notFound();
  return { miasto, style, payload, copy };
}

export async function generateMetadata({ params }: CityStylePageProps): Promise<Metadata> {
  const { miasto, style, payload, copy } = await load(params);
  const title = `${styleInCity(copy.heading, payload.city)} – ${studios(payload.studios.length)} | joga.yoga`;
  return buildPageMetadata({
    project: "workshops",
    title,
    description: truncateDescription(
      `${styleInCity(copy.heading, payload.city)}: ${studios(payload.studios.length)} z adresami i kontaktem. ${copy.lead}`,
    ),
    path: cityStylePath(miasto, style),
  });
}

export default async function CityStylePage({ params }: CityStylePageProps) {
  // Same as the city page. ⚠ This does **not** make an ungated URL a real 404 — the public
  // layout's Suspense boundary means `notFound()` below lands mid-stream, under `200 OK`. The
  // status is answered earlier, by `src/proxy.ts`, from the same gated list. `notFound()` here
  // is the fallback for a list the proxy could not fetch.
  await connection();

  const { miasto, style, payload, copy } = await load(params);
  const { city } = payload;
  const heading = styleInCity(copy.heading, city);

  return (
    <div className="flex flex-col gap-6 p-4 pb-10">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Studia jogi", path: "/studia" },
          { name: city.name, path: cityStudiosPath(miasto) },
          { name: copy.heading, path: cityStylePath(miasto, style) },
        ])}
      />
      <JsonLd
        data={buildCityDirectoryJsonLd({
          path: cityStylePath(miasto, style),
          name: heading,
          description: copy.lead,
        })}
      />

      <header className="flex flex-col gap-3">
        <div>
          <DirectoryBreadcrumb
            trail={[
              { label: "Studia", href: "/studia" },
              { label: city.name, href: cityStudiosPath(miasto) },
              { label: copy.heading },
            ]}
          />
          <h1 className="text-h-middle mt-1 text-gray-900">{heading}</h1>
        </div>
        {/* The lead, not the hub's body: the full text lives once, on `/studia/{styl}`. Pasting
            a paragraph into every city's page would put the same block on thirteen Hatha pages
            — duplicate text is the one thing these pages exist to avoid being. */}
        <p className="text-descrip-under-header text-gray-700">{copy.lead}</p>
        {payload.has_hub && (
          <Link
            href={styleHubPath(style)}
            className="text-m-header self-start text-gray-900 underline underline-offset-4 hover:text-gray-600"
          >
            Więcej o stylu: {copy.heading}
          </Link>
        )}
      </header>

      <section>
        <h2 className="text-filter-subtitle mb-2 uppercase tracking-wide text-gray-500">
          {studios(payload.studios.length)}
        </h2>
        <ul className="flex flex-col gap-2">
          {payload.studios.map((studio) => (
            <RaisedStudioCard key={studio.external_id} studio={studio} />
          ))}
        </ul>
      </section>

      <nav aria-labelledby="city-style-more" className="border-t border-gray-100 pt-5">
        <h2
          id="city-style-more"
          className="text-filter-subtitle mb-3 uppercase tracking-wide text-gray-500"
        >
          Zobacz też
        </h2>
        <ul className="flex flex-col gap-2">
          {payload.other_styles.map((other) => {
            const otherCopy = getStyleCopy(other.slug);
            if (!otherCopy) return null;
            return (
              <li key={other.slug}>
                <Link
                  href={cityStylePath(miasto, other.slug)}
                  className="text-m-descript text-gray-900 underline underline-offset-4 hover:text-gray-600"
                >
                  {styleInCity(otherCopy.heading, city)}
                </Link>{" "}
                <span className="text-m-sunscript-font text-gray-500">{studios(other.count)}</span>
              </li>
            );
          })}
          <li>
            <Link
              href={cityStudiosPath(miasto)}
              className="text-m-descript text-gray-900 underline underline-offset-4 hover:text-gray-600"
            >
              {styleInCity("Wszystkie studia jogi", city)}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
