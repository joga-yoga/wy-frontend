"use client";

import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";

export interface AddressValue {
  address: string;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AddressPrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

/**
 * Studio address with real autocomplete (WY-64 case 2).
 *
 * **Assists, never gates.** Free text stays a valid answer: a studio in a village Google
 * has never heard of must still be creatable, and the backend's geo columns are all
 * nullable for the same reason. Typing without picking simply leaves `place_id` null.
 *
 * It also degrades rather than blocks — `/places/address` returns 503 when
 * `GOOGLE_MAPS_API_KEY` is unset, and this then behaves as a plain text input instead of
 * trapping the user in a form they cannot submit.
 */
export function AddressAutocompleteField({
  value,
  onChange,
  placeholder = "np. ul. Marszałkowska 1, Warszawa",
  id,
}: {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  placeholder?: string;
  id?: string;
}) {
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // Suppresses the search that a selection's own `onChange` would otherwise trigger —
  // without it, picking a prediction immediately re-queries for the text just inserted.
  const [justPicked, setJustPicked] = useState(false);

  useEffect(() => {
    if (justPicked) {
      setJustPicked(false);
      return;
    }
    const q = value.address.trim();
    if (q.length < 3) {
      setPredictions([]);
      return;
    }
    const controller = new AbortController();
    setIsSearching(true);
    const handle = setTimeout(() => {
      axiosInstance
        .get<AddressPrediction[]>("/places/address", {
          params: { q },
          signal: controller.signal,
        })
        .then(({ data }) => {
          setPredictions(data);
          setIsOpen(data.length > 0);
        })
        .catch(() => {
          // 503 (no API key) and network errors both land here: no suggestions, plain
          // text input, form still submittable.
          if (!controller.signal.aborted) setPredictions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 400);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.address]);

  async function pick(prediction: AddressPrediction) {
    setJustPicked(true);
    setIsOpen(false);
    setPredictions([]);
    // Optimistic: show the chosen text immediately, then fill in the coordinates. If the
    // details call fails the address still stands — it just carries no geo, which is the
    // same state as free text.
    onChange({
      address: prediction.description,
      place_id: prediction.place_id,
      latitude: null,
      longitude: null,
    });
    try {
      const { data } = await axiosInstance.get<{
        place_id: string;
        formatted_address: string;
        latitude: number | null;
        longitude: number | null;
      }>("/places/details", { params: { place_id: prediction.place_id } });
      onChange({
        address: data.formatted_address || prediction.description,
        place_id: data.place_id,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    } catch {
      /* keep the optimistic value */
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={value.address}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) =>
          // Typing after a pick invalidates the pick: the text no longer describes the
          // place those coordinates point at.
          onChange({ address: e.target.value, place_id: null, latitude: null, longitude: null })
        }
        onFocus={() => predictions.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className="h-10 text-sm"
      />
      {isSearching && value.address.trim().length >= 3 && (
        <p className="mt-1 px-1 text-xs text-gray-400">Szukam adresu...</p>
      )}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-background shadow-md">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(prediction)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{prediction.main_text}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {prediction.secondary_text}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
