import React from "react";

import { renderLocation } from "@/lib/renderLocation";

import { LocationDetail } from "../types";
import EventLeafletMap from "./EventLeafletMap";

interface EventLocationProps {
  location: LocationDetail | null;
  title: string;
  id?: string;
}

export const EventLocation: React.FC<EventLocationProps> = ({ location, title, id }) => {
  if (!location) return null;
  return (
    <section aria-labelledby="location-heading" id={id}>
      <div className="mb-5 md:mb-[52px]">
        <h2 id="location-heading" className="text-xl font-semibold text-gray-900 mb-3">
          Lokalizacja
        </h2>
        <p className="text-sm text-gray-500">{renderLocation(location as any)}</p>
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
