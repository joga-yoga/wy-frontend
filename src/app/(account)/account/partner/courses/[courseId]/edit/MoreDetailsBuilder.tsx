"use client";

import { Check, ChevronUp, GripVertical, Pencil, Plus, X } from "lucide-react";
import { KeyboardEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { CourseFormValues } from "./types";

type DetailKey =
  | "goals"
  | "includes"
  | "prerequisites"
  | "skill_level"
  | "cancellation_policy"
  | "important_info";

interface MoreDetailsBuilderProps {
  values: CourseFormValues;
  setField: <K extends keyof CourseFormValues>(name: K, value: CourseFormValues[K]) => void;
}

const detailLabels: Record<DetailKey, string> = {
  goals: "Czego się nauczysz",
  includes: "Co otrzymasz",
  prerequisites: "Wymagania",
  skill_level: "Poziom zaawansowania",
  cancellation_policy: "Polityka rezygnacji",
  important_info: "Ważne informacje",
};

const listPlaceholders: Record<"goals" | "includes", string> = {
  goals: "np. Prowadzić bezpieczne zajęcia",
  includes: "np. Certyfikat ukończenia",
};

const skillOptions = ["Początkujący", "Średniozaawansowany", "Zaawansowany", "Nauczycielski"];
const detailOrder = Object.keys(detailLabels) as DetailKey[];

function hasContent(key: DetailKey, values: CourseFormValues) {
  const value = values[key];
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function PreviewCard({
  detailKey,
  values,
  onEdit,
}: {
  detailKey: DetailKey;
  values: CourseFormValues;
  onEdit: () => void;
}) {
  const value = values[detailKey];
  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full rounded-lg border bg-white p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{detailLabels[detailKey]}</h3>
          {Array.isArray(value) ? (
            <ul className="mt-3 space-y-1 text-base leading-6 text-muted-foreground">
              {value.map((item) => (
                <li key={item} className="flex gap-2">
                  {detailKey === "goals" ? (
                    <Check className="mt-1 size-4 text-brand-green" />
                  ) : (
                    <span>•</span>
                  )}
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-base leading-6 text-muted-foreground">{value}</p>
          )}
        </div>
        <Pencil className="mt-1 size-5 shrink-0 text-muted-foreground" />
      </div>
    </button>
  );
}

function ListEditor({
  detailKey,
  values,
  setField,
  onDone,
}: MoreDetailsBuilderProps & { detailKey: "goals" | "includes"; onDone: () => void }) {
  const [draft, setDraft] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = values[detailKey] ?? [];

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setField(detailKey, [...items, trimmed] as any);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setField(detailKey, next as any);
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{detailLabels[detailKey]}</h3>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Dodaj po jednym punkcie. To, co uczestnik będzie widział na stronie kursu.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onDone} aria-label="Zwiń sekcję">
          <ChevronUp className="size-5" />
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex min-h-12 items-center gap-3 rounded-md border px-3"
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex != null) move(dragIndex, index);
              setDragIndex(null);
            }}
          >
            <GripVertical className="size-5 text-muted-foreground" />
            <span className="min-w-0 flex-1 text-base leading-5">{item}</span>
            <button
              type="button"
              onClick={() =>
                setField(detailKey, items.filter((_, itemIndex) => itemIndex !== index) as any)
              }
              aria-label="Usuń punkt"
            >
              <X className="size-5 text-muted-foreground" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <Plus className="size-5 shrink-0 text-blue-600" />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
            placeholder={listPlaceholders[detailKey]}
            className="h-12 rounded-md px-3 text-base focus-visible:ring-brand-green"
          />
        </div>
        <p className="text-sm text-muted-foreground">Naciśnij Enter, aby dodać kolejny punkt</p>
      </div>
    </div>
  );
}

function TextEditor({
  detailKey,
  values,
  setField,
  onDone,
}: MoreDetailsBuilderProps & {
  detailKey: "prerequisites" | "cancellation_policy" | "important_info";
  onDone: () => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <h3 className="text-lg font-semibold">{detailLabels[detailKey]}</h3>
      <Textarea
        value={(values[detailKey] as string) ?? ""}
        onChange={(event) => setField(detailKey, event.target.value as any)}
        className="min-h-24 rounded-md px-3 py-2 text-base focus-visible:ring-brand-green"
        spellCheck={false}
      />
      <div className="flex justify-end">
        <Button type="button" className="bg-black text-white hover:bg-black/90" onClick={onDone}>
          Gotowe
        </Button>
      </div>
    </div>
  );
}

function SkillLevelEditor({
  values,
  setField,
  onDone,
}: MoreDetailsBuilderProps & { onDone: () => void }) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <h3 className="text-lg font-semibold">{detailLabels.skill_level}</h3>
      <Select
        value={values.skill_level || ""}
        onValueChange={(value) => setField("skill_level", value)}
      >
        <SelectTrigger className="h-12 rounded-md text-base">
          <SelectValue placeholder="Wybierz poziom" />
        </SelectTrigger>
        <SelectContent>
          {skillOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex justify-end">
        <Button type="button" className="bg-black text-white hover:bg-black/90" onClick={onDone}>
          Gotowe
        </Button>
      </div>
    </div>
  );
}

export function MoreDetailsBuilder({ values, setField }: MoreDetailsBuilderProps) {
  const [active, setActive] = useState<DetailKey | null>(null);
  const filledKeys = detailOrder.filter((key) => hasContent(key, values));
  const emptyKeys = detailOrder.filter((key) => !hasContent(key, values));

  function renderEditor(key: DetailKey) {
    if (key === "goals" || key === "includes") {
      return (
        <ListEditor
          detailKey={key}
          values={values}
          setField={setField}
          onDone={() => setActive(null)}
        />
      );
    }
    if (key === "skill_level") {
      return (
        <SkillLevelEditor values={values} setField={setField} onDone={() => setActive(null)} />
      );
    }
    return (
      <TextEditor
        detailKey={key}
        values={values}
        setField={setField}
        onDone={() => setActive(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {filledKeys.map((key) =>
        active === key ? (
          <div key={key}>{renderEditor(key)}</div>
        ) : (
          <PreviewCard key={key} detailKey={key} values={values} onEdit={() => setActive(key)} />
        ),
      )}

      {emptyKeys.length > 0 ? (
        <div className="space-y-1">
          {filledKeys.length === 0 ? (
            <p className="pb-4 text-base leading-6 text-muted-foreground">
              Wszystko poniżej jest opcjonalne - dodaj tylko to, co potrzebne.
            </p>
          ) : (
            <p className="pb-2 text-sm font-medium text-muted-foreground">Możesz dodać też:</p>
          )}
          {emptyKeys.map((key) =>
            active === key ? (
              <div key={key} className="py-2">
                {renderEditor(key)}
              </div>
            ) : (
              <button
                type="button"
                key={key}
                className="flex min-h-12 w-full items-center border-b text-left"
                onClick={() => setActive(key)}
              >
                <span className="min-w-0 flex-1 text-base">{detailLabels[key]}</span>
                <Plus className="size-5 text-blue-600" />
              </button>
            ),
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-base font-medium text-muted-foreground">
          Wszystkie sekcje dodane
        </p>
      )}
    </div>
  );
}
