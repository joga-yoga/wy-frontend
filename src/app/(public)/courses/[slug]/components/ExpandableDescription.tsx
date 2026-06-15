"use client";

import { useState } from "react";

import { formatMultiLineText } from "@/app/(public)/retreats/[slug]/helpers";

const LIMIT = 350;

export const ExpandableDescription = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > LIMIT;
  const displayText = !expanded && isLong ? text.slice(0, LIMIT).trimEnd() : text;

  return (
    <div>
      <div className="text-gray-700 text-base leading-relaxed">
        {formatMultiLineText(displayText)}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-brand-green text-sm mt-1 hover:underline"
        >
          {expanded ? "Pokaż mniej ↑" : "Czytaj więcej →"}
        </button>
      )}
    </div>
  );
};
