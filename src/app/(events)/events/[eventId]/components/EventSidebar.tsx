import Image from "next/image";
import React from "react";

import CustomLangIcon from "@/components/icons/CustomLangIcon";
import CustomSkillLevelIcon from "@/components/icons/CustomSkillLevelIcon";
import { renderLocation } from "@/lib/renderLocation";
import { scrollTo } from "@/lib/scrollTo";

import { EventDetail } from "../types";
import { CancellationPolicySection, InstructorSection, OrganizerSection } from "./";
import { EventReservation } from "./EventReservation";

interface EventSidebarProps {
  event: EventDetail;
  className?: string;
}

const skillLevelTranslations: { [key: string]: string } = {
  beginner: "Początkujący",
  intermediate: "Średni",
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
      <div className="flex flex-col gap-2 border border-gray-100 rounded-[22px] shadow-[0px_8px_16px_8px_#FAFAFA] p-5">
        <EventReservation event={event} />
        <div className="border border-gray-100 rounded-t-[20px] md:rounded-t-[4px] rounded-b-[20px]">
          <div className="p-5">
            <div className="space-y-4">
              <span
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => scrollTo("map")}
              >
                <div className="w-[32px] h-[32px] min-w-[32px] md:h-12 md:w-12 md:min-w-12 border-2 border-gray-500 rounded-[6px] md:rounded-md flex items-center justify-center overflow-hidden">
                  <Image src="/images/map.png" alt="Map icon" width={48} height={48} />
                </div>
                <p className="text-m-header md:text-sub-descript-18">
                  {renderLocation(event.location as any)}
                </p>
              </span>
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
                    <p className="text-m-header md:text-subheader">Język wyjazdu</p>
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
      <div className="hidden lg:block">
        <InstructorSection event={event} />
      </div>
      <hr className="hidden lg:block" />
      {event.cancellation_policy ? (
        <>
          <div className="hidden lg:block">
            <CancellationPolicySection event={event} id="cancellation-policy" />
          </div>
          <hr className="hidden lg:block" />
        </>
      ) : null}
      <div className="hidden lg:block">
        <OrganizerSection event={event} />
      </div>
    </div>
  );
};
