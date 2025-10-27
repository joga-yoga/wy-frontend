"use client";

import { TagsSelectBase } from "@/components/custom/TagsSelect";

interface TagsSectionProps {
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

const TagsSection = ({ selectedTags, onToggle }: TagsSectionProps) => {
  return (
    <div className="mx-7 my-11">
      <p className="text-sub-descript-18 md:text-descr-under-big-head">Typy wydarzeń</p>
      <div className="mt-5">
        <TagsSelectBase selectedTags={selectedTags} onToggle={onToggle} />
      </div>
    </div>
  );
};

export default TagsSection;
