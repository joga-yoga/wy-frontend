"use client";

import { CalendarOff, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import RetreatCard from "@/app/(public)/retreats/components/EventCard";
import type { Event } from "@/app/(public)/retreats/types";
import { WorkshopCard } from "@/app/(public)/workshops/WorkshopCard";
import type { OrganizerEvent } from "@/components/page-contents/organizer/types";
import { Button } from "@/components/ui/button";

import { countLastYear, formatMonthYear } from "./helpers";

type EventType = "workshops" | "retreats";

interface EventGroup {
  key: EventType;
  label: string;
  logo: string;
  events: OrganizerEvent[];
}

interface CalendarSectionProps {
  upcomingWorkshops: OrganizerEvent[];
  upcomingRetreats: OrganizerEvent[];
  pastWorkshops: OrganizerEvent[];
  pastRetreats: OrganizerEvent[];
}

function SubGroupLabel({ label, logo }: { label: string; logo: string }) {
  return (
    <div className="px-4 pt-7 pb-4 flex items-center gap-2.5">
      <img src={logo} alt="" className="w-7 h-7" aria-hidden="true" />
      <h2 className="text-[22px] font-semibold" style={{ color: "#222222" }}>
        {label}
      </h2>
    </div>
  );
}

function EventSubGroup({ group }: { group: EventGroup }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const truncated = !expanded && group.events.length > 3;
  const visible = truncated ? group.events.slice(0, 2) : group.events;
  const hiddenCount = group.events.length - 2;

  const hrefFor = (event: OrganizerEvent) => {
    const base = group.key === "retreats" ? "/wyjazdy" : "/wydarzenia";
    return `${base}/${event.slug}?from=${encodeURIComponent(pathname)}`;
  };

  return (
    <div>
      <SubGroupLabel label={group.label} logo={group.logo} />
      {visible.map((event) =>
        group.key === "retreats" ? (
          <Link key={event.id} href={hrefFor(event)} className="block mb-3">
            <RetreatCard event={event as unknown as Event} />
          </Link>
        ) : (
          <Link key={event.id} href={hrefFor(event)} className="block mb-3">
            <WorkshopCard event={event as unknown as Event} />
          </Link>
        ),
      )}
      {truncated && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 px-4 py-2 mb-1 text-sm font-medium"
          style={{ color: "#717171" }}
        >
          + {hiddenCount} kolejne · Zobacz wszystkie
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function EmptyCalendar() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10">
      <CalendarOff className="h-8 w-8" style={{ color: "#B0B0B0" }} />
      <p className="text-sm text-center" style={{ color: "#717171" }}>
        Nie mam teraz zaplanowanych zajęć
      </p>
      {/* <Button
        variant="outline"
        className="h-9 px-5 rounded-xl text-sm"
        style={{ borderColor: "#EBEBEB", color: "#222222" }}
      >
        Śledź moje zajęcia
      </Button> */}
    </div>
  );
}

function PastEventsSection({
  pastWorkshops,
  pastRetreats,
}: {
  pastWorkshops: OrganizerEvent[];
  pastRetreats: OrganizerEvent[];
}) {
  const all = [...pastWorkshops, ...pastRetreats].sort(
    (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime(),
  );

  if (all.length === 0) return null;

  const lastYearCount = countLastYear(all);
  const displayed = all.slice(0, 2);

  return (
    <>
      <div style={{ height: "1px", background: "#EBEBEB", margin: "0 16px" }} />
      <div>
        <div className="flex items-baseline gap-2 px-4 pt-6 pb-3">
          <span className="text-base font-semibold" style={{ color: "#222222" }}>
            Zrealizowane
          </span>
          {lastYearCount > 0 && (
            <span className="text-sm" style={{ color: "#B0B0B0" }}>
              · {lastYearCount} w ostatnim roku
            </span>
          )}
        </div>

        {displayed.map((event, i) => (
          <div
            key={event.id}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ opacity: i === 0 ? 0.6 : 0.4 }}
          >
            <span className="text-sm w-20 flex-shrink-0" style={{ color: "#717171" }}>
              {formatMonthYear(event.start_date)}
            </span>
            <span className="text-[15px] flex-1 truncate" style={{ color: "#222222" }}>
              {event.title}
            </span>
          </div>
        ))}

        {all.length > 2 && (
          <button
            onClick={() => console.log("show all past")}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium"
            style={{ color: "#717171" }}
          >
            Pełna historia <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="h-4" />
      </div>
    </>
  );
}

export function CalendarSection({
  upcomingWorkshops,
  upcomingRetreats,
  pastWorkshops,
  pastRetreats,
}: CalendarSectionProps) {
  const allGroups: EventGroup[] = [
    {
      key: "workshops",
      label: "Moje wydarzenia",
      logo: "/images/logo/logo-workshops.png",
      events: upcomingWorkshops,
    },
    {
      key: "retreats",
      label: "Moje wyjazdy",
      logo: "/images/logo/logo-retreats.png",
      events: upcomingRetreats,
    },
  ];
  const groups = allGroups.filter((g) => g.events.length > 0);
  const totalUpcoming = groups.reduce((s, g) => s + g.events.length, 0);

  return (
    <div>
      {totalUpcoming === 0 ? (
        <EmptyCalendar />
      ) : (
        groups.map((group) => <EventSubGroup key={group.key} group={group} />)
      )}
      <PastEventsSection pastWorkshops={pastWorkshops} pastRetreats={pastRetreats} />
    </div>
  );
}
