"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

type FormData = {
  name: string;
  image?: FileList | null;
};

/**
 * Avatar + name + read-only email — the one profile screen shared by B2C and B2B
 * (spec: partner-profile-consolidation). Route wrappers supply the surrounding chrome;
 * this component owns only the form.
 */
export function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [newlyUploadedImageId, setNewlyUploadedImageId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const form = useForm<FormData>({
    defaultValues: { name: "", image: undefined },
  });
  const {
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { isSubmitting },
  } = form;
  const imageFile = watch("image");

  useEffect(() => {
    if (!user) return;
    setValue("name", user.name || "");
    setCurrentImageId(user.image_id || null);
  }, [user, setValue]);

  useEffect(() => {
    const file = imageFile?.[0];
    if (file) {
      handleImageUpload(file);
      const preview = URL.createObjectURL(file);
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return preview;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  async function handleImageUpload(file: File) {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axiosInstance.post("/me/image-upload", formData);
      setNewlyUploadedImageId(response.data.image_id);
      setRemoveCurrentImage(false);
    } catch (err: any) {
      setImagePreviewUrl(null);
      setNewlyUploadedImageId(null);
      setValue("image", null);
      toast({
        title: "Przesyłanie zdjęcia nie powiodło się",
        description: err.response?.data?.detail || "Nie można przesłać obrazu.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleRemoveImageClick() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setValue("image", null);
    setNewlyUploadedImageId(null);
    setRemoveCurrentImage(true);
  }

  async function onSubmit(data: FormData) {
    const payload: { name?: string; image_id?: string | null } = { name: data.name };
    if (newlyUploadedImageId) {
      payload.image_id = newlyUploadedImageId;
    } else if (removeCurrentImage) {
      payload.image_id = null;
    }

    try {
      await axiosInstance.patch("/me", payload);
      await refreshUser();
      toast({ description: "Profil zaktualizowany." });
      setNewlyUploadedImageId(null);
      setRemoveCurrentImage(false);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setValue("image", null);
    } catch (error: any) {
      toast({
        description: `Aktualizacja nie powiodła się: ${error?.response?.data?.detail || error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  }

  if (!user) return null;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-md space-y-6 px-4 py-6">
        <FormField
          control={control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>Zdjęcie profilowe</FormLabel>
              <SingleImageUpload
                name="image"
                control={control}
                existingImageId={currentImageId}
                imagePreviewUrl={imagePreviewUrl}
                isUploading={isUploadingImage}
                onRemove={handleRemoveImageClick}
                disabled={isSubmitting}
                isRemoved={removeCurrentImage}
                placeholderClassName="rounded-full"
                previewClassName="rounded-full"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imię</FormLabel>
              <FormControl>
                <Input placeholder="Twoje imię" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="profile-email">E-mail</Label>
          <Input id="profile-email" value={user.email} disabled readOnly />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || isUploadingImage}>
          {isSubmitting || isUploadingImage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Zapisz"
          )}
        </Button>
      </form>
    </Form>
  );
}
