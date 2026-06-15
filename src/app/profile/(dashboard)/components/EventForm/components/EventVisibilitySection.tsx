"use client";

import { EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type VisibilityEntityType = "workshop" | "retreat" | "course" | "class";

const ENTITY_LABEL: Record<VisibilityEntityType, string> = {
  workshop: "To wydarzenie",
  retreat: "Ten wyjazd",
  course: "Ten kurs",
  class: "Te zajęcia",
};

const HIDE_LABEL: Record<VisibilityEntityType, string> = {
  workshop: "Ukryj wydarzenie",
  retreat: "Ukryj wyjazd",
  course: "Ukryj kurs",
  class: "Ukryj zajęcia",
};

interface EventVisibilitySectionProps {
  type: VisibilityEntityType;
  isToggling: boolean;
  onHide: () => void;
}

export function EventVisibilitySection({ type, isToggling, onHide }: EventVisibilitySectionProps) {
  return (
    <div className="flex flex-col gap-4 p-6 border rounded-lg bg-gray-50 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Widoczność</h3>
          <p className="text-sm text-gray-500">
            {ENTITY_LABEL[type]} jest obecnie publicznie widoczny.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
          onClick={onHide}
          disabled={isToggling}
        >
          {isToggling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ukrywanie...
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              {HIDE_LABEL[type]}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
