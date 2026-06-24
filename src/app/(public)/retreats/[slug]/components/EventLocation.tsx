import { Navigation } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { renderLocation } from "@/lib/renderLocation";

import { LocationDetail } from "../types";
import EventLeafletMap from "./EventLeafletMap";

interface EventLocationProps {
  location: LocationDetail | null;
  title: string;
  id?: string;
  googleMapsHref?: string | null;
}

function buildGoogleMapsHref(location: LocationDetail): string {
  if (location.google_place_id) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.google_place_id)}`;
  }
  const parts = [location.address_line1, location.city, location.country].filter(Boolean).join(", ");
  if (parts) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
  }
  if (location.latitude && location.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  return "https://www.google.com/maps";
}

export const EventLocation: React.FC<EventLocationProps> = ({
  location,
  title,
  id,
  googleMapsHref,
}) => {
  if (!location) return null;
  const mapsHref = googleMapsHref ?? buildGoogleMapsHref(location);
  return (
    <section aria-labelledby="location-heading" id={id}>
      <div className="mb-5 md:mb-[52px]">
        <h2 id="location-heading" className="text-xl font-semibold text-gray-900 mb-3">
          Lokalizacja
        </h2>
        <p className="text-sm text-gray-500">{renderLocation(location as any)}</p>
      </div>
      {location?.latitude && location?.longitude ? (
        <div className="aspect-[16/9] w-full rounded-[22px] overflow-hidden md:aspect-auto md:h-96">
          <EventLeafletMap
            latitude={location.latitude}
            longitude={location.longitude}
            title={title}
          />
        </div>
      ) : (
        <div className="aspect-[16/9] w-full rounded-2xl bg-muted flex items-center justify-center md:aspect-auto md:h-96">
          <p className="text-muted-foreground">Mapa niedostępna.</p>
        </div>
      )}
      <div className="mt-4">
        <Button asChild variant="outline" className="w-full">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
            <Navigation className="mr-2 h-4 w-4" />
            Nawiguj w Google Maps
          </a>
        </Button>
      </div>
    </section>
  );
};
