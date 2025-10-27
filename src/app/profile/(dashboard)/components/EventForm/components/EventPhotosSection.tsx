import { Loader2, Plus, Star, StarOff, Trash2 } from "lucide-react";
import Image from "next/image";
import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { IoStar, IoStarOutline } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EventFormData } from "@/lib/schemas/event";

import { useEventHelpBar } from "../contexts/EventHelpBarContext";
import { EventHelpBarTipButton } from "./EventHelpBar";

interface EventPhotosSectionProps {
  errors: FieldErrors<EventFormData>;
  watchedImageIds: string[];
  handleRemoveImage: (imageId: string) => void;
  handleImageSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImage: boolean;
  directUploadError: string | null;
  pendingImages: File[];
  control: Control<EventFormData>;
  name: string;
  handleSetCover: (imageId: string) => void;
}

export const EventPhotosSection = ({
  errors,
  watchedImageIds,
  handleRemoveImage,
  handleImageSelected,
  isUploadingImage,
  directUploadError,
  pendingImages,
  control,
  name,
  handleSetCover,
}: EventPhotosSectionProps) => {
  const { focusTip } = useEventHelpBar();
  return (
    <div className="space-y-2 event-form-section-padding" id="event-photos-section">
      <div className="flex items-center gap-2">
        <Label htmlFor="images" size="event">
          Zdjęcia
        </Label>
        <EventHelpBarTipButton tipId="images" />
      </div>
      <Label htmlFor="images" size="event-description">
        Dodaj zdjęcia, które pomogą uczestnikom zrozumieć, co ich czeka
      </Label>
      <Separator className="my-4 md:my-8" />
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {watchedImageIds.map((imageId, index) => (
          <div key={imageId} className="relative group aspect-[4/3]">
            <Image
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_200,h_150/v1/${imageId}`}
              alt="Zdjęcie"
              fill
              className="rounded border object-cover"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={index === 0}
                  className={`absolute top-1 left-1 transition-opacity p-1 h-auto disabled:opacity-100 ${index === 0 ? "text-brand-green opacity-100" : "md:opacity-0 group-hover:opacity-100"}`}
                  onClick={() => index !== 0 && handleSetCover(imageId)}
                  aria-label={index === 0 ? "Okładka" : "Ustaw jako okładkę"}
                >
                  {index === 0 ? <IoStar size={14} /> : <IoStarOutline size={14} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>
                {index === 0 ? "Okładka" : "Ustaw jako okładkę"}
              </TooltipContent>
            </Tooltip>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 group-hover:opacity-100 transition-opacity p-1 h-auto md:opacity-0"
              onClick={() => handleRemoveImage(imageId)}
              aria-label="Usuń zdjęcie"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        {pendingImages.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="relative aspect-[4/3] rounded border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center"
          >
            <Image
              src={URL.createObjectURL(file)}
              alt="Podgląd zdjęcia"
              fill
              className="object-cover rounded"
              onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          </div>
        ))}
        <label
          htmlFor="image-upload-input"
          className="aspect-[4/3] rounded border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors"
          onFocus={() => focusTip("images")}
        >
          {isUploadingImage ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <Plus className="h-8 w-8" />
              <span className="mt-2 text-sm text-center">
                {watchedImageIds.length > 0 ? "Dodaj kolejne" : "Dodaj zdjęcia"}
              </span>
            </>
          )}
        </label>
        <Input
          id="image-upload-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelected}
          disabled={isUploadingImage}
          className="hidden"
        />
      </div>
      <div className="space-y-1">
        {isUploadingImage && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Przesyłanie zdjęcia...
          </div>
        )}
        {directUploadError && <p className="text-sm text-destructive">{directUploadError}</p>}
        {errors.image_ids && <p className="text-sm text-destructive">{errors.image_ids.message}</p>}
      </div>
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <div
            ref={field.ref}
            tabIndex={-1}
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
          />
        )}
      />
    </div>
  );
};
