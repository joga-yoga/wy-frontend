import { Control, FieldErrors, UseFormRegister } from "react-hook-form";

import { EventFormData } from "@/lib/schemas/event";

import { ClassMetaSection } from "./ClassMetaSection";
import { EventDetailsSection } from "./EventDetailsSection";
import { EventImportantInfoSection } from "./EventImportantInfoSection";
import { EventPhotosSection } from "./EventPhotosSection";
import { EventPricingSection } from "./EventPricingSection";

interface ClassFormProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
  watchedImageIds: string[];
  handleRemoveImage: (imageId: string) => void;
  handleImageSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImage: boolean;
  directUploadError: string | null;
  pendingImages: File[];
  handleSetCover: (imageId: string) => void;
}

export const ClassForm = ({
  control,
  register,
  errors,
  watchedImageIds,
  handleRemoveImage,
  handleImageSelected,
  isUploadingImage,
  directUploadError,
  pendingImages,
  handleSetCover,
}: ClassFormProps) => {
  return (
    <>
      <EventDetailsSection
        project="workshops"
        control={control}
        register={register}
        errors={errors}
        includeMainAttractions={false}
      />
      <ClassMetaSection control={control} register={register} errors={errors} />
      <EventPricingSection
        control={control}
        register={register}
        errors={errors}
        includeLists={false}
      />
      <EventImportantInfoSection register={register} errors={errors} project="workshops" />
      <EventPhotosSection
        errors={errors}
        watchedImageIds={watchedImageIds}
        handleRemoveImage={handleRemoveImage}
        handleImageSelected={handleImageSelected}
        isUploadingImage={isUploadingImage}
        directUploadError={directUploadError}
        pendingImages={pendingImages}
        control={control}
        name="image_ids"
        handleSetCover={handleSetCover}
      />
    </>
  );
};
