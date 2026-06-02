"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import type { CertificateItem, CityItem, InstructorYogaStyleIn } from "@/types/instructor";

import { CertificatesField } from "../[instructorId]/edit/components/CertificatesField";
import { CitySearchField } from "../[instructorId]/edit/components/CitySearchField";
import { InstructorPhotoGallery } from "../[instructorId]/edit/components/InstructorPhotoGallery";
import { LanguageMultiSelect } from "../[instructorId]/edit/components/LanguageMultiSelect";
import { YogaStyleSelector } from "../[instructorId]/edit/components/YogaStyleSelector";

const schema = z.object({
  name: z.string().min(1, "Imię i nazwisko jest wymagane"),
  description: z.string().optional(),
  short_bio: z.string().max(120, "Maksymalnie 120 znaków").optional(),
  image_id: z.string().optional(),
  photo_ids: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  cities: z.array(z.any()).optional(),
  certificates: z.array(z.any()).optional(),
  yoga_styles: z.array(z.any()).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function InstructorCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isProfileImageRemoved, setIsProfileImageRemoved] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      short_bio: "",
      image_id: "",
      photo_ids: [],
      languages: [],
      cities: [],
      certificates: [],
      yoga_styles: [],
    },
  });

  const handleProfileImageSelect = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setProfileImagePreviewUrl(preview);
    setIsUploadingProfileImage(true);
    setIsProfileImageRemoved(false);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await axiosInstance.post<{ image_id: string }>(
        "/instructors/image-upload",
        fd,
      );
      form.setValue("image_id", data.image_id);
    } catch {
      toast({ title: "Nie udało się przesłać zdjęcia profilowego", variant: "destructive" });
    } finally {
      setIsUploadingProfileImage(false);
      URL.revokeObjectURL(preview);
      setProfileImagePreviewUrl(null);
    }
  };

  const handleProfileImageRemove = () => {
    if (profileImagePreviewUrl) URL.revokeObjectURL(profileImagePreviewUrl);
    setProfileImagePreviewUrl(null);
    setIsProfileImageRemoved(true);
    form.setValue("image_id", "");
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await axiosInstance.post("/instructors", {
        name: values.name,
        description: values.description || null,
        short_bio: values.short_bio || null,
        image_id: isProfileImageRemoved ? null : values.image_id || null,
        photo_ids: (values.photo_ids ?? []).length ? values.photo_ids : null,
        languages: (values.languages ?? []).length ? values.languages : null,
        cities: (values.cities ?? []).length ? values.cities : null,
        certificates: (values.certificates ?? []).length ? values.certificates : null,
        yoga_styles: values.yoga_styles ?? [],
      });
      toast({ title: "Instruktor utworzony" });
      router.push("/profile/oferta");
    } catch {
      toast({ title: "Nie udało się utworzyć instruktora", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imię i nazwisko *</FormLabel>
                <FormDescription>
                  Wyświetlane publicznie na listach instruktorów i stronach wydarzeń
                </FormDescription>
                <FormControl>
                  <Input {...field} placeholder="np. Anna Kowalska" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zdjęcie profilowe</FormLabel>
                <FormDescription>
                  Główne zdjęcie widoczne na listach zajęć i publicznym profilu instruktora
                </FormDescription>
                <SingleImageUpload
                  existingImageId={isProfileImageRemoved ? null : field.value || null}
                  imagePreviewUrl={profileImagePreviewUrl}
                  isUploading={isUploadingProfileImage}
                  onRemove={handleProfileImageRemove}
                  isRemoved={isProfileImageRemoved}
                  onFileSelect={handleProfileImageSelect}
                  disabled={form.formState.isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="short_bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Twoje zdanie o sobie{" "}
                  <span className="text-muted-foreground text-xs font-normal">
                    (maks. 120 znaków)
                  </span>
                </FormLabel>
                <FormDescription>
                  Napisz jedno zdanie, które jak najlepiej opisuje Ciebie i Twój styl — wyświetlane
                  przy nazwisku i przyciąga uwagę uczestników
                </FormDescription>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    placeholder="np. Certyfikowana instruktorka Hatha i Vinyasy z 10-letnim doświadczeniem"
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  {field.value?.length ?? 0}/120
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pełny opis</FormLabel>
                <FormDescription>
                  Biogram na publicznym profilu — opisz swoją drogę, filozofię i podejście do jogi
                </FormDescription>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={6}
                    placeholder="np. Moją przygodę z jogą rozpoczęłam ponad 10 lat temu..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="photo_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Galeria zdjęć</FormLabel>
                <FormDescription>
                  Pomagają uczestnikom poznać instruktora — zdjęcia z zajęć, treningów lub wydarzeń
                </FormDescription>
                <InstructorPhotoGallery
                  value={(field.value ?? []) as string[]}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Języki prowadzenia zajęć</FormLabel>
                <FormDescription>
                  Uczestnicy filtrują wydarzenia po języku — zaznacz wszystkie, w których prowadzisz
                  zajęcia
                </FormDescription>
                <FormControl>
                  <LanguageMultiSelect
                    value={(field.value ?? []) as string[]}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lokalizacje</FormLabel>
                <FormDescription>
                  Pomagają uczestnikom znaleźć Cię w wyszukiwaniu — dodaj miasta, w których
                  regularnie uczysz
                </FormDescription>
                <FormControl>
                  <CitySearchField
                    value={(field.value ?? []) as CityItem[]}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="yoga_styles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Style jogi</FormLabel>
                <FormDescription>
                  Widoczne na profilu i w filtrach wyszukiwania — zaznacz style, w których się
                  specjalizujesz
                </FormDescription>
                <FormControl>
                  <YogaStyleSelector
                    value={(field.value ?? []) as InstructorYogaStyleIn[]}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="certificates"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certyfikaty i ukończone szkolenia</FormLabel>
                <FormDescription>
                  Budują wiarygodność i zaufanie uczestników — dodaj ukończone kursy, szkolenia
                  nauczycielskie i certyfikaty
                </FormDescription>
                <FormControl>
                  <CertificatesField
                    value={(field.value ?? []) as CertificateItem[]}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fixed bottom action bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t px-4 py-3 flex justify-end safe-area-bottom">
            <Button type="submit" disabled={form.formState.isSubmitting || isUploadingProfileImage}>
              <Save size={15} className="mr-1.5" />
              {form.formState.isSubmitting ? "Tworzę..." : "Utwórz instruktora"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
