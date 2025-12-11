// EventLocation.tsx
"use client";

import Image from "next/image";

import { renderLocation } from "@/lib/renderLocation";
import { scrollTo } from "@/lib/scrollTo";

import { LocationDetail } from "../types";

interface EventSidebarLocationProps {
  location: LocationDetail;
}

export const EventSidebarLocation: React.FC<EventSidebarLocationProps> = ({ location }) => {
  if (!location) {
    return null;
  }

  return (
    <span className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo("map")}>
      <div className="w-[32px] h-[32px] min-w-[32px] md:h-12 md:w-12 md:min-w-12 border-2 border-gray-500 rounded-[6px] md:rounded-md flex items-center justify-center overflow-hidden">
        <Image src="/images/map.png" alt="Map icon" width={48} height={48} />
      </div>
      <p className="text-m-header md:text-sub-descript-18">{renderLocation(location as any)}</p>
    </span>
  );
};
