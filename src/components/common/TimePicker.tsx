"use client";

import { Clock3 } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isValidTime } from "@/lib/timeInput";

type TimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  "aria-label"?: string;
};

/** Minute-level wall-clock value. Dates and timezone conversion belong to callers. */
export function TimePicker({ id, value, onChange, disabled, error, ...props }: TimePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const valid = isValidTime(value);
  const showError = error || (!valid && (touched || value.length >= 5));
  const [rawHour, rawMinute] = value.split(":");
  const hour = /^(?:[01]\d|2[0-3])$/.test(rawHour) ? rawHour : "";
  const minute = /^[0-5]\d$/.test(rawMinute ?? "") ? rawMinute : "";

  return (
    <div>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Input
              {...props}
              id={inputId}
              type="text"
              inputMode="numeric"
              placeholder="HH:mm"
              autoComplete="off"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onBlur={() => setTouched(true)}
              disabled={disabled}
              aria-invalid={showError || undefined}
              aria-describedby={showError ? `${inputId}-error` : undefined}
              className="pr-11 tabular-nums"
            />
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                aria-label="Wybierz godzinę"
                className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <Clock3 className="size-4" aria-hidden="true" />
              </button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent
          ref={contentRef}
          align="start"
          collisionPadding={12}
          aria-label="Wybierz godzinę i minutę"
          className="w-56 max-w-[calc(100vw-24px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-3"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const selected = contentRef.current?.querySelector<HTMLButtonElement>(
              '[data-time-part="hours"] [data-state="on"]',
            );
            const first = contentRef.current?.querySelector<HTMLButtonElement>(
              '[data-time-part="hours"] button',
            );
            (selected ?? first)?.focus({ preventScroll: true });
            contentRef.current?.querySelectorAll('[data-state="on"]').forEach((item) => {
              item.scrollIntoView({ block: "nearest" });
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { part: "hours", label: "Godziny", count: 24, selected: hour },
                { part: "minutes", label: "Minuty", count: 60, selected: minute },
              ] as const
            ).map(({ part, label, count, selected }) => (
              <div key={part} className="min-w-0">
                <p className="mb-2 text-center text-sm font-medium">{label}</p>
                <div className="max-h-56 overflow-y-auto overscroll-contain rounded-md border p-1">
                  <ToggleGroup
                    type="single"
                    orientation="vertical"
                    aria-label={label}
                    data-time-part={part}
                    value={selected}
                    spacing={1}
                    className="w-full flex-col"
                    onValueChange={(next) => {
                      if (!next) return;
                      onChange(
                        part === "hours" ? `${next}:${minute || "00"}` : `${hour || "00"}:${next}`,
                      );
                    }}
                  >
                    {Array.from({ length: count }, (_, index) => {
                      const option = String(index).padStart(2, "0");
                      return (
                        <ToggleGroupItem
                          key={option}
                          value={option}
                          aria-label={`${label}: ${option}`}
                          className="h-10 w-full rounded-md tabular-nums data-[state=on]:bg-brand-green-700/10 data-[state=on]:text-brand-green-700 data-[state=on]:ring-1 data-[state=on]:ring-inset data-[state=on]:ring-brand-green-700"
                        >
                          {option}
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 min-h-10 w-full rounded-md text-sm font-semibold text-brand-green-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Gotowe
          </button>
        </PopoverContent>
      </Popover>
      {showError && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-destructive">
          Wpisz godzinę w formacie HH:mm.
        </p>
      )}
    </div>
  );
}
