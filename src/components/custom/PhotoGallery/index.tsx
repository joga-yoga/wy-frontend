"use client";

import "swiper/css";

import { useState } from "react";

import { PhotoGalleryDrawer } from "./PhotoGalleryDrawer";
import { PhotoGalleryGridPreview } from "./PhotoGalleryGridPreview";
import { PhotoGallerySwiperPreview } from "./PhotoGallerySwiperPreview";

interface PhotoGalleryProps {
  images: (string | null | undefined)[] | null | undefined;
  alt: string;
  variant?: "swiper" | "grid";
  className?: string;
}

function dedupeImages(images: (string | null | undefined)[] | null | undefined): string[] {
  return Array.from(new Set(images?.filter((image): image is string => Boolean(image)) ?? []));
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
