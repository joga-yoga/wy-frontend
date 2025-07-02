import React from "react";

import CustomLocationIcon from "@/components/icons/CustomLocationIcon";
import { renderLocation } from "@/lib/renderLocation";

import { LocationDetail } from "../types";
import EventLeafletMap from "./EventLeafletMap";

interface EventLocationProps {
  location: LocationDetail | null;
  title: string;
  id?: string;
}

export const EventLocation: React.FC<EventLocationProps> = ({ location, title, id }) => {
  return (
    <section aria-labelledby="location-heading" id={id}>
      <div className="mb-5 md:mb-[52px]">
        <h2
          id="location-heading"
          className="text-listing-description md:text-h-middle text-gray-800 flex items-center gap-2 mb-3"
        >
          <CustomLocationIcon className="w-8 h-8" />
          Lokalizacja
        </h2>
        <p className="text-m-sunscript-font md:text-listing-description text-gray-500 pl-10">
          {renderLocation(location as any)}
        </p>
      </div>
      {location?.latitude && location?.longitude ? (
        <div className="h-96 w-full rounded-[22px] overflow-hidden">
          <EventLeafletMap
            latitude={location.latitude}
            longitude={location.longitude}
            title={title}
          />
        </div>
      ) : (
        <div className="h-96 w-full rounded-2xl bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Mapa niedostępna.</p>
        </div>
      )}
    </section>
  );
};
