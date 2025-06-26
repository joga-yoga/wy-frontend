import { DollarSign, Languages, MapPin, Users } from "lucide-react";
import Image from "next/image";
import React from "react";

import CustomLangIcon from "@/components/icons/CustomLangIcon";
import CustomSkillLevelIcon from "@/components/icons/CustomSkillLevelIcon";
import { Button } from "@/components/ui/button";

import { formatDateRange, getImageUrl } from "../helpers";
import { EventDetail } from "../types";

interface EventSidebarProps {
  event: EventDetail;
  className?: string;
}

const skillLevelTranslations: { [key: string]: string } = {
  beginner: "Początkujący",
  intermediate: "Średniozaawansowany",
  advanced: "Zaawansowany",
};

const languageTranslations: { [key: string]: string } = {
  pl: "Polski",
  en: "Angielski",
  de: "Niemiecki",
  es: "Hiszpański",
  fr: "Francuski",
  it: "Włoski",
  ja: "Japoński",
  ko: "Koreański",
};

export const EventSidebar: React.FC<EventSidebarProps> = ({ event, className }) => {
  return (
    <div className={`flex flex-col gap-5 md:gap-[44px] ${className}`}>
      <div className="space-y-2 border border-gray-100 rounded-[22px] shadow-[0px_8px_16px_8px_#FAFAFA] p-5">
        <div className="border border-gray-100 rounded-t-[20px] rounded-b-[4px]">
          <div className="px-5 py-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-h-small md:text-descr-under-big-head font-medium">
                  {formatDateRange(event.start_date, event.end_date)}
                </p>
                <a
                  href="#cancellation-policy"
                  className="text-m-sunscript-font md:text-sub-descript-18 text-gray-500 underline"
                >
                  Zasady anulacji
                </a>
              </div>
              <Button variant="cta" size="cta">
                Rezerwacja
              </Button>
            </div>
          </div>
        </div>
        <div className="border border-gray-100 rounded-t-[4px] rounded-b-[20px]">
          <div className="p-5">
            <div className="space-y-4">
              <a href="#map" className="flex items-center gap-3">
                <div className="w-[32px] h-[32px] min-w-[32px] md:h-12 md:w-12 md:min-w-12 border-2 border-gray-500 rounded-[6px] md:rounded-md flex items-center justify-center overflow-hidden">
                  <Image src="/images/map.png" alt="Map icon" width={48} height={48} />
                </div>
                <p className="text-m-header md:text-sub-descript-18">
                  {event.location?.title || event.location?.address_line1 || "N/A"}
                  {event.location?.country ? `, ${event.location.country}` : ""}
                </p>
              </a>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 flex items-center justify-center border-2 border-yellow-500 rounded-full text-gray-500 text-subheader">
                  zł
                </div>
                <div>
                  <p className="text-m-header md:text-subheader">Cena</p>
                  <p className="text-m-descript md:text-sub-descript-18 text-gray-500">
                    {event.price
                      ? `${event.price.toFixed(2)} ${event.currency || "PLN"} za jedną osobę`
                      : "Cena nie podana"}
                  </p>
                </div>
              </div>
              {event.skill_level && event.skill_level.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center">
                    <CustomSkillLevelIcon className="h-8 w-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-m-header md:text-subheader">Poziom Yogi</p>
                    <p className="text-m-descript md:text-sub-descript-18 text-gray-500">
                      {event.skill_level
                        .map((level) => skillLevelTranslations[level] || level)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}
              {event.language && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center">
                    <CustomLangIcon className="h-8 w-8 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-m-header md:text-subheader">Język wydarzenia</p>
                    <p className="text-m-descript md:text-sub-descript-18 text-gray-500">
                      {(languageTranslations as any)[event.language.toLowerCase()] ||
                        event.language}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {event.main_attractions && event.main_attractions.length > 0 && (
          <div className="p-5 border border-neutral-100 rounded-[22px]">
            <h3 className="text-center text-h-small md:text-subheader mb-3">
              Najważniejsze atrakcje
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-m-sunscript-font md:text-sub-descript-18 text-gray-500">
              {event.main_attractions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <hr />

      {/* Instructor Section */}
      {event.instructors && event.instructors.length > 0 && (
        <div className="space-y-5 md:space-y-8">
          <h2 className="text-listing-description md:text-h-middle text-gray-800">Instruktor</h2>
          {event.instructors.map((instructor) => (
            <div
              key={instructor.id}
              className="px-5 py-[28px] border border-gray-100 rounded-[22px] shadow-[0px_8px_16px_8px_#FAFAFA] flex flex-col items-center text-center"
            >
              <div className="relative h-[88px] w-[88px] mb-3">
                <Image
                  src={getImageUrl(instructor.image_id, 0)}
                  alt={instructor.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <h3 className="text-middle-header-22 text-gray-800">{instructor.name}</h3>
              {instructor.bio && (
                <p className="text-descrip-under-header text-gray-400">{instructor.bio}</p>
              )}
            </div>
          ))}
        </div>
      )}
      <hr />

      {event.cancellation_policy && (
        <div
          className="p-5 border border-gray-100 rounded-[22px] text-center"
          id="cancellation-policy"
        >
          <h3 className="text-m-header md:text-subheader text-gray-800">
            Zasady anulowania rezerwacji
          </h3>
          <p className="text-m-descript md:text-sub-descript-18 text-gray-500 text-left mt-3">
            {event.cancellation_policy}
          </p>
        </div>
      )}
      <hr />
      {event.organizer && (
        <div className="px-5">
          <div className="flex items-center gap-5">
            <div className="relative h-[80px] w-[80px] flex-shrink-0">
              <Image
                src={getImageUrl(event.organizer.image_id, 1)}
                alt={event.organizer.name}
                fill
                className="rounded-full object-cover border"
              />
            </div>
            <div>
              <p className="text-subheader">Organizator</p>
              <p className="text-sub-descript-18 text-gray-500">{event.organizer.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
