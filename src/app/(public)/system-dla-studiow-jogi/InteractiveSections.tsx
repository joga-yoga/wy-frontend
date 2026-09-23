"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { faqItems, type ScheduleAudience, scheduleContent } from "./marketing-data";

const scheduleOrder: ScheduleAudience[] = ["studio", "participant"];

export function ScheduleTabs() {
  const [audience, setAudience] = useState<ScheduleAudience>("participant");
  const content = scheduleContent[audience];

  return (
    <section className="section-shell" aria-labelledby="schedule-heading">
      <div
        className="mx-auto grid w-full max-w-[323px] grid-cols-2 gap-1 border-b border-gray-300 md:max-w-lg"
        role="tablist"
        aria-label="Widok grafiku i rezerwacji"
      >
        {scheduleOrder.map((value) => {
          const isActive = audience === value;
          return (
            <button
              key={value}
              id={`schedule-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="schedule-panel"
              tabIndex={isActive ? 0 : -1}
              className={cn(
                "relative h-10 px-4 text-[15px] font-medium text-black outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-2",
                isActive &&
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-gray-600",
              )}
              onClick={() => setAudience(value)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                const next = value === "studio" ? "participant" : "studio";
                setAudience(next);
                document.getElementById(`schedule-tab-${next}`)?.focus();
              }}
            >
              {scheduleContent[value].tabLabel}
            </button>
          );
        })}
      </div>
      <div
        id="schedule-panel"
        role="tabpanel"
        aria-labelledby={`schedule-tab-${audience}`}
        className="mt-5 md:grid md:grid-cols-[1fr_360px] md:items-center md:gap-14"
      >
        <div>
          <h2 id="schedule-heading" className="section-heading">
            {content.heading}
          </h2>
          <p className="section-lead mt-2.5">{content.description}</p>
        </div>
        <div className="mt-5 flex justify-center md:mt-0">
          <Image
            src={content.image}
            alt={content.imageAlt}
            width={280}
            height={576}
            className="h-auto w-[280px]"
          />
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set([0]));

  const toggleItem = (index: number) => {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <section className="section-shell" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="section-heading">
        Pytania i odpowiedzi
      </h2>
      <div className="mt-0">
        {faqItems.map((item, index) => {
          const isOpen = openItems.has(index);
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;
          return (
            <article key={`${item.question}-${index}`} className="border-b border-gray-200">
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex min-h-11 w-full items-start justify-between gap-3 py-4 text-left text-[18px] font-medium leading-[26px] tracking-[-0.18px] text-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-inset"
                  onClick={() => toggleItem(index)}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!isOpen}
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-[22px] pb-4 text-[15px] leading-[22px] text-gray-500">
                    {item.answer.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
