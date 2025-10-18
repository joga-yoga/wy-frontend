"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
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
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const schema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  image: z.any().optional(),
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      image: undefined,
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { isSubmitting },
  } = form;

  const imageFile = watch("image");

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/organizer/me")
      .then((res) => {
        setValue("name", res.data.name || "");
        setValue("description", res.data.description || "");
        setCurrentImageId(res.data.image_id || null);
        setRemoveCurrentImage(false);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          toast({
            title: "Nie jesteś Organizatorem",
            description: "Najpierw utwórz profil organizatora.",
            variant: "destructive",
          });
          router.push("/become-organizer");
        } else {
          toast({
            description: "Nie udało się wczytać profilu organizatora.",
            variant: "destructive",
          });
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
      setNewlyUploadedImageId(null);
      setRemoveCurrentImage(false);
      handleImageUpload(file);
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
    } else if (!file && imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setNewlyUploadedImageId(null);
    }
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
      toast({ description: "Nowe zdjęcie przesłano pomyślnie. Zapisz zmiany, aby zastosować." });
    } catch (err: any) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setNewlyUploadedImageId(null);
      setValue("image", null);
      toast({
        title: "Przesyłanie obrazu nie powiodło się",
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
    toast({ description: "Zdjęcie usunięte. Zapisz zmiany, aby potwierdzić." });
  }

  async function onSubmit(data: FormData) {
    const payload: { name?: string; description?: string; image_id?: string | null } = {};

    payload.name = data.name;
    payload.description = data.description;

    if (newlyUploadedImageId) {
      payload.image_id = newlyUploadedImageId;
    } else if (removeCurrentImage) {
      payload.image_id = null;
    }

    try {
      const response = await axiosInstance.put("/organizer", payload);
      toast({ description: "Profil zaktualizowany pomyślnie!" });
      setCurrentImageId(response.data.image_id || null);
      setNewlyUploadedImageId(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setValue("image", null);
      setRemoveCurrentImage(false);
    } catch (error: any) {
      toast({
        description: `Aktualizacja nie powiodła się: ${error?.response?.data?.detail || error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  }

  if (loading) return <p className="text-center mt-20">Ładowanie...</p>;

  return (
    <div className="">
      <DashboardHeader
        title="Profil Organizatora"
        onUpdate={handleSubmit(onSubmit)}
        updateLabel={isSubmitting || isUploadingImage ? "Zapisywanie..." : "Zapisz Zmiany"}
        isSubmitting={isSubmitting || isUploadingImage}
      />
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mx-auto max-w-xl mt-6 px-6">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa *</FormLabel>
                <FormControl>
                  <Input placeholder="Nazwa Organizatora" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opis</FormLabel>
                <FormControl>
                  <Textarea placeholder="Opowiedz nam o swojej organizacji" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="image"
            render={() => (
              <FormItem>
                <FormLabel>Zdjęcie Profilowe</FormLabel>
                <SingleImageUpload
                  name="image"
                  control={control}
                  existingImageId={currentImageId}
                  imagePreviewUrl={imagePreviewUrl}
                  isUploading={isUploadingImage}
                  onRemove={handleRemoveImageClick}
                  disabled={isSubmitting}
                  isRemoved={removeCurrentImage}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
