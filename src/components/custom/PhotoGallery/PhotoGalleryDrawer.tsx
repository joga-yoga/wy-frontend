"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";

import { DynamicCloudinaryImage } from "@/components/custom/DynamicCloudinaryImage";
import { WyImage } from "@/components/custom/WyImage";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import useWindowWidth from "@/hooks/useWindowWidth";

import { gridContainerVariants, gridTileVariants } from "./variants";

function useMasonryColumns(imageCount: number) {
  const windowWidth = useWindowWidth();

  return useMemo(() => {
    if (imageCount === 0) return 0;
    let responsive = 1;
    if (windowWidth > 1920) responsive = 5;
    else if (windowWidth > 1200) responsive = 4;
    else if (windowWidth > 950) responsive = 3;
    else if (windowWidth > 768) responsive = 2;
    return Math.min(responsive, imageCount);
  }, [windowWidth, imageCount]);
}

export function PhotoGalleryDrawer({
  images,
  alt,
  open,
  onOpenChange,
}: {
  images: string[];
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [view, setView] = useState<"grid" | "zoomed">("grid");
  const [zoomedIndex, setZoomedIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const columns = useMasonryColumns(images.length);

  function handleOpenChange(next: boolean) {
    if (!next) setView("grid");
    onOpenChange(next);
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} snapPoints={[1]} showSwipeHandle>
      <DrawerContent>
        <DrawerTitle className="sr-only">Zdjęcia</DrawerTitle>
        <div className="flex items-center justify-between border-b px-4 py-3">
          {view === "zoomed" ? (
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Wróć do siatki zdjęć"
              className="text-gray-900"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <div className="w-6" />
          )}
          <span className="text-sm font-semibold text-gray-900">
            {view === "grid" ? `Zdjęcia · ${images.length}` : `${zoomedIndex + 1}/${images.length}`}
          </span>
          <DrawerClose aria-label="Zamknij" className="text-gray-900">
            <X className="h-6 w-6" />
          </DrawerClose>
        </div>

        {view === "grid" ? (
          <div className="flex-1 overflow-y-auto p-2">
            <motion.div
              className="flex flex-row gap-1.5"
              variants={gridContainerVariants}
              initial="hidden"
              animate="show"
            >
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <div key={columnIndex} className="flex flex-1 flex-col gap-1.5">
                  {images.map((image, i) =>
                    i % columns === columnIndex ? (
                      <motion.button
                        key={`${image}-${i}`}
                        type="button"
                        onClick={() => {
                          setZoomedIndex(i);
                          setView("zoomed");
                        }}
                        variants={gridTileVariants}
                        whileTap={{ scale: 0.95 }}
                        className="relative w-full overflow-hidden rounded-lg bg-gray-100"
                      >
                        <DynamicCloudinaryImage
                          imageId={image}
                          alt={`${alt} ${i + 1}`}
                          width={0}
                          height={0}
                          sizes="33vw"
                          className="rounded-lg"
                        />
                      </motion.button>
                    ) : null,
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1 items-center" data-base-ui-swipe-ignore="">
            <Swiper
              modules={[Keyboard]}
              keyboard={{ enabled: true }}
              initialSlide={zoomedIndex}
              onSwiper={(s) => (swiperRef.current = s)}
              onSlideChange={(s) => setZoomedIndex(s.activeIndex)}
              className="h-full w-full"
            >
              {images.map((image, i) => (
                <SwiperSlide key={`${image}-${i}`} className="flex items-center justify-center">
                  <motion.div
                    className="relative h-full w-full"
                    animate={{
                      scale: i === zoomedIndex ? 1 : 0.94,
                      opacity: i === zoomedIndex ? 1 : 0.6,
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <WyImage
                      src={image}
                      alt={`${alt} ${i + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
            {zoomedIndex > 0 && (
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label="Poprzednie zdjęcie"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
            )}
            {zoomedIndex < images.length - 1 && (
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                aria-label="Następne zdjęcie"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
