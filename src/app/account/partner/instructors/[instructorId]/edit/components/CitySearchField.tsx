"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import type { CityItem } from "@/types/instructor";

interface Props {
  value: CityItem[];
  onChange: (value: CityItem[]) => void;
}

export function CitySearchField({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get<CityItem[]>("/places/search", {
          params: { q: query },
        });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const addCity = (city: CityItem) => {
    if (!value.find((c) => c.place_id === city.place_id)) {
      onChange([...value, city]);
    }
    setQuery("");
    setResults([]);
  };

  const removeCity = (place_id: string) => {
    onChange(value.filter((c) => c.place_id !== place_id));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Szukaj miasta..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {(results.length > 0 || loading) && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md">
            {loading && <div className="px-3 py-2 text-sm text-muted-foreground">Szukam...</div>}
            {results.map((city) => (
              <button
                key={city.place_id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => addCity(city)}
              >
                {city.name}, {city.country}
              </button>
            ))}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((city) => (
            <Badge key={city.place_id} variant="secondary" className="gap-1">
              {city.name}, {city.country}
              <button type="button" onClick={() => removeCity(city.place_id)}>
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
