"use client";

import { GrafikSessionCard } from "@/app/account/partner/schedule/components/GrafikSessionCard";
import { occurrences } from "@/fixtures";

/**
 * `"use client"` jest tu konieczne: `GrafikSessionCard` wymaga `onClick`, a funkcji nie da się
 * przekazać z komponentu serwerowego do klienckiego. Bez tego wariant pada na
 * „Event handlers cannot be passed to Client Component props" — warto o tym wiedzieć,
 * budując kontrolę z prawdziwego komponentu produktu.
 *
 * KONTROLA — obecny idiom systemu, narysowany prawdziwym komponentem produktu
 * (`GrafikSessionCard` na `SessionCardBase`), a nie jego imitacją.
 *
 * Bez pary „lepsze" i „inne" są nie do odróżnienia: nowość zawsze wygrywa w izolacji, i tak
 * właśnie racjonalizuje się niespójność (design-diverge §2).
 *
 * Tryb folderu to `reframe`, więc powłoka nie zawija wariantu w `FixtureProviders`. Ta karta
 * ich nie potrzebuje — nie czyta żadnego kontekstu i nie wywołuje API.
 */

/** Ustalone „teraz": środa 2026-09-09, 18:10 czasu warszawskiego — TODAY z fixtures.
 *  Podane jawnie, żeby stany (minione / trwa) nie zależały od zegara maszyny. */
const NOW = new Date("2026-09-09T18:10:00+02:00");

const days = [
  { label: "Środa, 9 września", items: [occurrences.wedMorning, occurrences.wedEvening] },
  { label: "Sobota, 12 września", items: [occurrences.satMidday] },
];

export default function Control() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <p className="text-h-small text-gray-900">Grafik</p>

      {days.map((day) => (
        <div key={day.label}>
          <p className="mb-2 text-filter-subtitle text-gray-500">{day.label}</p>
          {/* Karty rozdzielone, jak na publicznym grafiku studia — `space-y-2`, tak jak w
           *  `schedule/page.tsx`. */}
          <div className="space-y-2">
            {day.items.map((occ) => (
              <GrafikSessionCard
                key={occ.id}
                occ={occ}
                now={NOW}
                context="owner"
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
