import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
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
  bio: string;
  image_id: string;
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
  const [currentImageId, setCurrentImageId] = useState<string | null>(
    initialInstructor?.image_id || null,
  );

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
    formState: { isSubmitting },
  } = form;

  // Reset form and image when initialInstructor changes or modal closes
  useEffect(() => {
    if (isOpen) {
      const defaultVals = {
        name: initialInstructor?.name || "",
        bio: initialInstructor?.bio || "",
        image: undefined,
      };
      reset(defaultVals);
      setCurrentImageId(initialInstructor?.image_id || null);
    } else {
      // Optional: Delay reset slightly to avoid visual flicker on close
      // setTimeout(() => {
      //   reset({ name: "", bio: "", image: undefined });
      //   setCurrentImageId(null);
      // }, 150);
    }
  }, [initialInstructor, isOpen, reset]);

  async function onSubmit(data: InstructorFormData) {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.bio) formData.append("bio", data.bio);
    if (data.image?.[0]) formData.append("image", data.image[0]);

    const url = initialInstructor ? `/instructors/${initialInstructor.id}` : "/instructors";
    const method = initialInstructor ? "put" : "post";
    const successMessage = initialInstructor ? "Instructor updated!" : "Instructor created!";
    const errorMessage = initialInstructor
      ? "Failed to update instructor"
      : "Failed to create instructor";

    try {
      const response = await axiosInstance({
        method,
        url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({ description: successMessage });
      onInstructorSaved(response.data); // Pass saved instructor back
      onClose(); // Close modal on success
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
          // No need to pass initialData here, form handles it via defaultValues/reset
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit" // Connects to the form inside InstructorForm
            onClick={handleSubmit(onSubmit)} // Trigger form submission
            disabled={isSubmitting}
          >
            {isSubmitting
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
