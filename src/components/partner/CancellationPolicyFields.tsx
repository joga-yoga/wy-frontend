"use client";

import { InfoNote } from "@/components/b2b/InfoNote";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { Input } from "@/components/ui/input";

interface Props {
  cancellationMode: "by_time_of_day" | "always_free";
  setCancellationMode: (mode: "by_time_of_day" | "always_free") => void;
  morningDeadline: string;
  setMorningDeadline: (value: string) => void;
  afternoonHoursBefore: string;
  setAfternoonHoursBefore: (value: string) => void;
}

export function CancellationPolicyFields({
  cancellationMode,
  setCancellationMode,
  morningDeadline,
  setMorningDeadline,
  afternoonHoursBefore,
  setAfternoonHoursBefore,
}: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Bezpłatne odwołanie
      </h2>
      <div className="space-y-4">
        <SegmentedToggle
          value={cancellationMode}
          onChange={setCancellationMode}
          options={[
            { label: "Wg pory zajęć", value: "by_time_of_day" },
            { label: "Zawsze bezpłatnie", value: "always_free" },
          ]}
        />

        {cancellationMode === "by_time_of_day" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Zajęcia poranne (start przed 12:00)
              </label>
              <p className="mb-2 text-xs text-muted-foreground">
                Bezpłatne odwołanie możliwe do tej godziny dnia poprzedniego.
              </p>
              <Input
                type="time"
                value={morningDeadline}
                onChange={(e) => setMorningDeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Zajęcia popołudniowe (start od 12:00)
              </label>
              <p className="mb-2 text-xs text-muted-foreground">
                Bezpłatne odwołanie możliwe do tylu godzin przed startem zajęć.
              </p>
              <Input
                type="number"
                min="0"
                value={afternoonHoursBefore}
                onChange={(e) => setAfternoonHoursBefore(e.target.value)}
                placeholder="np. 3"
              />
            </div>
          </>
        )}

        <InfoNote>
          Ta konfiguracja wyznacza termin bezpłatnego odwołania i zasadę wejść z karnetu przy
          nieobecności. Przy &bdquo;Zawsze bezpłatne&rdquo; wejście nigdy nie przepada.
        </InfoNote>
      </div>
    </section>
  );
}
