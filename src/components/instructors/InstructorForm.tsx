"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import React from "react";
import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

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
  initialData?: Partial<InstructorFormData>;
}

export function InstructorForm({
  form,
  onSubmit,
  currentImageId,
  initialData,
}: InstructorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  // Reset form when initialData changes (e.g., when opening edit modal)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

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
        {currentImageId && (
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
        <Input id="instructor-image" type="file" accept="image/*" {...register("image")} />
        {errors.image && (
          <p className="text-sm text-red-500 mt-1">{errors.image.message?.toString()}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {currentImageId ? "Upload a new image to replace the current one." : "Optional image."}
        </p>
      </div>
      {/* Submit button will be rendered by the parent Modal component */}
    </form>
  );
}
