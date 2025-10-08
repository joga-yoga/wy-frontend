import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { useCallback, useState } from "react";

import { DynamicCloudinaryImage } from "@/components/custom/DynamicCloudinaryImage";
import CustomGalleryIcon from "@/components/icons/CustomGalleryIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import useWindowWidth from "@/hooks/useWindowWidth";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  image_ids: string[];
  title: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ image_ids, title }) => {
  const windowWidth = useWindowWidth();
  const [columns, setColumns] = React.useState(2);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");
  const [activeIndex, setActiveIndex] = useState(0);

  const openGrid = () => {
    setViewMode("grid");
    setIsFullScreen(true);
  };

  const openSingleAt = (index: number) => {
    setActiveIndex(index);
    setViewMode("single");
    setIsFullScreen(true);
  };

  const showPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + image_ids.length) % image_ids.length);
  }, [image_ids.length]);

  const showNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % image_ids.length);
  }, [image_ids.length]);

  React.useEffect(() => {
    if (image_ids.length === 0) {
      setColumns(0);
      return;
    }

    let responsiveColumns = 1;
    if (windowWidth > 1920) {
      responsiveColumns = 5;
    } else if (windowWidth > 1200) {
      responsiveColumns = 4;
    } else if (windowWidth > 950) {
      responsiveColumns = 3;
    } else if (windowWidth > 768) {
      responsiveColumns = 2;
    } else {
      responsiveColumns = 1;
    }

    setColumns(Math.min(responsiveColumns, image_ids.length));
  }, [windowWidth, image_ids.length]);

  React.useEffect(() => {
    if (!isFullScreen || viewMode !== "single") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "g") setViewMode("grid");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullScreen, viewMode, showPrev, showNext]);

  const columnClasses: { [key: number]: string } = {
    1: "w-1/1",
    2: "w-1/2",
    3: "w-1/3",
    4: "w-1/4",
    5: "w-1/5",
  };

  return (
    <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
      <div className="relative">
        {/* Desktop */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-3 mt-[22px] min-h-[340px]">
          {/* Main Image */}
          <DynamicCloudinaryImage
            imageId={image_ids[0]}
            alt={title}
            className="rounded-l-[22px] rounded-r-[4px] h-[340px]"
            priority
            containerClass="cursor-pointer"
            onClick={() => openSingleAt(0)}
          />
          {/* Gallery Thumbnails */}
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, index) => (
              <DynamicCloudinaryImage
                key={index}
                imageId={image_ids[index + 1]}
                alt={`Gallery image ${index + 1}`}
                fill
                className={cn(
                  "object-cover",
                  index === 1
                    ? "rounded-tr-[22px] rounded-b-[4px]"
                    : index === 3
                      ? "rounded-br-[22px] rounded-t-[4px]"
                      : "rounded-[4px]",
                )}
                containerClass="cursor-pointer"
                onClick={() => openSingleAt(index + 1)}
              />
            ))}
          </div>
        </div>
        {/* Mobile */}
        <div className="md:hidden grid grid-cols-2 gap-1 w-full pt-3 min-h-[236px]">
          {image_ids.slice(0, 4).map((id, index) => (
            <button key={id} onClick={() => openSingleAt(index)} className="w-full">
              <DynamicCloudinaryImage
                imageId={id}
                alt={title}
                className={cn(
                  "w-full object-cover max-h-[110px] rounded-[4px]",
                  index === 0 && "rounded-tl-[11px]",
                  index === 1 && "rounded-tr-[11px]",
                  index === 2 && "rounded-bl-[11px]",
                  index === 3 && "rounded-br-[11px]",
                )}
                priority
                containerClass="w-full"
              />
            </button>
          ))}
        </div>
        <DialogTrigger asChild>
          <Button
            className="absolute md:bottom-4 md:right-4 bottom-2 right-2 rounded-full"
            variant="secondary"
            size="icon"
            onClick={openGrid}
          >
            <CustomGalleryIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent
        className={cn(
          "h-full md:h-[calc(100dvh-40px)] w-full max-w-full md:max-w-[calc(100dvw-40px)] rounded-none md:rounded-lg flex flex-col",
          viewMode === "single" ? "overflow-hidden p-0 md:p-4" : "overflow-y-scroll p-4 pb-10",
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          className={cn(
            "flex items-center py-2 px-2 min-h-[52px]",
            viewMode === "single" ? "justify-between" : "justify-center",
          )}
        >
          {viewMode === "single" && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-full"
            >
              <CustomGalleryIcon className="h-4 w-4" />
            </Button>
          )}
          <DialogTitle className="pb-0 text-md font-normal text-gray-600">
            {viewMode === "single" ? `${activeIndex + 1} / ${image_ids.length}` : "Zdjęcia"}
          </DialogTitle>
          {viewMode === "single" && <div className="min-w-8 min-h-8" />}
        </div>

        {viewMode === "grid" && (
          <div className="flex flex-row w-full gap-3 xl:gap-4">
            {[...Array(columns)].map((_, columnIndex) => (
              <div
                key={columnIndex}
                className={cn("flex flex-col gap-3 xl:gap-4", columnClasses[columns])}
              >
                {image_ids.map((imageId, index) => {
                  if (index % columns === columnIndex) {
                    return (
                      <button
                        key={index}
                        className="relative w-full h-auto"
                        onClick={() => openSingleAt(index)}
                      >
                        <DynamicCloudinaryImage
                          imageId={imageId}
                          alt={`Gallery image ${index + 1}`}
                          className="rounded-[16px] h-[100px]"
                          priority={index < 10}
                          style={{ width: "100%", height: "auto" }}
                        />
                      </button>
                    );
                  }
                })}
              </div>
            ))}
          </div>
        )}

        {viewMode === "single" && (
          <div className="relative w-full flex-1 flex items-center justify-center">
            <div className="relative w-full h-[75dvh] md:h-[80dvh]">
              <DynamicCloudinaryImage
                imageId={image_ids[activeIndex]}
                alt={`Gallery image ${activeIndex + 1}`}
                // fill
                className="rounded-[16px] object-contain max-w-full max-h-full h-auto w-full relative"
                containerClass="h-full flex justify-center items-center"
              />
            </div>

            {image_ids.length > 1 && (
              <>
                <button
                  onClick={showPrev}
                  className="absolute top-1/2 left-3 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                  aria-label="Previous"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-700" />
                </button>
                <button
                  onClick={showNext}
                  className="absolute top-1/2 right-3 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                  aria-label="Next"
                >
                  <ArrowRight className="h-6 w-6 text-gray-700" />
                </button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
