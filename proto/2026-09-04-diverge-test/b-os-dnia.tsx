import { occurrences } from "@/fixtures";
import { type ClassColor, COLOR_SWATCH_MAP } from "@/lib/classColors";

/**
 * WARIANT ROZBIEŻNY (`reframe`) — „Oś dnia".
 *
 * Zero importów komponentów produktowych: żadnego `SessionCardBase`, `StatusChip` ani
 * `HashedAvatar`. Rozbieżny wariant, który używa istniejącego wiersza, nie jest rozbieżny —
 * to system z innym paddingiem (design-diverge §2).
 *
 * Co jest UTRZYMANE (poziom `reframe`): rodzina kolorów i dyscyplina nasycenia — hue bierzemy
 * z `COLOR_SWATCH_MAP`, nigdy z hexa wpisanego w komponent; typografia — wyłącznie nazwane role
 * ze skali (`text-m-header`, `text-m-sunscript-font`, `text-filter-subtitle`), bez surowych
 * rozmiarów; projekt na 396 px; polska kopia.
 *
 * Co jest ZERWANE (konwencje komponentu są wolne):
 *   1. Godzina przestaje być kolumną powtarzaną w każdym wierszu i staje się WSPÓLNĄ szyną dnia.
 *   2. Karta traci ramkę: dzień to jedna lista, a nie zbiór obiektów w pudełkach.
 *   3. Znika chevron — celem dotyku jest cały blok.
 *   4. Przerwa w dniu jest rysowana jawnie, zamiast być niewidoczna między kartami.
 *   5. Stan schodzi z rzędu chipów do jednej linii pomocniczej + koloru grzbietu.
 *
 * Rachunek szerokości przy 396 px: kolumna godziny (56) + pasek (4) + odstępy (24) +
 * chevron (20) = 104 px chromu w KAŻDYM wierszu. Szyna zjada to raz na dzień, nie raz na sesję,
 * więc tytuł zajęć dostaje ok. 60 px więcej — to jest teza, którą ta para ma rozstrzygnąć.
 */

/** To samo ustalone „teraz" co w kontroli: środa 2026-09-09, 18:10 czasu warszawskiego. */
const NOW = new Date("2026-09-09T18:10:00+02:00");

type Occ = (typeof occurrences)[keyof typeof occurrences];

/** Godziny są zapisane jako warszawski czas ścienny — porównujemy cyfry, nie instanty
 *  (`src/lib/warsawWallClock.ts` robi to samo i tłumaczy dlaczego). */
function wall(iso: string): string {
  return iso.replace(/Z$|[+-]\d{2}:\d{2}$/, "");
}
function hhmm(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}
function minutesOf(iso: string): number {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}
function nowWall(now: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(now)
    .replace(" ", "T");
}

type State = "cancelled" | "live" | "past" | "upcoming";

/** Te same reguły co w `GrafikSessionCard` (okno „trwa" = 30 min przed startem), przepisane
 *  lokalnie, bo wariant rozbieżny nie importuje kodu produktu. */
function stateOf(occ: Occ, now: Date): State {
  const n = nowWall(now);
  if (occ.status === "cancelled") return "cancelled";
  const lead = new Date(now.getTime() + 30 * 60_000);
  if (
    n.slice(0, 10) === occ.calendar_date &&
    nowWall(lead) >= wall(occ.start_time) &&
    n <= wall(occ.end_time)
  )
    return "live";
  if (n > wall(occ.start_time)) return "past";
  return "upcoming";
}

function durationLabel(occ: Occ): string {
  return `${minutesOf(occ.end_time) - minutesOf(occ.start_time)} min`;
}

/** Przerwa między sesjami, rysowana jawnie. Poniżej 60 min podajemy minuty. */
function gapLabel(prev: Occ, next: Occ): string | null {
  const gap = minutesOf(next.start_time) - minutesOf(prev.end_time);
  if (gap < 45) return null;
  if (gap < 60) return `${gap} min przerwy`;
  return `${Math.round(gap / 60)} godz. przerwy`;
}

function fillTone(occ: Occ, state: State): string {
  if (state === "past" || state === "cancelled") return "bg-gray-100 text-gray-500";
  // Jak w systemie: żywa sesja raportuje obecnych, więc ton liczy się od stanu, nie od
  // zapisów — inaczej „0/16” dostaje bursztyn od 14 rezerwacji i wygląda na błąd.
  if (state === "live") return "bg-b2b-green-bg text-b2b-green-text";
  if (occ.capacity && occ.fill_count >= occ.capacity) return "bg-b2b-red-bg text-b2b-red-text";
  if (occ.capacity && occ.fill_count >= occ.capacity * 0.8)
    return "bg-b2b-amber-bg text-b2b-amber-text";
  return "bg-b2b-green-bg text-b2b-green-text";
}

function Session({ occ, state }: { occ: Occ; state: State }) {
  const muted = state === "past" || state === "cancelled";
  const spine =
    state === "live"
      ? "bg-brand-green-700"
      : muted
        ? "bg-gray-200"
        : COLOR_SWATCH_MAP[(occ.color ?? "green") as ClassColor];

  return (
    <div className="flex gap-3 py-3 pr-1 transition-colors hover:bg-gray-50">
      {/* Szyna: godzina raz, na krawędzi dnia — nie w każdym wierszu. */}
      <div className="w-11 shrink-0 pt-px text-right">
        <span
          className={`text-m-header tabular-nums ${muted ? "text-gray-400" : "text-gray-900"} ${
            state === "cancelled" ? "line-through" : ""
          }`}
        >
          {hhmm(occ.start_time)}
        </span>
      </div>

      <span className={`w-[3px] shrink-0 self-stretch rounded-full ${spine}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p
            className={`min-w-0 flex-1 truncate text-m-header ${
              muted ? "text-gray-400" : "text-gray-900"
            } ${state === "cancelled" ? "line-through" : ""}`}
          >
            {occ.template_title}
          </p>
          {occ.capacity ? (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-filter-subtitle tabular-nums ${fillTone(occ, state)}`}
            >
              {state === "live" ? occ.attended_count : occ.fill_count}/{occ.capacity}
            </span>
          ) : null}
        </div>

        {/* Druga i jedyna linia pomocnicza: rola typograficzna nr 2, zgodnie z zasadą
         *  „dwie role w wierszu". Stan dopisuje się tutaj, zamiast otwierać trzeci poziom. */}
        <p className="mt-0.5 truncate text-m-sunscript-font text-gray-500">
          {/* Stan idzie NA POCZĄTEK linii: to on ginie przy obcięciu, a nie sala. */}
          {[
            state === "past" ? "Zakończone" : null,
            state === "cancelled" ? "Odwołane" : null,
            occ.is_modified && state !== "cancelled" ? "Wyjątek" : null,
            durationLabel(occ),
            occ.instructor_name,
            occ.room_name,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {state === "live" && (
          <p className="mt-1 text-filter-subtitle text-b2b-green-text">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-green-700 align-middle" />
            Trwa do {hhmm(occ.end_time)}
            {occ.unresolved_count > 0 ? ` · ${occ.unresolved_count} czeka` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

const days: { label: string; items: Occ[] }[] = [
  { label: "Środa, 9 września", items: [occurrences.wedMorning, occurrences.wedEvening] },
  { label: "Sobota, 12 września", items: [occurrences.satMidday] },
];

export default function OsDnia() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <p className="text-h-small text-gray-900">Grafik</p>

      {days.map((day) => (
        <div key={day.label}>
          <p className="mb-1 text-filter-subtitle text-gray-500">{day.label}</p>

          {/* Jedna hairline na dzień — granica, której odstęp nie wyraża. Nie linijka między
           *  każdą pozycją: to byłyby dwa konkurujące systemy krawędzi. */}
          <div className="border-t border-gray-200">
            {day.items.map((occ, i) => {
              const prev = i > 0 ? day.items[i - 1] : null;
              const gap = prev ? gapLabel(prev, occ) : null;
              return (
                <div key={occ.id}>
                  {gap && (
                    <div className="flex items-center gap-3 py-1">
                      <span className="w-11 shrink-0" />
                      <span className="w-[3px] shrink-0" />
                      <span className="text-filter-subtitle font-normal text-gray-300">{gap}</span>
                    </div>
                  )}
                  <Session occ={occ} state={stateOf(occ, NOW)} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
