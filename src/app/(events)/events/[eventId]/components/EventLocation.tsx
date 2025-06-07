import React from "react";

import CustomLocationIcon from "@/components/icons/CustomLocationIcon";

import { LocationDetail } from "../types";
import EventLeafletMap from "./EventLeafletMap";

interface EventLocationProps {
  location: LocationDetail | null;
  title: string;
  id?: string;
}

// import dynamic from "next/dynamic";
// const EventLeafletMap = dynamic(() => import("./EventLeafletMap"), {
//   ssr: false,
//   loading: () => (
//     <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
//       Loading map...
//     </div>
//   ),
// });

export const EventLocation: React.FC<EventLocationProps> = ({ location, title, id }) => {
  return (
    <section aria-labelledby="location-heading" id={id}>
      <div className="mb-[52px]">
        <h2
          id="location-heading"
          className="text-h-middle text-zinc-800 flex items-center gap-2 mb-3"
        >
          <CustomLocationIcon className="w-8 h-8" />
          Lokalizacja
        </h2>
        <p className="text-listing-description text-zinc-500 pl-10">
          {location?.title || location?.address_line1}
          {location?.city ? `, ${location.city}` : ""}
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
