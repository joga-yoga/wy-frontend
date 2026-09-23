"use client";

import Link from "next/link";
import { useState } from "react";

import { ManageStudioDrawer } from "@/components/directory/ManageStudioDrawer";
import { Button } from "@/components/ui/button";
import { studios } from "@/lib/directoryCopy";
import { cn } from "@/lib/utils";
import type { CityDirectoryPayload, StudioDirectoryItem } from "@/types/studio";

import { RaisedStudioCard, RecessedStudioCard } from "./StudioCards";

/**
 * The list, the style filter, and the named boundary between the two kinds of card.
 *
 * **The boundary has to be named.** Unnamed, the list reads as one list that degrades
 * halfway down rather than as two kinds of thing — and on Kraków that means 52 of 63 rows
 * reading as links that failed. The heading and the line under it were the finding the
 * prototype was built to test, and it failed without them.
 *
 * The explanatory line sits **with the recessed group, not in the page header**. An
 * unlabelled control repeated fifty times is noticed by nobody, and a claim hint at the top
 * of the page is addressed to the wrong reader — somebody who came looking for a class.
 */
export function CityStudioList({ payload }: { payload: CityDirectoryPayload }) {
  const [style, setStyle] = useState<string | null>(null);
  const [managing, setManaging] = useState<StudioDirectoryItem | null>(null);

  // Filtering by style necessarily empties the recessed group, because an unpublished
  // listing carries no styles — and that is the right behaviour rather than an accident.
  // The reader has asked a question those rows cannot answer; listing fifty "we don't know"
  // rows underneath a specific style would be noise dressed as completeness.
  const rows = style ? payload.studios.filter((s) => s.styles.includes(style)) : payload.studios;
  const raised = rows.filter((s) => s.slug);
  const recessed = rows.filter((s) => !s.slug);

  return (
    <>
      <StyleFilter
        facets={payload.styles}
        active={style}
        onChange={setStyle}
        knownCount={payload.summary.styles_known_count}
        activeCount={payload.summary.active_count}
      />

      <section>
        <h2 className="text-filter-subtitle mb-2 uppercase tracking-wide text-gray-500">
          {style ? `${studios(rows.length)} · ${style}` : studios(rows.length)}
        </h2>

        {raised.length > 0 && (
          <ul className="flex flex-col gap-2">
            {raised.map((studio) => (
              <RaisedStudioCard key={studio.external_id} studio={studio} />
            ))}
          </ul>
        )}

        {recessed.length > 0 && (
          <>
            <div className="pt-6">
              <h3 className="text-filter-subtitle uppercase tracking-wide text-gray-500">
                Pozostałe studia · {recessed.length}
              </h3>
              <p className="text-m-sunscript-font mt-1 text-gray-500">
                Mamy tu tylko adres i telefon — te studia nie mają jeszcze swojej strony. Prowadzisz
                jedno z nich? Wybierz ⋯ obok nazwy.
              </p>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {recessed.map((studio) => (
                <RecessedStudioCard
                  key={studio.external_id}
                  studio={studio}
                  onManage={() => setManaging(studio)}
                />
              ))}
            </ul>
          </>
        )}

        {rows.length === 0 && (
          <p className="text-m-descript py-6 text-center text-gray-500">
            Żadne studio {payload.summary.city_locative ?? `w mieście ${payload.summary.name}`} nie
            ma tu jeszcze tego stylu.
          </p>
        )}
      </section>

      <footer className="border-t border-gray-100 pt-5">
        <p className="text-m-descript text-gray-700">Nie ma tu Twojego studia?</p>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link href="/studio/dodaj">Dodaj studio</Link>
        </Button>
      </footer>

      <ManageStudioDrawer studio={managing} onOpenChange={(open) => !open && setManaging(null)} />
    </>
  );
}

/**
 * Styles lead the page and are the filter.
 *
 * They are **not links**, and stay a filter. The styles that do have a page of their own —
 * `/{miasto}/{styl}`, opened only above the backend gate in `services/style_pages.py` (2026-09:
 * ten studios, 36 pages, where the original spec had ruled out all ~600) — are linked from a
 * separate row the server page renders (`StylePageLinks` in `page.tsx`). A chip that filters
 * here and a chip that leaves the page must never look the same.
 *
 * Names render exactly as the catalog stores them — never translated, never re-cased —
 * matching the instructor directory.
 */
function StyleFilter({
  facets,
  active,
  onChange,
  knownCount,
  activeCount,
}: {
  facets: { name: string; count: number }[];
  active: string | null;
  onChange: (style: string | null) => void;
  knownCount: number;
  activeCount: number;
}) {
  if (facets.length === 0) return null;

  return (
    <div>
      <h2 className="text-filter-subtitle mb-2 uppercase tracking-wide text-gray-500">Style</h2>
      <div className="flex flex-wrap gap-2">
        {facets.map((facet) => {
          const on = active === facet.name;
          return (
            <button
              key={facet.name}
              type="button"
              onClick={() => onChange(on ? null : facet.name)}
              aria-pressed={on}
              className={cn(
                "text-filter-subtitle rounded-full border-2 bg-white px-3 py-1.5 transition-colors",
                // The same active-filter idiom as the events list: a green border, not a
                // black fill.
                on
                  ? "border-brand-green-700 text-gray-900"
                  : "border-gray-200 text-gray-700 hover:border-gray-400",
              )}
            >
              {facet.name}{" "}
              <span className={on ? "text-gray-500" : "text-gray-400"}>{facet.count}</span>
            </button>
          );
        })}
      </div>
      {/* Without this line the ranking pretends to describe the whole city. In Kraków it
          describes 11 studios out of 63. */}
      <p className="text-m-sunscript-font mt-2 text-gray-500">
        Dane o stylach mamy dla {knownCount} z {activeCount} studiów.
      </p>
    </div>
  );
}
