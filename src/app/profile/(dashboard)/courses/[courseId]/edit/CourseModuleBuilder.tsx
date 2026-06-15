"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FieldErrors } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { getModuleHoursTotal } from "./courseFormModel";
import type { CourseFormValues, CourseModuleValue } from "./types";

interface CourseModuleBuilderProps {
  modules: CourseModuleValue[];
  errors: FieldErrors<CourseFormValues>;
  onChange: (modules: CourseModuleValue[]) => void;
}

interface EditingModule extends CourseModuleValue {
  index: number | null;
}

const emptyEditModule: EditingModule = {
  index: null,
  title: "",
  hours: "",
  description: "",
};

export function CourseModuleBuilder({ modules, errors, onChange }: CourseModuleBuilderProps) {
  const [editing, setEditing] = useState<EditingModule | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const total = getModuleHoursTotal(modules);

  function saveEditing() {
    if (!editing?.title?.trim()) return;
    const nextModule: CourseModuleValue = {
      title: editing.title.trim(),
      hours: editing.hours === "" ? null : Number(editing.hours),
      description: editing.description?.trim() || "",
    };
    const next = [...modules];
    if (editing.index == null) next.push(nextModule);
    else next[editing.index] = nextModule;
    onChange(next);
    setEditing(null);
  }

  function remove(index: number) {
    onChange(modules.filter((_, itemIndex) => itemIndex !== index));
    setEditing(null);
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= modules.length) return;
    const next = [...modules];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function renderEditForm() {
    if (!editing) return null;
    return (
      <div className="space-y-4 rounded-lg border-2 border-brand-green bg-white p-4">
        <div className="space-y-2">
          <label className="text-base font-semibold">Nazwa modułu</label>
          <Input
            className="h-12 rounded-md px-3 text-base focus-visible:ring-brand-green"
            value={editing.title}
            onChange={(event) => setEditing({ ...editing, title: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-base font-semibold">
            Godziny <span className="text-muted-foreground">- opcj.</span>
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            className="h-12 rounded-md px-3 text-base focus-visible:ring-brand-green"
            value={editing.hours ?? ""}
            onKeyDown={(event) => {
              if (["e", "E", "+", "-", "."].includes(event.key)) event.preventDefault();
            }}
            onChange={(event) => setEditing({ ...editing, hours: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-base font-semibold">
            Opis / tematy <span className="text-muted-foreground">- opcj.</span>
          </label>
          <Textarea
            className="min-h-24 rounded-md px-3 py-2 text-base focus-visible:ring-brand-green"
            value={editing.description ?? ""}
            onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            spellCheck={false}
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-0 text-base font-semibold"
            onClick={() => (editing.index != null ? remove(editing.index) : setEditing(null))}
          >
            <Trash2 className="size-4" />
            Usuń
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-md px-4 text-base"
            onClick={() => setEditing(null)}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            className="h-10 rounded-md bg-black px-4 text-base text-white hover:bg-black/90"
            onClick={saveEditing}
          >
            Gotowe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-error-field="modules">
      <p className="text-base leading-6 text-muted-foreground">
        Podziel kurs na moduły. Godziny są opcjonalne - jeśli je podasz, policzymy sumę za Ciebie.
      </p>

      {modules.map((module, index) => {
        const isOpen = editing?.index === index;
        if (isOpen) {
          return <div key={`${module.title}-${index}`}>{renderEditForm()}</div>;
        }
        return (
          <button
            type="button"
            key={`${module.title}-${index}`}
            className={cn(
              "flex min-h-16 w-full items-center rounded-lg border bg-white px-4 text-left",
              editing?.index === index && "border-brand-green",
            )}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex != null) move(dragIndex, index);
              setDragIndex(null);
            }}
            onClick={() => setEditing({ ...module, index })}
          >
            <span className="min-w-0 flex-1 text-base font-semibold">{module.title}</span>
            <span className="shrink-0 text-base text-muted-foreground">
              {module.hours ? `${module.hours}h` : <em>bez godzin</em>}
            </span>
            <GripVertical className="ml-3 size-5 shrink-0 text-muted-foreground" />
          </button>
        );
      })}

      {editing?.index == null && renderEditForm()}

      {errors.modules?.message && (
        <p className="text-sm text-destructive">{errors.modules.message}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          className="flex min-h-10 items-center gap-3 text-base font-medium text-blue-600"
          onClick={() => setEditing(emptyEditModule)}
        >
          <Plus className="size-5" />
          Dodaj moduł
        </button>
        {total != null && (
          <span className="text-base font-semibold text-foreground">Razem: {total}h</span>
        )}
      </div>
    </div>
  );
}
