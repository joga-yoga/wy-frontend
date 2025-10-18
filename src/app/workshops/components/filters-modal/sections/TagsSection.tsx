"use client";

import FilterItem from "@/app/retreats/components/filters-modal/components/FilterItem";

import { WorkshopsFilterInitialData } from "../hooks/useFilterInitialData";

interface TagsSectionProps {
  initialData: WorkshopsFilterInitialData | null | undefined;
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

const TagsSection = ({ initialData, selectedTags, onToggle }: TagsSectionProps) => {
  const tags = initialData?.tags || [];

  if (!tags.length) return null;

  return (
    <div className="mx-7 my-11">
      <p className="text-sub-descript-18 md:text-descr-under-big-head">Typy wydarzeń</p>
      <div className="flex flex-wrap gap-x-[12px] gap-y-4 mt-5">
        {tags.map((tag) => (
          <FilterItem
            key={tag}
            title={tag}
            isSelected={selectedTags.includes(tag)}
            onClick={() => onToggle(tag)}
          />
        ))}
      </div>
    </div>
  );
};

export default TagsSection;
