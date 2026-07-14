"use client";

import { ImageIcon } from "lucide-react";
import { motion } from "motion/react";

import { WyImage } from "@/components/custom/WyImage";
import { cn } from "@/lib/utils";

import { gridContainerVariants, gridTileVariants } from "./variants";

const GRID_TILE_CORNER_CLASSES = [
  "rounded-tl-xl",
  "rounded-tr-xl",
  "rounded-bl-xl",
  "rounded-br-xl",
];

const DESKTOP_THUMBNAIL_CORNER_CLASSES = [
  "rounded-tr-[22px] rounded-b-[4px]",
  "rounded-[4px]",
  "rounded-br-[22px] rounded-t-[4px]",
  "rounded-[4px]",
];

export function PhotoGalleryGridPreview({
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
  const desktopThumbnails = images.slice(1, 5);

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
    <>
      <motion.div
        className={cn("grid grid-cols-2 gap-1 md:hidden", className)}
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

      <motion.div
        className={cn("hidden md:grid md:grid-cols-2 md:gap-3", className)}
        variants={gridContainerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.button
          type="button"
          onClick={onOpen}
          variants={gridTileVariants}
          whileTap={{ scale: 0.98 }}
          className="relative aspect-[3/2] cursor-pointer overflow-hidden rounded-l-[22px] rounded-r-[4px] bg-gray-100"
        >
          <WyImage
            src={previewImages[0]}
            alt={`${alt} 1`}
            fill
            fetchPriority="high"
            className="object-cover"
            sizes="50vw"
          />
        </motion.button>
        <div className="grid grid-cols-2 gap-2">
          {desktopThumbnails.map((image, i) => (
            <motion.button
              key={`${image}-${i}`}
              type="button"
              onClick={onOpen}
              variants={gridTileVariants}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative cursor-pointer overflow-hidden bg-gray-100",
                DESKTOP_THUMBNAIL_CORNER_CLASSES[i],
              )}
            >
              <WyImage
                src={image}
                alt={`${alt} ${i + 2}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
