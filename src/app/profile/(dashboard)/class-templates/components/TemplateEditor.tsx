"use client";

import { Ban, Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { CLASS_COLORS, type ClassColor, COLOR_LABELS, COLOR_SWATCH_MAP } from "@/lib/classColors";
import { cn } from "@/lib/utils";

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

const LANGUAGE_OPTIONS = [
  { value: "polski", label: "Polski" },
  { value: "angielski", label: "Angielski" },
  { value: "ukraiński", label: "Ukraiński" },
];

export function TemplateEditor({
  initial,
  onSubmit,
  submitLabel = "Zapisz szablon",
  isSubmitting = false,
}: TemplateEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.duration_minutes ?? 60));
  const [level, setLevel] = useState(initial?.level ?? "");
  const [style, setStyle] = useState(initial?.style ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "polski");
  const [color, setColor] = useState<ClassColor | null>(initial?.color ?? null);
  const [defaultInstructorId, setDefaultInstructorId] = useState(
    initial?.default_instructor_id ?? "",
  );
  const [defaultCapacity, setDefaultCapacity] = useState(
    initial?.default_capacity != null ? String(initial.default_capacity) : "",
  );
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [yogaStyles, setYogaStyles] = useState<{ id: string; name: string }[]>([]);

  const [imageId, setImageId] = useState(initial?.image_ids?.[0] ?? "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const { toast } = useToast();

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

  const handleImageFileSelect = async (file: File) => {
    setIsUploadingImage(true);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axiosInstance.post<{ image_id: string }>(
        "/events/image-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setImageId(response.data.image_id);
      setIsImageRemoved(false);
    } catch {
      URL.revokeObjectURL(previewUrl);
      setImagePreviewUrl(null);
      toast({ description: "Nie udało się przesłać zdjęcia.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setImageId("");
    setImagePreviewUrl(null);
    setIsImageRemoved(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const data: ClassTemplateCreate = {
      title: title.trim(),
      duration_minutes: parseInt(durationMinutes, 10),
    };
    if (description.trim()) data.description = description.trim();
    if (level) data.level = level;
    if (style.trim()) data.style = style.trim();
    if (language) data.language = language;
    data.color = color;
    if (defaultInstructorId) data.default_instructor_id = defaultInstructorId;
    if (defaultCapacity) data.default_capacity = parseInt(defaultCapacity, 10);
    data.image_ids = isImageRemoved ? null : imageId ? [imageId] : undefined;
    await onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Zdjęcie</Label>
        <div className="mt-1.5">
          <SingleImageUpload
            existingImageId={imageId || null}
            imagePreviewUrl={imagePreviewUrl}
            isUploading={isUploadingImage}
            isRemoved={isImageRemoved}
            onFileSelect={handleImageFileSelect}
            onRemove={handleImageRemove}
          />
        </div>
      </div>

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
            <Label htmlFor="description">
              Opis <span className="text-gray-400">· opcjonalnie</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opisz te zajęcia — pojawi się na publicznej stronie klasy."
              rows={4}
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
          <div>
            <Label htmlFor="language">Język prowadzenia</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kolor</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {CLASS_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={COLOR_LABELS[c]}
                  aria-pressed={color === c}
                  onClick={() => setColor(color === c ? null : c)}
                  className={cn(
                    "relative h-8 w-8 rounded-full",
                    COLOR_SWATCH_MAP[c],
                    color === c && "ring-2 ring-gray-900 ring-offset-2",
                  )}
                >
                  {color === c && (
                    <Check size={14} className="absolute inset-0 m-auto text-white" />
                  )}
                </button>
              ))}
              <button
                type="button"
                aria-label="Brak koloru"
                aria-pressed={color === null}
                onClick={() => setColor(null)}
                className={cn(
                  "relative h-8 w-8 rounded-full border border-dashed border-gray-300 bg-white",
                  color === null && "ring-2 ring-gray-900 ring-offset-2",
                )}
              >
                <Ban size={14} className="absolute inset-0 m-auto text-gray-400" />
              </button>
            </div>
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
