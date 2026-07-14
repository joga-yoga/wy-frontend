"use client";

import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";

import { WyImage } from "@/components/custom/WyImage";
import { cn } from "@/lib/utils";

export function PhotoGallerySwiperPreview({
  images,
  alt,
  className,
  onOpen,
}: {
  images: string[];
  alt: string;
  className?: string;
  onOpen: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden bg-gray-100 aspect-[4/4] md:aspect-[21/9]",
        className,
      )}
      onClick={() => images.length > 0 && onOpen()}
    >
      {images.length > 0 ? (
        <Swiper
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          className="h-full w-full"
        >
          {images.map((image, i) => (
            <SwiperSlide key={`${image}-${i}`}>
              <div className="relative h-full w-full">
                <WyImage
                  src={image}
                  alt={`${alt} ${i + 1}`}
                  fill
                  fetchPriority={i === 0 ? "high" : undefined}
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-12 w-12 text-gray-300" />
        </div>
      )}
      {images.length > 1 && (
        <>
          <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md bg-gray-800/80 px-2.5 py-1 text-xs font-semibold text-white">
            {activeIndex + 1}/{images.length}
          </div>
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                swiperRef.current?.slidePrev();
              }}
              aria-label="Poprzednie zdjęcie"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
          )}
          {activeIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                swiperRef.current?.slideNext();
              }}
              aria-label="Następne zdjęcie"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
