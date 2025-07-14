import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { InstructorForm, InstructorFormData, instructorSchema } from "./InstructorForm";

// Export the Instructor type so it can be shared
export interface Instructor {
  id: string;
  name: string;
  bio?: string | null; // Optional bio
  image_id: string | null; // image_id can be string or null if no image
  // Add other relevant fields like contact, expertise, etc.
}

interface InstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstructorSaved: (instructor: Instructor) => void;
  initialInstructor?: Instructor | null; // Pass instructor data for editing
}

export function InstructorModal({
  isOpen,
  onClose,
  onInstructorSaved,
  initialInstructor,
}: InstructorModalProps) {
  const { toast } = useToast();
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [newlyUploadedImageId, setNewlyUploadedImageId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const form = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: initialInstructor?.name || "",
      bio: initialInstructor?.bio || "",
      image: undefined,
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = form;

  const imageFile = watch("image");

  const handleImageUpload = useCallback(
    async (file: File) => {
      setIsUploadingImage(true);
      const imageFormData = new FormData();
      imageFormData.append("image", file);
      let newPreviewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(newPreviewUrl);
      setNewlyUploadedImageId(null);
      setRemoveCurrentImage(false);

      try {
        const response = await axiosInstance.post("/instructors/image-upload", imageFormData);
        setNewlyUploadedImageId(response.data.image_id);
        toast({ description: "New image uploaded. Save changes to apply." });
      } catch (err: any) {
        if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl);
        setImagePreviewUrl(null);
        setNewlyUploadedImageId(null);
        setValue("image", null); // Clear RHF image state
        toast({
          title: "Image Upload Failed",
          description: err.response?.data?.detail || "Could not upload image.",
          variant: "destructive",
        });
      } finally {
        setIsUploadingImage(false);
      }
    },
    [toast, setValue],
  );

  useEffect(() => {
    const file = imageFile?.[0];
    if (file instanceof File) {
      handleImageUpload(file);
    }
  }, [imageFile, handleImageUpload]);

  // Effect to cleanup preview URL on unmount or when a new one is created
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Reset form and image states when initialInstructor changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const defaultVals = {
        name: initialInstructor?.name || "",
        bio: initialInstructor?.bio || "",
        image: undefined, // RHF image field
      };
      reset(defaultVals);
      setCurrentImageId(initialInstructor?.image_id || null);
      setNewlyUploadedImageId(null);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(null);
      setRemoveCurrentImage(false);
      setIsUploadingImage(false);
    }
  }, [initialInstructor, isOpen, reset]);

  function handleRemoveImageClick() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setValue("image", null); // Clear the file input in RHF
    setNewlyUploadedImageId(null); // No new image will be uploaded
    setRemoveCurrentImage(true); // Mark that current image should be removed
    toast({ description: "Image removed. Save changes to confirm." });
  }

  async function onSubmit(data: InstructorFormData) {
    const payload: { name: string; bio?: string; image_id?: string | null } = {
      name: data.name,
    };
    if (data.bio) payload.bio = data.bio;

    if (newlyUploadedImageId) {
      payload.image_id = newlyUploadedImageId;
    } else if (removeCurrentImage) {
      payload.image_id = null; // Signal to backend to remove the image
    }
    // If neither newlyUploadedImageId is set nor removeCurrentImage is true,
    // image_id is not sent, so backend should not change the existing image
    // unless initialInstructor had no image_id, in which case it remains null/undefined.

    const url = initialInstructor ? `/instructors/${initialInstructor.id}` : "/instructors";
    const method = initialInstructor ? "put" : "post";
    const successMessage = initialInstructor ? "Instructor updated!" : "Instructor created!";
    const errorMessage = initialInstructor
      ? "Failed to update instructor"
      : "Failed to create instructor";

    // Prevent submission if an image is uploading but not yet finished
    if (isUploadingImage) {
      toast({ description: "Please wait for the image to finish uploading.", variant: "default" });
      return;
    }

    try {
      const response = await axiosInstance({
        method,
        url,
        data: payload, // Send JSON payload
        headers: { "Content-Type": "application/json" }, // Set content type to JSON
      });
      toast({ description: successMessage });
      onInstructorSaved(response.data);
      onClose();
      // Reset states after successful save
      setCurrentImageId(response.data.image_id || null);
      setNewlyUploadedImageId(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setValue("image", null);
      setRemoveCurrentImage(false);
    } catch (error: any) {
      toast({
        description: `${errorMessage}: ${error?.response?.data?.detail || error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  }

  const handleModalChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialInstructor ? "Edit Instructor" : "Create New Instructor"}
          </DialogTitle>
          <DialogDescription>
            {initialInstructor
              ? "Update the details for this instructor."
              : "Fill in the details for the new instructor."}
          </DialogDescription>
        </DialogHeader>

        <InstructorForm
          form={form}
          onSubmit={onSubmit}
          currentImageId={currentImageId}
          imagePreviewUrl={imagePreviewUrl}
          isUploadingImage={isUploadingImage}
          newlyUploadedImageId={newlyUploadedImageId}
          removeCurrentImage={removeCurrentImage}
          onRemoveImage={handleRemoveImageClick}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting || isUploadingImage}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isUploadingImage}
          >
            {isSubmitting || isUploadingImage
              ? initialInstructor
                ? "Saving..."
                : "Creating..."
              : initialInstructor
                ? "Save Changes"
                : "Create Instructor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
