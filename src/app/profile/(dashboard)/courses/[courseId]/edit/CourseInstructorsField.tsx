"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { WyImage } from "@/components/custom/WyImage";
import { InstructorModal } from "@/components/instructors/InstructorModal";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";

import type { CourseFormValues, CourseInstructor } from "./types";

interface CourseInstructorsFieldProps {
  errors: FieldErrors<CourseFormValues>;
  setValue: UseFormSetValue<CourseFormValues>;
  watch: UseFormWatch<CourseFormValues>;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CourseInstructorsField({ errors, setValue, watch }: CourseInstructorsFieldProps) {
  const [availableInstructors, setAvailableInstructors] = useState<CourseInstructor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const instructors = watch("instructors") ?? [];
  const instructorIds = watch("instructor_ids") ?? [];

  useEffect(() => {
    async function loadInstructors() {
      const merged = new Map<string, CourseInstructor>();
      try {
        const owned = await axiosInstance.get<CourseInstructor[]>("/instructors");
        owned.data.forEach((instructor) =>
          merged.set(instructor.id, { ...instructor, is_owned: true, is_foreign: false }),
        );
      } catch {
        // The modal can still create/resolve instructors if this list fails.
      }
      try {
        const roster = await axiosInstance.get<CourseInstructor[]>("/instructor-roster");
        roster.data.forEach((instructor) =>
          merged.set(instructor.id, {
            ...instructor,
            is_foreign: instructor.is_owned === false,
          }),
        );
      } catch {
        // Roster endpoint is additive for this field.
      }
      setAvailableInstructors([...merged.values()]);
    }
    loadInstructors();
  }, []);

  function commit(nextInstructors: CourseInstructor[]) {
    const unique = [
      ...new Map(nextInstructors.map((instructor) => [instructor.id, instructor])).values(),
    ];
    setValue("instructors", unique, { shouldDirty: true });
    setValue(
      "instructor_ids",
      unique.map((instructor) => instructor.id),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  return (
    <div className="space-y-4" data-error-field="instructor_ids">
      <div className="space-y-3">
        {instructors.map((instructor) => {
          // Cross-reference with availableInstructors for accurate ownership once loaded
          const resolved =
            availableInstructors.find((item) => item.id === instructor.id) ?? instructor;
          const isOwned = resolved.is_owned === true;

          return (
            <div key={instructor.id} className="flex min-h-12 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-base font-medium text-brand-green">
                {instructor.image_id ? (
                  <WyImage
                    src={instructor.image_id}
                    alt={instructor.name}
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover"
                  />
                ) : (
                  initials(instructor.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold">{instructor.name}</div>
                {!isOwned && (
                  <span className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                    Zewnętrzny
                  </span>
                )}
              </div>
              {isOwned && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 text-muted-foreground"
                  aria-label={`Edytuj prowadzącego ${instructor.name}`}
                  asChild
                >
                  <Link
                    href={`/profile/instructors/${instructor.id}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Pencil className="size-5" />
                  </Link>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 text-muted-foreground"
                onClick={() => commit(instructors.filter((item) => item.id !== instructor.id))}
                aria-label={`Usuń prowadzącego ${instructor.name}`}
              >
                <Trash2 className="size-5" />
              </Button>
            </div>
          );
        })}
      </div>
      {errors.instructor_ids?.message && (
        <p className="text-sm text-destructive">{errors.instructor_ids.message}</p>
      )}
      <button
        type="button"
        className="flex min-h-10 items-center gap-3 text-base font-medium text-brand-blue"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="size-5" />
        Dodaj instruktora
      </button>
      <InstructorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInstructorSaved={(instructor) => {
          const saved = instructor as CourseInstructor;
          setAvailableInstructors((prev) => {
            const exists = prev.some((item) => item.id === saved.id);
            return exists
              ? prev.map((item) => (item.id === saved.id ? saved : item))
              : [...prev, saved];
          });
          commit([...instructors, saved]);
          setIsModalOpen(false);
        }}
        existingInstructors={availableInstructors as any}
        availableInstructors={availableInstructors as any}
        selectedInstructorIds={instructorIds}
      />
    </div>
  );
}
