"use client";

import { WyImage } from "@/components/custom/WyImage";

import type { StaticCompletedItem } from "./viewModel";

type CompletedItemsPreviewProps = {
  items: StaticCompletedItem[];
};

export function CompletedItemsPreview({ items }: CompletedItemsPreviewProps) {
  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby="completed-preview-title">
      <div className="flex flex-col gap-1">
        <h2
          id="completed-preview-title"
          className="text-[22px] font-semibold leading-[30px] text-[#222222]"
        >
          Zrealizowano
        </h2>
        <p className="text-[15px] leading-5 text-[#717171]">
          Krótki podgląd doświadczenia i aktywności nauczyciela.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="flex items-center gap-3 rounded-2xl bg-[#FAFAFA] p-3">
            <div className="relative h-[75px] w-[75px] shrink-0 overflow-hidden rounded-xl bg-[#F7F7F7] md:h-[92px] md:w-[92px]">
              <WyImage
                src={item.imageId}
                alt={item.title}
                fill
                className="object-cover grayscale"
                sizes="(min-width: 768px) 92px, 75px"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold leading-5 text-[#222222]">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-[14px] leading-5 text-[#717171]">
                {item.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
