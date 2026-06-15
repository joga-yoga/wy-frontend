"use client";

import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CourseDateFieldProps {
  id: string;
  label: ReactNode;
  value?: string | null;
  error?: string;
  onChange: (value: string) => void;
}

function toDate(value?: string | null) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDate(value?: string | null) {
  const date = toDate(value);
  if (!date) return "Wybierz datę";
  return format(date, "d MMM yyyy", { locale: pl });
}

export function CourseDateField({ id, label, value, error, onChange }: CourseDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = toDate(value);

  return (
    <div className="space-y-2" data-error-field={id}>
      <label className="block text-base font-semibold" htmlFor={id}>
        {label}
      </label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-12 w-full justify-start rounded-md border-input px-3 text-left text-base font-normal shadow-sm",
              !selected && "text-muted-foreground",
              error && "border-destructive",
            )}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0" />
            {formatDate(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setIsOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
