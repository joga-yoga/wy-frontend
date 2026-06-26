"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import type {
  CertificateItem,
  CityItem,
  InstructorProfile,
  InstructorYogaStyleIn,
} from "@/types/instructor";

import { CertificatesField } from "./components/CertificatesField";
import { CitySearchField } from "./components/CitySearchField";
import { InstructorPhotoGallery } from "./components/InstructorPhotoGallery";
import { LanguageMultiSelect } from "./components/LanguageMultiSelect";
import { StudioLinkSection } from "./components/StudioLinkSection";
import { YogaStyleSelector } from "./components/YogaStyleSelector";

const schema = z.object({
  email: z.union([z.literal(""), z.string().email("Podaj poprawny adres e-mail")]).optional(),
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

export default function InstructorProfileEditPage() {
  const params = useParams<{ instructorId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [slug, setSlug] = useState<string | null>(null);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isOwnClaimedInstructor, setIsOwnClaimedInstructor] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isProfileImageRemoved, setIsProfileImageRemoved] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
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

  useEffect(() => {
    axiosInstance
      .get<InstructorProfile>(`/instructors/${params.instructorId}`)
      .then(({ data }) => {
        setSlug(data.slug);
        const instructorEmail = data.email ?? null;
        setExistingEmail(instructorEmail);
        setClaimStatus(data.claim_status ?? null);
        setIsOwnClaimedInstructor(data.is_claimed || data.claim_status === "claimed");
        form.reset({
          name: data.name,
          email: instructorEmail ?? "",
          description: data.description ?? "",
          short_bio: data.short_bio ?? "",
          image_id: data.image_id ?? "",
          photo_ids: data.photo_ids ?? [],
          languages: data.languages ?? [],
          cities: (data.cities ?? []) as CityItem[],
          certificates: (data.certificates ?? []) as CertificateItem[],
          yoga_styles: data.yoga_styles.map((ys) => ({
            yoga_style_id: ys.yoga_style_id ?? null,
            custom_name: ys.custom_name ?? null,
            custom_icon_id: ys.custom_icon_id ?? null,
            description: ys.description ?? null,
          })) as InstructorYogaStyleIn[],
        });
      })
      .catch(() => {
        toast({ title: "Nie udało się wczytać danych instruktora", variant: "destructive" });
        router.push("/profile");
      })
      .finally(() => setIsLoading(false));
  }, [params.instructorId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const emailValue = (values.email ?? "").trim();
    if (!isOwnClaimedInstructor && !emailValue) {
      form.setError("email", { message: "E-mail instruktora jest wymagany" });
      return;
    }
    const normalizedExistingEmail = existingEmail?.trim().toLowerCase() ?? null;
    const normalizedEmailValue = emailValue.toLowerCase();
    const didChangeEmail =
      !isOwnClaimedInstructor &&
      Boolean(emailValue) &&
      normalizedEmailValue !== normalizedExistingEmail;
    try {
      const payload = {
        ...(!isOwnClaimedInstructor ? { email: emailValue } : {}),
        name: values.name,
        description: values.description || null,
        short_bio: values.short_bio || null,
        image_id: isProfileImageRemoved ? null : values.image_id || null,
        photo_ids: (values.photo_ids ?? []).length ? values.photo_ids : null,
        languages: (values.languages ?? []).length ? values.languages : null,
        cities: (values.cities ?? []).length ? values.cities : null,
        certificates: (values.certificates ?? []).length ? values.certificates : null,
        yoga_styles: values.yoga_styles ?? [],
      };
      const { data: updated } = await axiosInstance.put<InstructorProfile>(
        `/instructors/${params.instructorId}`,
        payload,
      );
      setClaimStatus(updated.claim_status ?? null);
      setExistingEmail(updated.email ?? (isOwnClaimedInstructor ? existingEmail : emailValue));
      setIsOwnClaimedInstructor(updated.is_claimed || updated.claim_status === "claimed");
      if (didChangeEmail && updated.claim_status === "invited") {
        toast({
          title: "Profil zapisany",
          description: `Poprzednie zaproszenie zostało wyłączone. Nowe zaproszenie wysłano na ${updated.email ?? emailValue}.`,
        });
      } else {
        toast({ title: "Profil zapisany", description: "Zmiany zostały pomyślnie zapisane." });
      }
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      if (
        detail.toLowerCase().includes("email") ||
        detail.toLowerCase().includes("already exists")
      ) {
        form.setError("email", {
          message: "Ten e-mail jest już przypisany do innego instruktora.",
        });
        return;
      }
      toast({ title: "Nie udało się zapisać profilu", variant: "destructive" });
    }
  };

  const handleReinvite = async () => {
    setIsInviting(true);
    try {
      await axiosInstance.post(`/instructors/${params.instructorId}/reinvite`);
      setClaimStatus("invited");
      toast({
        title: "Zaproszenie wysłane",
        description: "Instruktor otrzyma e-mail z linkiem do przejęcia profilu.",
      });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        toast({
          title: "Za szybko",
          description: "Zaproszenie zostało już wysłane. Spróbuj ponownie za kilka minut.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Nie udało się wysłać zaproszenia", variant: "destructive" });
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/instructors/${params.instructorId}`);
      toast({ title: "Instruktor usunięty" });
      router.push("/profile/offer");
    } catch {
      toast({ title: "Nie udało się usunąć instruktora", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {!isOwnClaimedInstructor && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail instruktora *</FormLabel>
                  <FormDescription>
                    Wymagany do przejęcia profilu. Nie wyświetlamy go publicznie.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} type="email" placeholder="instruktor@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {existingEmail && (claimStatus === "invitable" || claimStatus === "invited") && (
            <div className="flex items-center gap-3 rounded-md border p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {claimStatus === "invited"
                    ? "Zaproszenie wysłane — oczekuje na odpowiedź"
                    : "Instruktor jeszcze nie przejął profilu"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {claimStatus === "invited"
                    ? "Możesz wysłać zaproszenie ponownie, jeśli instruktor go nie otrzymał."
                    : "Wyślij zaproszenie e-mailem, aby instruktor mógł przejąć swój profil."}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleReinvite}
                disabled={isInviting}
              >
                {isInviting
                  ? "Wysyłam..."
                  : claimStatus === "invited"
                    ? "Wyślij ponownie"
                    : "Wyślij zaproszenie"}
              </Button>
            </div>
          )}

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

          <Separator />

          <StudioLinkSection instructorId={params.instructorId} />

          {/* Strefa niebezpieczna */}
          <Separator />
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-destructive">Usuń instruktora</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ta operacja jest nieodwracalna. Instruktor zostanie trwale usunięty z systemu.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" size="sm">
                  Usuń instruktora
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Usunąć instruktora?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej akcji nie można cofnąć. Instruktor zostanie trwale usunięty z systemu.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Tak, usuń
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Fixed bottom action bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t px-4 py-3 flex gap-2 safe-area-bottom">
            {slug && (
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href={`/instruktor/${slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={15} className="mr-1.5" />
                  Zobacz profil
                </Link>
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={form.formState.isSubmitting || isUploadingProfileImage}
            >
              <Save size={15} className="mr-1.5" />
              {form.formState.isSubmitting ? "Zapisuję..." : "Zapisz profil"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
