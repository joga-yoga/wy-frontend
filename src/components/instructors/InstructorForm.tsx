"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import React from "react";
import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const instructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  image: z.any().optional(),
});

export type InstructorFormData = z.infer<typeof instructorSchema>;

interface InstructorFormProps {
  form: UseFormReturn<InstructorFormData>; // Allow parent to control form
  onSubmit: (data: InstructorFormData) => Promise<void>;
  currentImageId?: string | null;
  imagePreviewUrl?: string | null;
  isUploadingImage?: boolean;
  newlyUploadedImageId?: string | null;
  removeCurrentImage?: boolean;
  onRemoveImage?: () => void;
}

export function InstructorForm({
  form,
  onSubmit,
  currentImageId,
  imagePreviewUrl,
  isUploadingImage,
  newlyUploadedImageId,
  removeCurrentImage,
  onRemoveImage,
}: InstructorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="instructor-name" className="block text-sm font-medium mb-1">
          Name *
        </label>
        <Input id="instructor-name" placeholder="Instructor Name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message?.toString()}</p>
        )}
      </div>
      <div>
        <label htmlFor="instructor-bio" className="block text-sm font-medium mb-1">
          Bio
        </label>
        <Textarea
          id="instructor-bio"
          placeholder="Brief description (optional)"
          {...register("bio")}
        />
        {errors.bio && (
          <p className="text-sm text-red-500 mt-1">{errors.bio.message?.toString()}</p>
        )}
      </div>
      <div>
        <label htmlFor="instructor-image" className="block text-sm font-medium mb-1">
          Profile Image
        </label>
        {/* Current Image Display - show if no new preview and not marked for removal */}
        {currentImageId && !imagePreviewUrl && !removeCurrentImage && (
          <div className="mb-2">
            <p className="text-xs text-gray-600 mb-1">Current Image:</p>
            <Image
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_100,h_100,c_fill/${currentImageId}`}
              alt="Current Instructor"
              width={100}
              height={100}
              className="rounded-md border object-cover"
            />
          </div>
        )}
        {/* New Image Preview */}
        {imagePreviewUrl && (
          <div className="mb-2">
            <p className="text-xs text-gray-600 mb-1">New Image Preview:</p>
            <Image
              src={imagePreviewUrl}
              alt="New image preview"
              width={100}
              height={100}
              className="rounded-md border object-cover"
            />
          </div>
        )}
        {/* Spacing adjustment, similar to organizer form might be needed if elements shift too much */}
        {(isUploadingImage || (currentImageId && !imagePreviewUrl && !removeCurrentImage)) && (
          <div className="mb-2" />
        )}
        <Input
          id="instructor-image"
          type="file"
          accept="image/*"
          {...register("image")}
          disabled={isUploadingImage}
          className="mb-2"
        />
        {errors.image && (
          <p className="text-sm text-red-500 mt-1">{errors.image.message?.toString()}</p>
        )}
        {isUploadingImage && <p className="text-sm text-blue-500">Uploading image...</p>}
        {!isUploadingImage && newlyUploadedImageId && (
          <p className="text-sm text-green-500">New image uploaded. Click Save Changes.</p>
        )}

        {/* Show remove button if there's a current image and it's not already marked for removal */}
        {currentImageId && !removeCurrentImage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemoveImage} // Use the passed handler
            disabled={isUploadingImage}
            className="mt-2"
          >
            Remove Current Image
          </Button>
        )}
        {removeCurrentImage && (
          <p className="text-sm text-orange-600 mt-1">Current image will be removed on save.</p>
        )}
        {!currentImageId && !imagePreviewUrl && !newlyUploadedImageId && (
          <p className="text-xs text-gray-500 mt-1">Optional image.</p>
        )}
      </div>
      {/* Submit button will be rendered by the parent Modal component */}
    </form>
  );
}
