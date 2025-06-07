import { Expand } from "lucide-react";
import Image from "next/image";
import React from "react";

import CustomGalleryIcon from "@/components/icons/CustomGalleryIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ImageGalleryProps {
  mainImageUrl: string;
  thumbnailUrls: string[];
  allImages: string[];
  title: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  mainImageUrl,
  thumbnailUrls,
  allImages,
  title,
}) => {
  return (
    <Dialog>
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-[22px]">
          {/* Main Image */}
          <div className="relative w-full h-auto aspect-[697/432]">
            <Image
              src={mainImageUrl}
              alt={title}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-l-[22px] rounded-r-[4px]"
              priority
            />
          </div>
          {/* Gallery Thumbnails */}
          <div className="grid grid-cols-2 gap-2">
            {thumbnailUrls.map((url, index) => (
              <div key={index} className="relative w-full h-auto">
                <Image
                  src={url}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  className={
                    index === 1
                      ? "rounded-tr-[22px] rounded-b-[4px]"
                      : index === 3
                        ? "rounded-br-[22px] rounded-t-[4px]"
                        : "rounded-[4px]"
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <DialogTrigger asChild>
          <Button
            className="absolute bottom-4 right-4 rounded-full"
            variant="secondary"
            size="icon"
          >
            <CustomGalleryIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[calc(100dvw-40px)] h-[calc(100dvh-40px)] overflow-y-auto w-full">
        <div>
          <DialogTitle className="DialogTitle">Zdjęcia</DialogTitle>
          <div className="flex flex-wrap gap-4 p-4 max-w-[800px] w-full mx-auto">
            {allImages.map((url, index) => {
              const isFullWidth = index % 3 === 0;
              const widthClass = isFullWidth ? "w-full" : "w-[calc(50%-0.5rem)]";
              const aspectClass = isFullWidth ? "aspect-video" : "aspect-square";

              return (
                <div key={index} className={`relative ${widthClass} ${aspectClass}`}>
                  <Image
                    src={url}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-lg"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
