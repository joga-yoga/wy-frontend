import { DollarSign } from "lucide-react";
import Image from "next/image";
import React from "react";

import { formatMultiLineText, getImageUrl } from "../helpers";
import { EventDetail } from "../types";

interface EventMainContentProps {
  event: EventDetail;
}

export const EventMainContent: React.FC<EventMainContentProps> = ({ event }) => {
  return (
    <div className="lg:col-span-2 space-y-[44px]">
      {event.description && (
        <p className="text-listing-description text-gray-500">{event.description}</p>
      )}
      <hr />

      {/* Program Section */}
      {event.program && event.program.length > 0 && (
        <div className="space-y-[36px]">
          {(() => {
            const startDateObj = new Date(event.start_date);
            const isStartDateValid = !isNaN(startDateObj.getTime());

            return event.program!.map((dayDesc, index) => {
              let displayDayTitle = `Dzień ${index + 1}`;
              if (isStartDateValid) {
                const currentDate = new Date(startDateObj);
                currentDate.setDate(startDateObj.getDate() + index);
                const dateString = currentDate.toLocaleDateString("pl-PL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                const dayOfWeekString = currentDate.toLocaleDateString("pl-PL", {
                  weekday: "long",
                });
                displayDayTitle = `${dateString} (${dayOfWeekString})`;
              }

              return (
                <div key={index}>
                  <div className="flex items-start gap-[44px]">
                    <div className="relative w-40 h-40 flex-shrink-0">
                      <Image
                        src={getImageUrl(undefined, index + 5)} // Use other unsplash images
                        alt={`Program day ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-2xl"
                      />
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-subheader text-gray-800">{displayDayTitle}</h3>
                      <div className="text-sub-descript-18 text-gray-500">
                        {formatMultiLineText(dayDesc)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
      <hr />
      {event.accommodation_description && (
        <div>
          <h2 className="text-listing-description mb-[36px] text-gray-800">Nocleg</h2>
          <ul className="list-disc text-sub-descript-18 text-gray-500 space-y-2">
            {formatMultiLineText(event.accommodation_description)}
          </ul>
        </div>
      )}
      {event.food_description && (
        <div>
          <h2 className="text-listing-description mb-[36px] text-gray-800">Wyżywienie</h2>
          <p className="text-sub-descript-18 text-gray-500">{event.food_description}</p>
        </div>
      )}
      <hr />
      <div>
        <h2 className="text-listing-description mb-3 flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center border-2 border-yellow-500 rounded-full text-gray-500 text-subheader">
            zł
          </div>
          Cena obejmuje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <h3 className="text-subheader text-gray-800">Wliczone w cenę</h3>
            {event.price_includes && event.price_includes.length > 0 && (
              <ul className="list-disc pl-5 text-sub-descript-18 text-gray-500 space-y-1 mt-2">
                {event.price_includes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-subheader text-gray-800">Nie wliczone w cenę</h3>
              {event.price_excludes && event.price_excludes.length > 0 && (
                <ul className="list-disc pl-5 text-sub-descript-18 text-gray-500 space-y-1 mt-2">
                  {event.price_excludes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-subheader text-gray-800">Dodatkowe atrakcje za dopłatą</h3>
              {event.paid_attractions && event.paid_attractions.length > 0 && (
                <ul className="list-disc pl-5 text-sub-descript-18 text-gray-500 space-y-1 mt-2">
                  {event.paid_attractions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warto wiedziec */}
      <div className="space-y-4">
        <h2 className="text-h-middle text-gray-800">Warto wiedzieć</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {event.important_info && (
            <div className="text-sub-descript-18 text-gray-500">
              {formatMultiLineText(event.important_info)}
            </div>
          )}
          {/* {event.organizer && (
            <div>
              <h3 className="text-subheader text-gray-800">
                Organizator jako osoba prywatna
              </h3>
              <p className="text-sub-descript-18 text-gray-500">
                {event.organizer.name} odpowiada za to wydarzenie jako osoba indywidualna
              </p>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};
