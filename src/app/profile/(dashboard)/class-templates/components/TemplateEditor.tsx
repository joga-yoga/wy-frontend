"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { axiosInstance } from "@/lib/axiosInstance";

import type { ClassTemplate, ClassTemplateCreate } from "../types";

interface InstructorOption {
  id: string;
  name: string;
}

interface TemplateEditorProps {
  initial?: ClassTemplate | null;
  onSubmit: (data: ClassTemplateCreate) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const DURATION_OPTIONS = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "75", label: "75 min" },
  { value: "90", label: "90 min" },
  { value: "120", label: "120 min" },
];

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Początkujący" },
  { value: "intermediate", label: "Średni" },
  { value: "advanced", label: "Zaawansowany" },
  { value: "all_levels", label: "Wszystkie poziomy" },
];

export function TemplateEditor({
  initial,
  onSubmit,
  submitLabel = "Zapisz szablon",
  isSubmitting = false,
}: TemplateEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.duration_minutes ?? 60));
  const [level, setLevel] = useState(initial?.level ?? "");
  const [style, setStyle] = useState(initial?.style ?? "");
  const [defaultInstructorId, setDefaultInstructorId] = useState(
    initial?.default_instructor_id ?? "",
  );
  const [defaultCapacity, setDefaultCapacity] = useState(
    initial?.default_capacity != null ? String(initial.default_capacity) : "",
  );
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [yogaStyles, setYogaStyles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    axiosInstance
      .get<InstructorOption[]>("/instructors")
      .then((r) => setInstructors(r.data ?? []))
      .catch(() => {});
    axiosInstance
      .get<{ id: string; name: string }[]>("/yoga-styles")
      .then((r) => setYogaStyles(r.data ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const data: ClassTemplateCreate = {
      title: title.trim(),
      duration_minutes: parseInt(durationMinutes, 10),
    };
    if (level) data.level = level;
    if (style.trim()) data.style = style.trim();
    if (defaultInstructorId) data.default_instructor_id = defaultInstructorId;
    if (defaultCapacity) data.default_capacity = parseInt(defaultCapacity, 10);
    await onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Czym są te zajęcia
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Stałe cechy — takie same za każdym razem.</p>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="title">Nazwa</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Vinyasa Flow"
            />
          </div>
          <div>
            <Label htmlFor="duration">Czas trwania</Label>
            <Select value={durationMinutes} onValueChange={setDurationMinutes}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="level">Poziom</Label>
            <div className="flex gap-1.5">
              <Select value={level || undefined} onValueChange={setLevel}>
                <SelectTrigger id="level" className="flex-1">
                  <SelectValue placeholder="Wybierz poziom" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {level && (
                <button
                  type="button"
                  onClick={() => setLevel("")}
                  className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="style">
              Styl <span className="text-gray-400">· opcjonalnie</span>
            </Label>
            {yogaStyles.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {yogaStyles.map((s) => (
                  <Badge
                    key={s.id}
                    variant={style === s.name ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setStyle(style === s.name ? "" : s.name)}
                  >
                    {s.name}
                  </Badge>
                ))}
                {style && !yogaStyles.some((s) => s.name === style) && (
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm bg-gray-50 text-gray-600">
                    {style}
                    <button
                      type="button"
                      onClick={() => setStyle("")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            ) : (
              <Input
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="np. Hatha, Ashtanga"
              />
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Domyślne ustawienia
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Podpowiadane przy dodawaniu do grafiku — można zmienić.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="instructor">Domyślny prowadzący</Label>
            <div className="flex gap-1.5">
              <Select
                value={defaultInstructorId || undefined}
                onValueChange={setDefaultInstructorId}
              >
                <SelectTrigger id="instructor" className="flex-1">
                  <SelectValue placeholder="Wybierz prowadzącego" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {defaultInstructorId && (
                <button
                  type="button"
                  onClick={() => setDefaultInstructorId("")}
                  className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="capacity">Domyślny limit</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              value={defaultCapacity}
              onChange={(e) => setDefaultCapacity(e.target.value)}
              placeholder="Bez limitu"
            />
          </div>
        </div>
      </section>

      <Button className="w-full" onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
        {isSubmitting ? "Zapisywanie..." : submitLabel}
      </Button>
    </div>
  );
}
