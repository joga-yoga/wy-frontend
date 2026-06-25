"use client";

import { ImageIcon } from "lucide-react";
import Link from "next/link";

import { WyImage } from "@/components/custom/WyImage";
import { cn } from "@/lib/utils";

import type { InstructorEventCardViewModel } from "./viewModel";

type InstructorEventSectionProps = {
  id: string;
  title: string;
  items: InstructorEventCardViewModel[];
};

export function InstructorEventSection({
  id,
  title,
  items,
}: InstructorEventSectionProps) {
  const isDemo = items.every((item) => item.isDemo);
  const emoji = title === "Wyjazdy" ? "🏕️" : title === "Wydarzenia" ? "🧘" : null;

  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby={id}>
      <div className="flex flex-col gap-1">
        <h2
          id={id}
          className="flex items-center gap-2 text-[22px] font-semibold leading-[30px] text-[#222222]"
        >
          {emoji && (
            <span className="text-[22px] leading-none" aria-hidden="true">
              {emoji}
            </span>
          )}
          <span>{title}</span>
        </h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <InstructorEventCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function InstructorEventCard({ item }: { item: InstructorEventCardViewModel }) {
  const content = (
    <article
      className={cn(
        "flex h-[150px] w-full max-w-[366px] items-stretch gap-3 overflow-hidden md:max-w-none",
        item.href && !item.isDemo && "transition-opacity hover:opacity-90",
      )}
    >
      <div className="relative h-[150px] w-[150px] shrink-0 overflow-hidden rounded-2xl bg-[#F7F7F7]">
        {item.imageId ? (
          <WyImage
            src={item.imageId}
            alt={item.title}
            fill
            className="object-cover"
            sizes="150px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-[#B0B0B0]" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1">
        <div className="truncate text-m-header text-[#717171]">
          {item.dateLabel}
          {item.timeLabel ? `  ${item.timeLabel}` : ""}
        </div>

        <h3 className="mt-3 line-clamp-1 text-m-header font-semibold text-[#222222]">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-4 text-m-sunscript-font text-[#717171]">{item.excerpt}</p>

        <div className="mt-auto truncate text-right text-sub-descript-18 text-[#222222]">
          {item.priceLabel}
        </div>
      </div>
    </article>
  );

  if (!item.href || item.isDemo) {
    return content;
  }

  return (
    <Link href={item.href} className="block h-full">
      {content}
    </Link>
  );
}
