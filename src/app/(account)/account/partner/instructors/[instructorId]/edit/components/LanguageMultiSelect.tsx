"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const LANGUAGES = [
  { code: "pl", label: "Polski" },
  { code: "en", label: "Angielski" },
  { code: "de", label: "Niemiecki" },
  { code: "fr", label: "Francuski" },
  { code: "es", label: "Hiszpański" },
  { code: "it", label: "Włoski" },
  { code: "pt", label: "Portugalski" },
  { code: "ru", label: "Rosyjski" },
  { code: "uk", label: "Ukraiński" },
  { code: "cs", label: "Czeski" },
  { code: "sk", label: "Słowacki" },
  { code: "nl", label: "Niderlandzki" },
  { code: "sv", label: "Szwedzki" },
  { code: "no", label: "Norweski" },
  { code: "da", label: "Duński" },
];

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export function LanguageMultiSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter((v) => v !== code) : [...value, code]);
  };

  const labelFor = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase();

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-start">
            Dodaj języki
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Szukaj języka..." />
            <CommandList>
              <CommandEmpty>Nie znaleziono języka.</CommandEmpty>
              <CommandGroup>
                {LANGUAGES.map((lang) => (
                  <CommandItem key={lang.code} value={lang.code} onSelect={() => toggle(lang.code)}>
                    <span className={value.includes(lang.code) ? "font-semibold" : ""}>
                      {lang.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((code) => (
            <Badge key={code} variant="secondary" className="gap-1">
              {labelFor(code)}
              <button type="button" onClick={() => toggle(code)}>
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
