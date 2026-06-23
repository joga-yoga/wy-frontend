"use client";

import { CalendarOff, ChevronRight, ImageIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CourseCard, type CourseCardEvent } from "@/app/(public)/courses/CourseCard";
import RetreatCard from "@/app/(public)/retreats/components/EventCard";
import type { Event } from "@/app/(public)/retreats/types";
import { WorkshopCard } from "@/app/(public)/workshops/WorkshopCard";
import { WyImage } from "@/components/custom/WyImage";
import type { OrganizerEvent } from "@/components/page-contents/organizer/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { countLastYear, formatDateRange, formatMonthYear } from "./helpers";

type EventType = "workshops" | "retreats" | "courses";

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
  upcomingCourses: OrganizerEvent[];
  pastCourses: OrganizerEvent[];
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
    if (group.key === "retreats")
      return `/wyjazdy/${event.slug}?from=${encodeURIComponent(pathname)}`;
    if (group.key === "courses") return `/kursy/${event.slug}?from=${encodeURIComponent(pathname)}`;
    return `/wydarzenia/${event.slug}?from=${encodeURIComponent(pathname)}`;
  };

  return (
    <div>
      <SubGroupLabel label={group.label} logo={group.logo} />
      {group.key === "courses" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 px-4 items-stretch">
          {visible.map((event) => (
            <Link key={event.id} href={hrefFor(event)} className="h-full">
              <CourseCard event={event as unknown as CourseCardEvent} className="h-full" />
            </Link>
          ))}
        </div>
      ) : group.key === "workshops" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 px-4 items-stretch">
          {visible.map((event) => (
            <Link key={event.id} href={hrefFor(event)} className="h-full">
              <WorkshopCard event={event as unknown as Event} className="h-full" />
            </Link>
          ))}
        </div>
      ) : (
        visible.map((event) => (
          <Link key={event.id} href={hrefFor(event)} className="block mb-3">
            <RetreatCard event={event as unknown as Event} />
          </Link>
        ))
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
    </div>
  );
}

type PastEvent = OrganizerEvent & { kind: "workshop" | "retreat" | "course" };

function PastEventRow({ event, href }: { event: PastEvent; href: string }) {
  const imageId = event.image_ids?.[0];
  const logo =
    event.kind === "retreat"
      ? "/images/logo/logo-retreats.png"
      : event.kind === "course"
        ? "/images/logo/logo-courses.png"
        : "/images/logo/logo-workshops.png";

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
        {imageId ? (
          <WyImage src={imageId} alt={event.title} fill className="object-cover" sizes="48px" />
        ) : (
          <ImageIcon className="w-4 h-4" style={{ color: "#B0B0B0" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate" style={{ color: "#222222" }}>
          {event.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#B0B0B0" }}>
          {formatDateRange(event.start_date, event.end_date)}
        </p>
      </div>
      <img src={logo} className="w-4 h-4 shrink-0 opacity-40" alt="" />
    </Link>
  );
}

function PastEventsSection({
  pastWorkshops,
  pastRetreats,
  pastCourses,
}: {
  pastWorkshops: OrganizerEvent[];
  pastRetreats: OrganizerEvent[];
  pastCourses: OrganizerEvent[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const pathname = usePathname();

  const all: PastEvent[] = [
    ...pastWorkshops.map((e) => ({ ...e, kind: "workshop" as const })),
    ...pastRetreats.map((e) => ({ ...e, kind: "retreat" as const })),
    ...pastCourses.map((e) => ({ ...e, kind: "course" as const })),
  ].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

  if (all.length === 0) return null;

  const lastYearCount = countLastYear(all);
  const displayed = all.slice(0, 3);

  const hrefFor = (event: PastEvent) => {
    if (event.kind === "retreat")
      return `/wyjazdy/${event.slug}?from=${encodeURIComponent(pathname)}`;
    if (event.kind === "course") return `/kursy/${event.slug}?from=${encodeURIComponent(pathname)}`;
    return `/wydarzenia/${event.slug}?from=${encodeURIComponent(pathname)}`;
  };

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

        {displayed.map((event) => (
          <PastEventRow key={event.id} event={event} href={hrefFor(event)} />
        ))}

        {all.length > 3 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium"
            style={{ color: "#717171" }}
          >
            Pełna historia ({all.length}) <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="h-4" />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <DialogTitle>
              Historia wydarzeń
              <span className="ml-2 text-sm font-normal" style={{ color: "#B0B0B0" }}>
                ({all.length})
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto py-2">
            {all.map((event) => (
              <PastEventRow key={event.id} event={event} href={hrefFor(event)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CalendarSection({
  upcomingWorkshops,
  upcomingRetreats,
  pastWorkshops,
  pastRetreats,
  upcomingCourses,
  pastCourses,
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
    {
      key: "courses",
      label: "Moje kursy",
      logo: "/images/logo/logo-courses.png",
      events: upcomingCourses,
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
      <PastEventsSection
        pastWorkshops={pastWorkshops}
        pastRetreats={pastRetreats}
        pastCourses={pastCourses}
      />
    </div>
  );
}
