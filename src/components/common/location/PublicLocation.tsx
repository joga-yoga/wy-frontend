import { Route } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PublicLocationMap } from "./PublicLocationMap";
import {
  buildGoogleMapsHref,
  formatDisplayAddress,
  type PublicLocationData,
} from "./publicLocationUtils";

export type { PublicLocationData } from "./publicLocationUtils";

interface PublicLocationProps {
  location: PublicLocationData | null;
  title: string;
  id?: string;
  googleMapsHref?: string | null;
  className?: string;
}

export function PublicLocation({
  location,
  title,
  id,
  googleMapsHref,
  className,
}: PublicLocationProps) {
  if (!location) return null;

  const address = formatDisplayAddress(location);
  const hasCoordinates = location.latitude != null && location.longitude != null;
  const mapsHref = googleMapsHref ?? buildGoogleMapsHref(location);

  return (
    <section
      aria-labelledby={id ? `${id}-heading` : "location-heading"}
      id={id}
      className={className}
    >
      <div className="mb-3 md:mb-4">
        <h2
          id={id ? `${id}-heading` : "location-heading"}
          className={cn("mb-1 text-lg md:text-2xl font-semibold text-gray-900")}
        >
          Lokalizacja
        </h2>
        {address && <p className="text-sm md:text-lg text-gray-500">{address}</p>}
      </div>
      {hasCoordinates ? (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl md:aspect-auto md:h-96">
          <PublicLocationMap
            latitude={location.latitude!}
            longitude={location.longitude!}
            title={title}
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-muted md:aspect-auto md:h-96">
          <p className="text-muted-foreground">Mapa niedostępna.</p>
        </div>
      )}
      <div className={cn("mt-3", !mapsHref && "hidden")}>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 w-full rounded-xl text-sm font-semibold",
          )}
        >
          <Route className="h-4 w-4" />
          Nawiguj w Google Maps
        </a>
      </div>
    </section>
  );
}
