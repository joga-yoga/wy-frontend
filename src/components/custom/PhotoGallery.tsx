"use client";

import "swiper/css";

import { ChevronLeft, ImageIcon, X } from "lucide-react";
import { motion, type Variants } from "motion/react";
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

const gridContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const gridTileVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: "easeOut" } },
};

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
              className="grid grid-cols-2 gap-1.5"
              variants={gridContainerVariants}
              initial="hidden"
              animate="show"
            >
              {images.map((image, i) => (
                <motion.button
                  key={`${image}-${i}`}
                  type="button"
                  onClick={() => {
                    setZoomedIndex(i);
                    setView("zoomed");
                  }}
                  variants={gridTileVariants}
                  whileTap={{ scale: 0.95 }}
                  className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <WyImage
                    src={image}
                    alt={`${alt} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center" data-base-ui-swipe-ignore="">
            <Swiper
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
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

const GRID_TILE_CORNER_CLASSES = [
  "rounded-tl-xl",
  "rounded-tr-xl",
  "rounded-bl-xl",
  "rounded-br-xl",
];

function PhotoGalleryGridPreview({
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
  const previewImages = images.slice(0, 4);

  if (previewImages.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-xl bg-gray-100 aspect-[4/4] md:aspect-[21/9]",
          className,
        )}
      >
        <ImageIcon className="h-12 w-12 text-gray-300" />
      </div>
    );
  }

  return (
    <motion.div
      className={cn("grid grid-cols-2 gap-1", className)}
      variants={gridContainerVariants}
      initial="hidden"
      animate="show"
    >
      {previewImages.map((image, i) => (
        <motion.button
          key={`${image}-${i}`}
          type="button"
          onClick={onOpen}
          variants={gridTileVariants}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative aspect-square cursor-pointer overflow-hidden bg-gray-100",
            GRID_TILE_CORNER_CLASSES[i],
          )}
        >
          <WyImage
            src={image}
            alt={`${alt} ${i + 1}`}
            fill
            fetchPriority={i === 0 ? "high" : undefined}
            className="object-cover"
            sizes="50vw"
          />
        </motion.button>
      ))}
    </motion.div>
  );
}

function PhotoGallerySwiperPreview({
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

  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden bg-gray-100 aspect-[4/4] md:aspect-[21/9]",
        className,
      )}
      onClick={() => images.length > 0 && onOpen()}
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
  );
}

export function PhotoGallery({
  images: rawImages,
  alt,
  variant = "swiper",
  className,
}: PhotoGalleryProps) {
  const images = dedupeImages(rawImages);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = () => setDrawerOpen(true);

  return (
    <>
      {variant === "grid" ? (
        <PhotoGalleryGridPreview
          images={images}
          alt={alt}
          className={className}
          onOpen={openDrawer}
        />
      ) : (
        <PhotoGallerySwiperPreview
          images={images}
          alt={alt}
          className={className}
          onOpen={openDrawer}
        />
      )}

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
