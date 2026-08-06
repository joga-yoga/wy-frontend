"use client";

import { X } from "lucide-react";

import { HashedAvatar } from "@/components/common/HashedAvatar";
import { cn } from "@/lib/utils";

export interface PickableInstructor {
  id: string;
  name: string;
  image_id?: string | null;
  /** Roster row state — "awaiting" means the invite or link acceptance is still outstanding. */
  row_state?: string | null;
}

/**
 * The Zastępstwo picker (mockup S8) — the *whole* form for a substitution, which is a
 * single-field change. Deliberately a radio list rather than a `<Select>`: the choice needs to
 * show who each person is (avatar) and whether they are even connected yet, which a dropdown
 * of bare names cannot.
 *
 * Instructors with an outstanding invite stay selectable on purpose (reception-desk §6) — a
 * studio can schedule someone before they have finished claiming their profile.
 */
export function InstructorPicker({
  instructors,
  selectedId,
  currentId,
  onSelect,
  /** Adds a "Brak prowadzącego" option at the top — for flows (e.g. schedule
   * creation) where leaving the session unassigned is a valid choice, unlike a
   * substitution, which always needs someone selected. */
  allowNone = false,
  /** Subtitle for a non-current, non-awaiting instructor. Defaults to "Zastępstwo",
   * which only makes sense when `currentId` names a real existing assignment being
   * replaced — pass "" to suppress it (e.g. picking an instructor for a brand-new
   * session, where there's no "current" to be a substitute for). */
  otherLabel = "Zastępstwo",
}: {
  instructors: PickableInstructor[];
  selectedId: string;
  currentId: string | null;
  onSelect: (id: string) => void;
  allowNone?: boolean;
  otherLabel?: string;
}) {
  if (instructors.length === 0 && !allowNone) {
    return (
      <p className="rounded-b2b border border-dashed bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
        Brak instruktorów w tym studiu. Dodaj kogoś w Menu → Instruktorzy.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {allowNone && (
        <button
          type="button"
          onClick={() => onSelect("")}
          className={cn(
            "flex w-full items-center gap-3 rounded-b2b border bg-white px-3 py-3 text-left transition-colors",
            selectedId === ""
              ? "border-b2b-green-text ring-1 ring-b2b-green-text"
              : "border-gray-200",
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              selectedId === "" ? "border-b2b-green-text" : "border-gray-300",
            )}
          >
            {selectedId === "" && <span className="h-2.5 w-2.5 rounded-full bg-b2b-green-text" />}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400">
            <X size={14} />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
            Brak prowadzącego
          </span>
        </button>
      )}
      {instructors.map((instructor) => {
        const isSelected = instructor.id === selectedId;
        const subtitle =
          instructor.id === currentId
            ? "Obecny prowadzący"
            : instructor.row_state === "awaiting"
              ? "Oczekuje na zaproszenie"
              : otherLabel;

        return (
          <button
            key={instructor.id}
            type="button"
            onClick={() => onSelect(instructor.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-b2b border bg-white px-3 py-3 text-left transition-colors",
              isSelected ? "border-b2b-green-text ring-1 ring-b2b-green-text" : "border-gray-200",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                isSelected ? "border-b2b-green-text" : "border-gray-300",
              )}
            >
              {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-b2b-green-text" />}
            </span>
            <HashedAvatar
              seed={instructor.id}
              name={instructor.name}
              imageId={instructor.image_id}
              size={32}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-gray-900">
                {instructor.name}
              </span>
              {subtitle && <span className="block text-xs text-gray-500">{subtitle}</span>}
            </span>
          </button>
        );
      })}
      {instructors.length === 0 && allowNone && (
        <p className="px-1 text-xs text-gray-400">
          Brak instruktorów w tym studiu. Dodaj kogoś w Menu → Instruktorzy.
        </p>
      )}
    </div>
  );
}
