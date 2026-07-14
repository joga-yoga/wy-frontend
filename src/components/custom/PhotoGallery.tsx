"use client";

import "swiper/css";

import { ChevronLeft, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";

import { WyImage } from "@/components/custom/WyImage";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  images: (string | null | undefined)[] | null | undefined;
  alt: string;
  variant?: "swiper" | "grid";
  className?: string;
}

function dedupeImages(images: (string | null | undefined)[] | null | undefined): string[] {
  return Array.from(new Set(images?.filter((image): image is string => Boolean(image)) ?? []));
}

function PhotoGalleryDrawer({
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

  function handleOpenChange(next: boolean) {
    if (!next) setView("grid");
    onOpenChange(next);
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} snapPoints={[1]} showSwipeHandle>
      <DrawerContent>
        <DrawerTitle className="sr-only">Zdjęcia</DrawerTitle>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <DrawerClose aria-label="Zamknij" className="text-gray-900">
            <ChevronLeft className="h-6 w-6" />
          </DrawerClose>
          <span className="text-sm font-semibold text-gray-900">
            {view === "grid" ? `Zdjęcia · ${images.length}` : `${zoomedIndex + 1}/${images.length}`}
          </span>
          <div className="w-6" />
        </div>

        {view === "grid" ? (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-1.5">
              {images.map((image, i) => (
                <button
                  key={`${image}-${i}`}
                  type="button"
                  onClick={() => {
                    setZoomedIndex(i);
                    setView("zoomed");
                  }}
                  className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <WyImage
                    src={image}
                    alt={`${alt} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center">
            <Swiper
              initialSlide={zoomedIndex}
              onSwiper={(s) => (swiperRef.current = s)}
              onSlideChange={(s) => setZoomedIndex(s.activeIndex)}
              className="h-full w-full"
            >
              {images.map((image, i) => (
                <SwiperSlide key={`${image}-${i}`} className="flex items-center justify-center">
                  <div className="relative h-full w-full">
                    <WyImage
                      src={image}
                      alt={`${alt} ${i + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function PhotoGallery({
  images: rawImages,
  alt,
  variant = "swiper",
  className,
}: PhotoGalleryProps) {
  void variant; // "grid" not implemented yet — always renders the swiper view
  const images = dedupeImages(rawImages);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "relative cursor-pointer overflow-hidden bg-gray-100 aspect-[4/4] md:aspect-[21/9]",
          className,
        )}
        onClick={() => images.length > 0 && setDrawerOpen(true)}
      >
        {images.length > 0 ? (
          <Swiper onSlideChange={(s) => setActiveIndex(s.activeIndex)} className="h-full w-full">
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
          <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md bg-gray-800/80 px-2.5 py-1 text-xs font-semibold text-white">
            {activeIndex + 1}/{images.length}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <PhotoGalleryDrawer
          images={images}
          alt={alt}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </>
  );
}
