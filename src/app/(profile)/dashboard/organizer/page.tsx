"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image"; // Import next/image
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.any().optional(), // For the file input, RHF will manage FileList
});

type FormData = z.infer<typeof schema>;

export default function OrganizerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [newlyUploadedImageId, setNewlyUploadedImageId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const imageFile = watch("image");

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/organizer/me")
      .then((res) => {
        setValue("name", res.data.name || ""); // Ensure name is not null
        setValue("description", res.data.description || "");
        setCurrentImageId(res.data.image_id || null);
        setRemoveCurrentImage(false); // Reset remove flag on load
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          toast({
            title: "Not an Organizer",
            description: "Create an organizer profile first.",
            variant: "destructive",
          });
          router.push("/become-organizer");
        } else {
          toast({ description: "Failed to load organizer profile.", variant: "destructive" });
          router.push("/dashboard");
        }
      })
      .finally(() => setLoading(false));
  }, [setValue, toast, router]);

  useEffect(() => {
    const file = imageFile?.[0];
    if (file instanceof File) {
      const currentPreview = imagePreviewUrl;
      const newPreview = URL.createObjectURL(file);
      setImagePreviewUrl(newPreview);
      setNewlyUploadedImageId(null); // Clear any previously uploaded new image ID, as a new file is selected
      setRemoveCurrentImage(false); // If user selects a new file, they don't intend to remove without replacement
      handleImageUpload(file);
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
    } else if (!file && imagePreviewUrl) {
      // File cleared from input
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setNewlyUploadedImageId(null); // Clear new image ID if selection is cleared
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  async function handleImageUpload(file: File) {
    setIsUploadingImage(true);
    const imageFormData = new FormData();
    imageFormData.append("image", file);
    try {
      const response = await axiosInstance.post("/organizer/image-upload", imageFormData);
      setNewlyUploadedImageId(response.data.image_id);
      toast({ description: "New image uploaded successfully. Save changes to apply." });
    } catch (err: any) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
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
  }

  function handleRemoveImageClick() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setValue("image", null); // Clear the file input
    setNewlyUploadedImageId(null); // No new image will be uploaded
    setRemoveCurrentImage(true); // Mark that current image should be removed
    toast({ description: "Current image will be removed on save." });
  }

  async function onSubmit(data: FormData) {
    const payload: { name?: string; description?: string; image_id?: string | null } = {};

    // Only add fields to payload if they have changed or are being explicitly set.
    // For strings, we might want to compare with initial values if we want to send only diffs.
    // For simplicity here, we send them if they are part of the form data.
    payload.name = data.name;
    payload.description = data.description; // Will be empty string if cleared, or undefined if optional and not touched

    if (newlyUploadedImageId) {
      payload.image_id = newlyUploadedImageId;
    } else if (removeCurrentImage) {
      payload.image_id = null; // Signal to backend to remove the image
    }
    // If neither newlyUploadedImageId is set nor removeCurrentImage is true, image_id is not sent,
    // so backend should not change the existing image.

    if (Object.keys(payload).length === 0 && !newlyUploadedImageId && !removeCurrentImage) {
      toast({ description: "No changes to submit." });
      return;
    }

    try {
      const response = await axiosInstance.put("/organizer", payload);
      toast({ description: "Profile updated successfully!" });
      setCurrentImageId(response.data.image_id || null); // Update current image from response
      setNewlyUploadedImageId(null); // Reset after successful save
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null); // Clear preview
      setValue("image", null); // Clear file input
      setRemoveCurrentImage(false); // Reset remove flag
    } catch (error: any) {
      toast({
        description: `Update failed: ${error?.response?.data?.detail || error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  }

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="p-6">
      <DashboardHeader
        title="Organizer Profile"
        onUpdate={handleSubmit(onSubmit)}
        updateLabel={isSubmitting || isUploadingImage ? "Saving..." : "Save Changes"}
        isSubmitting={isSubmitting || isUploadingImage} // Disable button during upload too
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mx-auto max-w-xl mt-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name *
          </label>
          <Input id="name" placeholder="Organizer Name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message?.toString()}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Tell us about your organization"
            {...register("description")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Profile Image</label>
          {/* Current Image Display */}
          {currentImageId && !imagePreviewUrl && !removeCurrentImage && (
            <div className="mb-2">
              <p className="text-xs text-gray-600 mb-1">Current Image:</p>
              <Image
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${currentImageId}`}
                alt="Current Organizer Profile"
                width={150}
                height={150}
                className="rounded-md border object-cover"
                onError={() => setCurrentImageId(null)}
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
                width={150}
                height={150}
                className="rounded-md border object-cover"
              />
            </div>
          )}
          {(isUploadingImage || (currentImageId && !imagePreviewUrl && !removeCurrentImage)) && (
            <div className="mb-2" />
          )}{" "}
          {/* Spacing adjustment */}
          <Input
            id="image"
            type="file"
            accept="image/*"
            {...register("image")}
            disabled={isUploadingImage}
            className="mb-2"
          />
          {isUploadingImage && <p className="text-sm text-blue-500">Uploading image...</p>}
          {!isUploadingImage && newlyUploadedImageId && (
            <p className="text-sm text-green-500">New image uploaded. Click Save Changes.</p>
          )}
          {currentImageId && !removeCurrentImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImageClick}
              disabled={isUploadingImage}
              className="mt-2"
            >
              Remove Current Image
            </Button>
          )}
          {removeCurrentImage && (
            <p className="text-sm text-orange-600 mt-1">Current image will be removed on save.</p>
          )}
        </div>
      </form>
    </div>
  );
}
