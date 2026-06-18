"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FieldErrors } from "react-hook-form";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import { getRandomDefaultImageId } from "@/lib/getRandomDefaultImageId";

import { CourseDateField } from "./CourseDateField";
import type { CourseFormValues, CourseProgramItem } from "./types";

interface CourseProgramBuilderProps {
  program: CourseProgramItem[];
  errors: FieldErrors<CourseFormValues>;
  onChange: (program: CourseProgramItem[]) => void;
}

function emptyBlock(): CourseProgramItem {
  return {
    start_date: "",
    end_date: "",
    imageId: getRandomDefaultImageId(),
    description: "",
  };
}

export function CourseProgramBuilder({ program, errors, onChange }: CourseProgramBuilderProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const programErrors = Array.isArray(errors.program) ? errors.program : undefined;

  function updateBlock(index: number, patch: Partial<CourseProgramItem>) {
    onChange(program.map((block, i) => (i === index ? { ...block, ...patch } : block)));
  }

  function addBlock() {
    onChange([...program, emptyBlock()]);
  }

  function removeBlock(index: number) {
    onChange(program.filter((_, i) => i !== index));
  }

  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axiosInstance.post<{ image_id: string }>(
        "/events/image-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      updateBlock(index, { imageId: response.data.image_id });
    } catch {
      // Keep the existing image on failure; the upload control resets itself.
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="space-y-4" data-error-field="program">
      <p className="text-base leading-6 text-muted-foreground">
        Podziel kurs na bloki (np. kolejne zjazdy). Dla każdego bloku podaj datę i krótko opisz, co
        się wydarzy. Datę zakończenia zostaw pustą, jeśli blok trwa jeden dzień. Zdjęcie dobieramy
        automatycznie - możesz je zmienić na własne.
      </p>

      {program.map((block, index) => (
        <div key={index} className="space-y-4 rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Blok {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => removeBlock(index)}
              aria-label={`Usuń blok ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CourseDateField
              id={`program-${index}-start`}
              label="Data rozpoczęcia"
              value={block.start_date}
              error={programErrors?.[index]?.start_date?.message}
              onChange={(value) => updateBlock(index, { start_date: value })}
            />
            <CourseDateField
              id={`program-${index}-end`}
              label={
                <>
                  Data zakończenia{" "}
                  <span className="font-medium text-muted-foreground">- opcjonalnie</span>
                </>
              }
              value={block.end_date}
              error={programErrors?.[index]?.end_date?.message}
              onChange={(value) => updateBlock(index, { end_date: value })}
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:gap-6">
            <div className="shrink-0">
              <SingleImageUpload
                existingImageId={block.imageId}
                isUploading={uploadingIndex === index}
                onFileSelect={(file) => uploadImage(index, file)}
                onRemove={() => updateBlock(index, { imageId: getRandomDefaultImageId() })}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label
                className="block text-base font-semibold"
                htmlFor={`program-${index}-description`}
              >
                Opis bloku
              </label>
              <Textarea
                id={`program-${index}-description`}
                value={block.description ?? ""}
                onChange={(event) => updateBlock(index, { description: event.target.value })}
                placeholder="Opisz, co dzieje się w tym bloku. Nie wpisuj daty - pokażemy ją automatycznie."
                className="min-h-24 rounded-md px-3 py-2 text-base focus-visible:ring-brand-green"
                spellCheck={false}
              />
              {programErrors?.[index]?.description?.message && (
                <p className="text-sm text-destructive">
                  {programErrors[index]?.description?.message}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="flex min-h-10 items-center gap-3 text-base font-medium text-blue-600"
        onClick={addBlock}
      >
        <Plus className="size-5" />
        Dodaj blok
      </button>
    </div>
  );
}
