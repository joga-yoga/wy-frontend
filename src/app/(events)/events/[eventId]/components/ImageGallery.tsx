import React from "react";

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

  const columnClasses: { [key: number]: string } = {
    1: "w-1/1",
    2: "w-1/2",
    3: "w-1/3",
    4: "w-1/4",
    5: "w-1/5",
  };

  return (
    <Dialog>
      <div className="relative">
        {/* Desktop */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-3 mt-[22px] min-h-[340px]">
          {/* Main Image */}
          <DynamicCloudinaryImage
            imageId={image_ids[0]}
            alt={title}
            className="rounded-l-[22px] rounded-r-[4px] h-[340px]"
            priority
          />
          {/* Gallery Thumbnails */}
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, index) => (
              <DynamicCloudinaryImage
                key={index}
                imageId={image_ids[index + 1]}
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
            ))}
          </div>
        </div>
        {/* Mobile */}
        <div className="md:hidden grid grid-cols-2 gap-1 w-full pt-3 min-h-[236px]">
          {image_ids.slice(0, 4).map((id, index) => (
            <DynamicCloudinaryImage
              key={id}
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
          ))}
        </div>
        <DialogTrigger asChild>
          <Button
            className="absolute md:bottom-4 md:right-4 bottom-2 right-2 rounded-full"
            variant="secondary"
            size="icon"
          >
            <CustomGalleryIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[calc(100dvw-40px)] h-[calc(100dvh-40px)] overflow-y-auto w-full">
        <div>
          <DialogTitle className="pb-4">Zdjęcia</DialogTitle>
          <div className="flex flex-row w-full gap-3 xl:gap-4">
            {[...Array(columns)].map((_, columnIndex) => (
              <div
                key={columnIndex}
                className={cn("flex flex-col gap-3 xl:gap-4", columnClasses[columns])}
              >
                {image_ids.map((imageId, index) => {
                  if (index % columns === columnIndex) {
                    return (
                      <div key={index} className="relative w-full h-auto">
                        <DynamicCloudinaryImage
                          imageId={imageId}
                          alt={`Gallery image ${index + 1}`}
                          className="rounded-[16px] h-[100px]"
                          priority={index < 10}
                          style={{ width: "100%", height: "auto" }}
                        />
                      </div>
                    );
                  }
                })}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
