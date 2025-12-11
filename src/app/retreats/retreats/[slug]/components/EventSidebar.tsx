import { Clock } from "lucide-react";
import React from "react";

import CustomLangIcon from "@/components/icons/CustomLangIcon";
import CustomOnlineIcon from "@/components/icons/CustomOnlineIcon";
import CustomSkillLevelIcon from "@/components/icons/CustomSkillLevelIcon";
import { formatDurationInHours } from "@/lib/formatDateRange";

import { EventDetail } from "../types";
import { CancellationPolicySection, InstructorSection, OrganizerSection } from ".";
import { EventReservation } from "./EventReservation";
import { EventSidebarLocation } from "./EventSidebarLocation";

interface EventSidebarProps {
  event: EventDetail;
  className?: string;
  project: "retreats" | "workshops";
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

export const EventSidebar: React.FC<EventSidebarProps> = ({ event, className, project }) => {
  return (
    <div className={`flex flex-col gap-5 md:gap-[44px] ${className}`}>
      <div className="flex flex-col gap-2 border border-gray-100 rounded-[22px] shadow-[0px_8px_16px_8px_#FAFAFA] p-5">
        <EventReservation event={event} project={project} />
        <div className="border border-gray-100 rounded-t-[20px] md:rounded-t-[4px] rounded-b-[20px]">
          <div className="p-5">
            <div className="space-y-4">
              {event.location ? <EventSidebarLocation location={event.location} /> : null}
              {project === "workshops" && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-m-header md:text-subheader">Czas trwania</p>
                    <p className="text-m-descript md:text-sub-descript-18 text-gray-500">
                      {formatDurationInHours(event.start_date, event.end_date)}
                    </p>
                  </div>
                </div>
              )}
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
              {Boolean((event as any).is_online) && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center">
                    <CustomOnlineIcon className="h-8 w-8 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-m-header md:text-subheader">Udział zdalny</p>
                    <p className="text-m-descript md:text-sub-descript-18 text-gray-500">
                      Transmisja wydarzenia na żywo
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
