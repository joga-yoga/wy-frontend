"use client";

import { Ban, Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { YogaStyleChips } from "@/components/common/YogaStyleChips";
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
  /** Omitted where there is nowhere sensible to cancel to (the inline create in U3). */
  onCancel?: () => void;
  /** Pins Anuluj/Zapisz to the viewport bottom (fade-gradient bar, list/form scrolls
   * underneath — the same pattern the Front Desk roster page's action bar uses) instead
   * of rendering them inline at the end of the form. Only meaningful for the standalone
   * create/edit pages — left off for the wizard-embedded inline create (U3), which isn't
   * a full-page scroll context and would clash with a viewport-fixed bar. Callers that
   * pass `true` are responsible for adding matching bottom padding so the fixed bar
   * doesn't cover the end of the form. */
  pinFooter?: boolean;
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
  onCancel,
  pinFooter = false,
}: TemplateEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.duration_minutes ?? 60));
  const [level, setLevel] = useState(initial?.level ?? "");
  const [styleId, setStyleId] = useState<string | null>(initial?.style_id ?? null);
  const [language, setLanguage] = useState(initial?.language ?? "polski");
  const [color, setColor] = useState<ClassColor | null>(initial?.color ?? null);
  const [defaultInstructorId, setDefaultInstructorId] = useState(
    initial?.default_instructor_id ?? "",
  );
  const [defaultCapacity, setDefaultCapacity] = useState(
    initial?.default_capacity != null ? String(initial.default_capacity) : "",
  );
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

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
    data.style_id = styleId;
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
          {/* U2 pairs these on one row — both are short, and a studio picks them
              together when defining what the class *is*. */}
          <div className="grid grid-cols-2 gap-3">
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
                  <SelectTrigger id="level" className="min-w-0 flex-1">
                    <SelectValue placeholder="Wybierz" />
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
                    aria-label="Wyczyść poziom"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="style">
              Styl <span className="text-gray-400">· opcjonalnie</span>
            </Label>
            {/* Single-select over the catalog. The old free-text fallback is gone: `style_id`
                is a FK, so an arbitrary string has nowhere to be stored — YogaStyleChips
                renders nothing at all when the catalog is empty rather than silently
                accepting input that could not be saved. */}
            <YogaStyleChips
              mode="single"
              className="mt-1.5"
              value={styleId}
              onChange={setStyleId}
            />
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
            <Label>Kolor zajęć</Label>
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

      {/* U2 pairs Anuluj with Zapisz. A lone full-width save gives no way out of a form
          you opened by mistake except the browser's back. Pinned variant mirrors the Front
          Desk roster page's action bar: a full-width fade-gradient outer bar (so the fade
          reaches both viewport edges) with the buttons constrained/centred inside it. */}
      {pinFooter ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pb-4 pt-8">
          <div className="mx-auto flex max-w-lg gap-3 px-4">
            {onCancel && (
              <Button
                size="action"
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                Anuluj
              </Button>
            )}
            <Button
              size="action"
              variant="green"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? "Zapisywanie..." : submitLabel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          {onCancel && (
            <Button
              size="action"
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Anuluj
            </Button>
          )}
          <Button
            size="action"
            variant="green"
            className="flex-1"
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? "Zapisywanie..." : submitLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
