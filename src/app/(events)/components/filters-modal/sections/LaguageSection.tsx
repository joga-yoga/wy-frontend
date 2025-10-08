"use client";

import FilterItem from "@/app/(events)/components/filters-modal/components/FilterItem";
import { languages } from "@/app/(events)/components/filters-modal/data";

interface LanguagesSectionProps {
  selectedLanguageCode?: string | null;
  onLanguageSelect?: (languageCode: string) => void;
}

export const LanguagesSection = ({
  selectedLanguageCode,
  onLanguageSelect,
}: LanguagesSectionProps) => {
  return (
    <div className="mx-7 my-11">
      <p className="text-sub-descript-18 md:text-descr-under-big-head">Język prowadzenia zajęć</p>
      <div className="flex flex-wrap gap-x-[12px] gap-y-4 mt-5">
        {languages.map((language) => (
          <FilterItem
            key={language.language_code}
            title={language.language_name}
            isSelected={selectedLanguageCode === language.language_code}
            onClick={() => onLanguageSelect?.(language.language_code)}
          />
        ))}
      </div>
    </div>
  );
};

export default LanguagesSection;
