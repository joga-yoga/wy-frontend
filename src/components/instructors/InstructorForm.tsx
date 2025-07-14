"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const instructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  image: z.any().optional(),
});

export type InstructorFormData = z.infer<typeof instructorSchema>;

interface InstructorFormProps {
  form: UseFormReturn<InstructorFormData>;
  onSubmit: (data: InstructorFormData) => void;
  currentImageId?: string | null;
  imagePreviewUrl?: string | null;
  isUploadingImage: boolean;
  newlyUploadedImageId?: string | null;
  removeCurrentImage?: boolean;
  onRemoveImage: () => void;
}

export function InstructorForm({
  form,
  onSubmit,
  currentImageId,
  imagePreviewUrl,
  isUploadingImage,
  onRemoveImage,
  removeCurrentImage,
}: InstructorFormProps) {
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter instructor's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about the instructor"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>Instructor Image</FormLabel>
              <SingleImageUpload
                name="image"
                control={form.control}
                existingImageId={currentImageId}
                imagePreviewUrl={imagePreviewUrl}
                isUploading={isUploadingImage}
                onRemove={onRemoveImage}
                disabled={isSubmitting}
                isRemoved={removeCurrentImage}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
