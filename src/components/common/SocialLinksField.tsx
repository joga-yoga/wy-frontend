"use client";

import { ArrowDown, ArrowUp, Globe, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultLabelFor, parseSocialUrl, type SocialPlatform } from "@/lib/socialLinks";
import { SOCIAL_PLATFORM_ICONS } from "@/lib/socialPlatformIcons";

export interface SocialLinkValue {
  /** Client-only stable key for React lists/reordering — not sent to the backend
   * (the backend re-derives id/platform/handle server-side on save). */
  key: string;
  url: string;
  platform: SocialPlatform;
  handle: string | null;
  label: string;
}

interface SocialLinksFieldProps {
  value: SocialLinkValue[];
  onChange: (value: SocialLinkValue[]) => void;
}

let counter = 0;
function nextKey(): string {
  counter += 1;
  return `social-link-${Date.now()}-${counter}`;
}

/** Paste-first smart input: paste a URL or handle, parse on blur/Enter into a chip
 * (platform icon + handle, or an editable label for unrecognized domains). Reorder via
 * up/down controls (sets save-time `position`), remove via X — shared between the
 * studio and instructor partner-dashboard editors (T09). */
export function SocialLinksField({ value, onChange }: SocialLinksFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const text = inputValue.trim();
    if (!text) return;
    try {
      const parsed = parseSocialUrl(text);
      const entry: SocialLinkValue = {
        key: nextKey(),
        url: parsed.normalizedUrl,
        platform: parsed.platform,
        handle: parsed.handle,
        label: defaultLabelFor(parsed),
      };
      onChange([...value, entry]);
      setInputValue("");
      setError(null);
    } catch {
      setError("To nie wygląda na poprawny link — wklej pełny adres, np. instagram.com/nazwa");
    }
  };

  const handleRemove = (key: string) => onChange(value.filter((item) => item.key !== key));

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const handleLabelChange = (key: string, label: string) => {
    onChange(value.map((item) => (item.key === key ? { ...item, label } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          onBlur={handleAdd}
          placeholder="Wklej link, np. instagram.com/twojestudio"
        />
        <Button type="button" variant="outline" onClick={handleAdd}>
          Dodaj
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, index) => {
            const Icon = SOCIAL_PLATFORM_ICONS[item.platform] ?? Globe;
            return (
              <div key={item.key} className="flex items-center gap-2 rounded-md border p-2">
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                {item.platform === "custom" ? (
                  <Input
                    value={item.label}
                    onChange={(e) => handleLabelChange(item.key, e.target.value)}
                    className="h-8 flex-1"
                  />
                ) : (
                  <span className="flex-1 truncate text-sm">{item.handle || item.label}</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => handleMove(index, -1)}
                  aria-label="Przesuń wyżej"
                >
                  <ArrowUp size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === value.length - 1}
                  onClick={() => handleMove(index, 1)}
                  aria-label="Przesuń niżej"
                >
                  <ArrowDown size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item.key)}
                  className="text-destructive hover:text-destructive"
                  aria-label="Usuń"
                >
                  <X size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
