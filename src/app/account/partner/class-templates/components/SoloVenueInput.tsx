"use client";

import { useEffect, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/lib/axiosInstance";

import type { ClassLocation } from "../types";

export interface SoloVenue {
  location: ClassLocation;
  studioId: string | null;
  directoryId: string | null;
  showName: boolean;
}

interface VenueSuggestion {
  studio_id: string | null;
  directory_id: string | null;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}
interface AddressSuggestion {
  place_id: string;
  description: string;
}
type Suggestion =
  | { kind: "venue"; value: VenueSuggestion }
  | { kind: "address"; value: AddressSuggestion };

/** A local adapter over the existing public studio and address autocomplete sources. */
export function SoloVenueInput({
  value,
  onChange,
  locked = false,
}: {
  value: SoloVenue;
  onChange: (value: SoloVenue) => void;
  locked?: boolean;
}) {
  const listId = useId();
  const [query, setQuery] = useState(value.location.address_line1 ?? "");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!searching || query.trim().length < 2 || locked) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      const results = await Promise.allSettled([
        axiosInstance.get<VenueSuggestion[]>("/public/class-venues/search", {
          params: { q: query },
          signal: controller.signal,
        }),
        query.trim().length >= 3
          ? axiosInstance.get<AddressSuggestion[]>("/places/address", {
              params: { q: query },
              signal: controller.signal,
            })
          : Promise.resolve({ data: [] }),
      ]);
      if (controller.signal.aborted) return;
      const venues = results[0].status === "fulfilled" ? results[0].value.data : [];
      const addresses = results[1].status === "fulfilled" ? results[1].value.data : [];
      setSuggestions([
        ...venues.map((v): Suggestion => ({ kind: "venue", value: v })),
        ...addresses.map((v): Suggestion => ({ kind: "address", value: v })),
      ]);
      setActiveIndex(-1);
    }, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, searching, locked]);

  async function select(suggestion: Suggestion) {
    setSearching(false);
    setSuggestions([]);
    if (suggestion.kind === "venue") {
      const v = suggestion.value;
      setQuery(v.address);
      onChange({
        location: {
          title: v.name,
          address_line1: v.address,
          latitude: v.latitude,
          longitude: v.longitude,
        },
        studioId: v.studio_id,
        directoryId: v.directory_id,
        showName: false,
      });
      return;
    }
    const v = suggestion.value;
    setQuery(v.description);
    setResolving(true);
    let location: ClassLocation = { address_line1: v.description, google_place_id: v.place_id };
    try {
      const { data } = await axiosInstance.get<{
        formatted_address: string;
        latitude: number | null;
        longitude: number | null;
      }>("/places/details", { params: { place_id: v.place_id } });
      location = {
        ...location,
        address_line1: data.formatted_address || v.description,
        latitude: data.latitude,
        longitude: data.longitude,
      };
    } catch {
      /* A manually usable physical address remains valid when geocoding is unavailable. */
    }
    onChange({ location, studioId: null, directoryId: null, showName: false });
    setQuery(location.address_line1 ?? v.description);
    setResolving(false);
  }

  const hasSource = Boolean(value.studioId || value.directoryId);
  return (
    <div className="space-y-3">
      <Label htmlFor={`${listId}-input`}>Miejsce zajęć</Label>
      <Input
        id={`${listId}-input`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        value={query}
        disabled={locked || resolving}
        placeholder="Wpisz nazwę studia lub adres"
        onChange={(event) => {
          setQuery(event.target.value);
          setSearching(true);
          onChange({
            location: { address_line1: event.target.value },
            studioId: null,
            directoryId: null,
            showName: false,
          });
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setSearching(false);
            setSuggestions([]);
          }
          if (event.key === "ArrowDown" && suggestions.length) {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % suggestions.length);
          }
          if (event.key === "ArrowUp" && suggestions.length) {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
          }
          if (event.key === "Enter" && suggestions[activeIndex]) {
            event.preventDefault();
            void select(suggestions[activeIndex]);
          }
        }}
      />
      {suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Podpowiedzi miejsc"
          className="max-h-64 overflow-auto rounded-md border"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={
                suggestion.kind === "venue"
                  ? `venue-${suggestion.value.studio_id ?? suggestion.value.directory_id}`
                  : `address-${suggestion.value.place_id}`
              }
            >
              <button
                id={`${listId}-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${activeIndex === index ? "bg-gray-100" : ""}`}
                onClick={() => void select(suggestion)}
              >
                {suggestion.kind === "venue" ? (
                  <>
                    <span className="block font-medium">{suggestion.value.name}</span>
                    <span>{suggestion.value.address}</span>
                  </>
                ) : (
                  suggestion.value.description
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {hasSource && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Jak pokazać miejsce zajęć?</legend>
          <p className="text-xs text-muted-foreground">
            Wybierz, czy przy adresie zajęć pokazać także nazwę studia.
          </p>
          {[false, true].map((show) => (
            <label key={String(show)} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${listId}-display`}
                checked={value.showName === show}
                onChange={() => onChange({ ...value, showName: show })}
              />
              {show ? "Nazwa studia i adres" : "Tylko adres"}
            </label>
          ))}
        </fieldset>
      )}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {value.showName && hasSource && value.location.title ? `${value.location.title} · ` : ""}
        {value.location.address_line1}
      </p>
    </div>
  );
}
