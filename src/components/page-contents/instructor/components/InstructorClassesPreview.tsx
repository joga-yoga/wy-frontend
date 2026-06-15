"use client";

import { CalendarDays, Clock } from "lucide-react";
import type { ReactNode } from "react";

import type { StaticClassPreviewItem } from "./viewModel";

type InstructorClassesPreviewProps = {
  items: StaticClassPreviewItem[];
};

export function InstructorClassesPreview({ items }: InstructorClassesPreviewProps) {
  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby="instructor-classes-title">
      <SectionTitle id="instructor-classes-title" icon={<CalendarDays className="h-5 w-5" />}>
        Zajęcia
      </SectionTitle>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[#EBEBEB] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#717171]">
              {item.dateLabel}
            </p>
            <h3 className="mt-2 text-[18px] font-semibold leading-[22px] text-[#222222]">
              {item.title}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[#717171]">
              <Clock className="h-4 w-4" />
              <span>{item.timeLabel}</span>
            </div>
            <p className="mt-2 text-[14px] leading-5 text-[#717171]">{item.placeLabel}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({
  id,
  icon,
  children,
}: {
  id: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F7] text-[#444444]">
        {icon}
      </span>
      <h2 id={id} className="text-[22px] font-semibold leading-[30px] text-[#222222]">
        {children}
      </h2>
    </div>
  );
}
