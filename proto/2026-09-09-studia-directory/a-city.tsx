"use client";

import { MoreHorizontal, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { krakowStudios, krakowStyles, krakowSummary } from "@/fixtures";
import { plural } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";
import type { StudioDirectoryItem } from "@/types/studio";

/**
 * Strona miasta — /krakow.
 *
 * Cztery rzeczy są tu sprawdzane, a nie zakładane:
 *
 * 1. Lista pokazuje wszystkie 63 czynne studia, ale linkiem jest tylko 11 opublikowanych.
 *    Granica między nimi jest nazwana — bez tego lista czyta się jako jedna lista, która psuje
 *    się w połowie, a nie jako dwa rodzaje rzeczy.
 * 2. Kafelki, nie płaskie wiersze z kreską. Ta sama geometria co `SessionCardBase`: osobna
 *    zaokrąglona karta z obramowaniem 1.5px. Płaski wiersz w jednym kontenerze to dokładnie
 *    ten wzorzec, od którego produkt odszedł (WY-73).
 * 3. Bez cen. Katalog jogi nie jest porównywarką cen — pole zniknęło z typu, nie tylko z widoku.
 * 4. Liczby, nigdy procenty — przy tych próbkach procent sugeruje precyzję, której nie ma.
 *
 * Głos platformy, nie właściciela: te wpisy nie mają jeszcze właściciela, więc nie ma komu
 * mówić "nasze" (AGENTS.md → Tone of Voice).
 */

function studios(n: number) {
  return `${n} ${plural(n, "studio", "studia", "studiów")}`;
}

/** Zielony jest akcentem marki, nie statusem: niesie fakty o mieście, nigdy stan wiersza. */
function FactChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-m-sunscript-font border-b2b-green-border bg-b2b-green-bg text-b2b-green-strong rounded-full border px-3 py-1">
      {children}
    </span>
  );
}

function Hero() {
  const s = krakowSummary;
  return (
    <header className="flex flex-col gap-3">
      <div>
        <p className="text-filter-subtitle text-gray-500">joga.yoga · {s.name}</p>
        <h1 className="text-h-middle mt-1 text-gray-900">
          Studia jogi {s.city_locative ?? s.name}
        </h1>
      </div>

      {/* Zdanie niesie tylko to, czego filtr stylów poniżej nie powie sam z siebie. Ranking
          stylów był tu wcześniej i powtarzał liczby z chipów — to była wata, nie treść. */}
      <p className="text-descrip-under-header text-gray-700">
        {(s.city_locative ?? s.name).charAt(0).toUpperCase() + (s.city_locative ?? s.name).slice(1)}{" "}
        znajdziesz {studios(s.active_count)} jogi.
      </p>

      <div className="flex flex-wrap gap-2">
        {s.pilates_count > 0 && <FactChip>{studios(s.pilates_count)} z pilatesem</FactChip>}
        {s.meditation_count > 0 && <FactChip>{studios(s.meditation_count)} z medytacją</FactChip>}
      </div>
    </header>
  );
}

function StyleFilter({
  active,
  onChange,
}: {
  active: string | null;
  onChange: (s: string | null) => void;
}) {
  const s = krakowSummary;
  return (
    <div>
      <h2 className="text-filter-subtitle mb-2 uppercase tracking-wide text-gray-500">Style</h2>
      <div className="flex flex-wrap gap-2">
        {krakowStyles.map((st: { name: string; count: number }) => {
          const on = active === st.name;
          return (
            <button
              key={st.name}
              type="button"
              onClick={() => onChange(on ? null : st.name)}
              aria-pressed={on}
              className={cn(
                "text-filter-subtitle rounded-full border-2 bg-white px-3 py-1.5 transition-colors",
                // Ten sam idiom aktywnego filtra co na liście wydarzeń: zielone obramowanie,
                // nie czarne wypełnienie.
                on
                  ? "border-brand-green-700 text-gray-900"
                  : "border-gray-200 text-gray-700 hover:border-gray-400",
              )}
            >
              {st.name} <span className={on ? "text-gray-500" : "text-gray-400"}>{st.count}</span>
            </button>
          );
        })}
      </div>
      {/* Bez tego zdania ranking udaje, że opisuje całe miasto. */}
      <p className="text-m-sunscript-font mt-2 text-gray-500">
        Dane o stylach mamy dla {s.styles_known_count} z {s.active_count} studiów.
      </p>
    </div>
  );
}

/**
 * Geometria kafelka jest wspólna, ale wypełnienie już nie — i to ono niesie afordancję.
 *
 * Biały, wypukły kafelek z chevronem = da się tam wejść. Szary, wklęsły, bez chevronu = to
 * wszystko, co o tym studiu wiemy; nie ma dokąd prowadzić. Sam chevron kontra ⋯ to za słaby
 * sygnał — dwa identyczne białe kafelki czyta się jako jeden rodzaj rzeczy, z których połowa
 * nie reaguje na dotyk.
 */
const CARD_BASE = "rounded-xl border-[1.5px] px-3 py-3";
const CARD_LINKED = "border-gray-200 bg-white hover:bg-gray-50";
const CARD_INERT = "border-gray-200/70 bg-gray-50";

function StyleChips({ styles }: { styles: string[] }) {
  if (styles.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {styles.slice(0, 2).map((s) => (
        <span
          key={s}
          className="text-filter-subtitle rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
        >
          {s}
        </span>
      ))}
      {/* Liczba, nigdy ucięty tekst — tak samo jak na karcie instruktorki/instruktora. */}
      {styles.length > 2 && (
        <span className="text-filter-subtitle px-1 py-0.5 text-gray-500">+{styles.length - 2}</span>
      )}
    </div>
  );
}

/**
 * Studio z własną stroną. Cała karta jest linkiem — tak samo jak karta w katalogu
 * instruktorek i instruktorów — więc nie ma tu przycisku ⋯: zagnieżdżony przycisk w kotwicy
 * jest niepoprawny, a przejęcie profilu i tak ma na swojej stronie więcej miejsca.
 */
function LinkedCard({ studio }: { studio: StudioDirectoryItem }) {
  return (
    <li>
      <DetailPageLink
        href={`/studio/${studio.slug}`}
        className={cn(CARD_BASE, CARD_LINKED, "flex items-center gap-3")}
      >
        <div className="min-w-0 flex-1">
          <p className="text-m-header line-clamp-2 text-gray-900">{studio.name}</p>
          <p className="text-m-sunscript-font mt-0.5 truncate text-gray-500">{studio.address}</p>
          <StyleChips styles={studio.styles} />
        </div>
        <IoChevronForward className="size-5 shrink-0 text-gray-500" aria-hidden />
      </DetailPageLink>
    </li>
  );
}

/**
 * Studio bez strony. Nazwa nie jest linkiem, bo nie ma dokąd prowadzić — zamiast tego karta
 * niesie telefon, czyli to, po co ktoś tu przyszedł. Ma czytać się jako inny rodzaj rzeczy,
 * a nie jako link, który nie zadziałał. ⋯ jest tu jedynym wejściem w przejęcie profilu.
 */
function ContactCard({ studio, onManage }: { studio: StudioDirectoryItem; onManage: () => void }) {
  return (
    <li className={cn(CARD_BASE, CARD_INERT)}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-m-header line-clamp-2 text-gray-900">{studio.name}</p>
          <p className="text-m-sunscript-font mt-0.5 text-gray-500">{studio.address}</p>
        </div>
        <button
          type="button"
          onClick={onManage}
          aria-label={`Zarządzaj studiem ${studio.name}`}
          className="-mr-1 shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </button>
      </div>
      {/* Na wklęsłym kafelku wszystko, co da się dotknąć, wygląda jak przycisk — inaczej
          czytelniczka nie wie, gdzie kończy się treść, a zaczyna akcja. */}
      {studio.phone && (
        <a
          href={`tel:${studio.phone.replace(/\s/g, "")}`}
          className="text-m-header mt-2.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 hover:border-gray-400"
        >
          <Phone className="size-4" aria-hidden />
          {studio.phone}
        </a>
      )}
    </li>
  );
}

export function ManageDrawer({
  studio,
  onOpenChange,
}: {
  studio: StudioDirectoryItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={studio !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>To Twoje studio?</DrawerTitle>
          <DrawerDescription>{studio?.name}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2 px-4 pb-2">
          {/* Przejęcie profilu to wynik, na którym nam zależy — stąd zielone wypełnienie marki.
              Usunięcie danych nigdy nie chowa się za nim. */}
          <DrawerClose className="bg-brand-green-700 rounded-lg p-4 text-left hover:opacity-90">
            <span className="text-m-header block text-white">To moje studio</span>
            <span className="text-m-sunscript-font mt-0.5 block text-white/80">
              Przejmij profil i zarządzaj nim samodzielnie.
            </span>
          </DrawerClose>
          <DrawerClose className="rounded-lg border border-gray-200 p-4 text-left hover:border-gray-400">
            <span className="text-m-header block text-gray-900">Poproś o usunięcie danych</span>
            <span className="text-m-sunscript-font mt-0.5 block text-gray-500">
              Wyślemy Twoją prośbę do zespołu joga.yoga.
            </span>
          </DrawerClose>
        </div>
        <div className="px-4 pb-6 pt-2">
          <DrawerClose className="text-m-header w-full rounded-md py-3 text-gray-600 hover:bg-gray-100">
            Anuluj
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function CityDirectory() {
  const [style, setStyle] = useState<string | null>(null);
  const [managing, setManaging] = useState<StudioDirectoryItem | null>(null);

  const rows = style ? krakowStudios.filter((s) => s.styles.includes(style)) : krakowStudios;
  const published = rows.filter((s) => s.slug);
  const contactOnly = rows.filter((s) => !s.slug);

  return (
    <div className="flex flex-col gap-6 p-4 pb-10">
      <Hero />
      <StyleFilter active={style} onChange={setStyle} />

      <section>
        <h2 className="text-filter-subtitle mb-2 uppercase tracking-wide text-gray-500">
          {style ? `${studios(rows.length)} · ${style}` : studios(rows.length)}
        </h2>

        <ul className="flex flex-col gap-2">
          {published.map((s) => (
            <LinkedCard key={s.external_id} studio={s} />
          ))}
        </ul>

        {/* Granica między dwoma rodzajami karty musi być nazwana — i to tutaj, nie w nagłówku
            strony, mieszka podpowiedź o przejęciu profilu: dokładnie przy tych studiach,
            których dotyczy. */}
        {contactOnly.length > 0 && (
          <>
            <div className="pt-6">
              <h3 className="text-filter-subtitle uppercase tracking-wide text-gray-500">
                Pozostałe studia · {contactOnly.length}
              </h3>
              <p className="text-m-sunscript-font mt-1 text-gray-500">
                Mamy tu tylko adres i telefon — te studia nie mają jeszcze swojej strony. Prowadzisz
                jedno z nich? Wybierz ⋯ obok nazwy.
              </p>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {contactOnly.map((s) => (
                <ContactCard key={s.external_id} studio={s} onManage={() => setManaging(s)} />
              ))}
            </ul>
          </>
        )}

        {rows.length === 0 && (
          <p className="text-m-descript py-6 text-center text-gray-500">
            Żadne studio w Krakowie nie ma tu jeszcze tego stylu.
          </p>
        )}
      </section>

      <footer className="border-t border-gray-100 pt-5">
        <p className="text-m-descript text-gray-700">Nie ma tu Twojego studia?</p>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link href="/studio/dodaj">Dodaj studio</Link>
        </Button>
      </footer>

      <ManageDrawer studio={managing} onOpenChange={(o) => !o && setManaging(null)} />
    </div>
  );
}
