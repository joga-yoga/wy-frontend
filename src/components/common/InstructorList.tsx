"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { InstructorRow, type InstructorRowData } from "./InstructorRow";

const PREVIEW_COUNT = 4;

/** Shared instructor list: hairline divider between rows only, first 4 + "Zobacz
 * wszystkich instruktorów" show-more button beyond that (T07). Used on the studio page
 * (all instructors) and the class page (filtered to that class template's instructors). */
export function InstructorList({ instructors }: { instructors: InstructorRowData[] }) {
  const [showAll, setShowAll] = useState(false);
  if (instructors.length === 0) return null;

  const hasMore = instructors.length > PREVIEW_COUNT;
  const visible = showAll || !hasMore ? instructors : instructors.slice(0, PREVIEW_COUNT);

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {visible.map((instructor) => (
          <div key={instructor.id} className="py-3">
            <InstructorRow instructor={instructor} />
          </div>
        ))}
      </div>
      {hasMore && !showAll && (
        <Button
          variant="muted"
          className="mt-3 h-12 w-full rounded-xl"
          onClick={() => setShowAll(true)}
        >
          Zobacz wszystkich instruktorów
        </Button>
      )}
    </div>
  );
}
