"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PinnedFooter } from "@/components/b2b/PinnedFooter";
import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { SocialLinksField, type SocialLinkValue } from "@/components/common/SocialLinksField";
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
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
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

/** Per-kind counts of what still references an instructor, as returned by the 409. */
type DeleteBlockers = Partial<Record<"events" | "occurrences" | "schedules" | "classes", number>>;

const BLOCKER_LABELS: Record<keyof DeleteBlockers, [string, string, string]> = {
  events: ["wydarzenie", "wydarzenia", "wydarzeń"],
  occurrences: ["zajęcia", "zajęcia", "zajęć"],
  schedules: ["grafik", "grafiki", "grafików"],
  classes: ["szablon zajęć", "szablony zajęć", "szablonów zajęć"],
};

/** Polish counts take three forms: 1, 2-4, and 5+ (with the teens always taking the last). */
function pluralize(count: number, [one, few, many]: [string, string, string]): string {
  if (count === 1) return `${count} ${one}`;
  const lastTwo = count % 100;
  const last = count % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} ${few}`;
  return `${count} ${many}`;
}

const schema = z.object({
  email: z.union([z.literal(""), z.string().email("Podaj poprawny adres e-mail")]).optional(),
  name: z.string().min(1, "Imię i nazwisko jest wymagane"),
  description: z.string().optional(),
  short_bio: z.string().max(200, "Maksymalnie 200 znaków").optional(),
  image_id: z.string().optional(),
  photo_ids: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  cities: z.array(z.any()).optional(),
  certificates: z.array(z.any()).optional(),
  yoga_styles: z.array(z.any()).optional(),
  social_links: z.array(z.any()).optional(),
  is_listed: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

/**
 * The instructor profile editor — every field the profile has.
 *
 * Extracted from the /edit route so the roster detail screen can render the *same* form.
 * The roster used to show a 4-field cut-down (name, bio, styles, photo), which is what
 * "we lost a lot of fields" was about: certificates, descriptions, gallery, languages,
 * locations and social links existed but were unreachable from the screen partners
 * actually open. No data was ever lost — the lean form PUT only its own keys and the
 * endpoint applies `exclude_unset` — but the fields were invisible, which amounts to the
 * same thing for the person using it.
 */
export function InstructorFullProfileForm({
  instructorId,
  statusBanner,
  extraActions,
}: {
  instructorId: string;
  /** R5's amber "profile is yours until they claim it" banner, when the roster supplies it. */
  statusBanner?: React.ReactNode;
  /** e.g. the roster's "Odłącz od studia", which belongs to the link and not the profile. */
  extraActions?: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { studio } = useCurrentStudio();
  const [isLoading, setIsLoading] = useState(true);
  const [slug, setSlug] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [deleteBlockers, setDeleteBlockers] = useState<DeleteBlockers | null>(null);
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
      social_links: [],
      // Listed until the loaded profile says otherwise. A default of `false` would show
      // every profile as hidden for the moment before the GET resolves, which reads as
      // "you are invisible" on a page that has not finished loading.
      is_listed: true,
    },
  });

  useEffect(() => {
    axiosInstance
      .get<InstructorProfile>(`/instructors/${instructorId}`)
      .then(({ data }) => {
        setSlug(data.slug);
        setIsPublished(data.is_published);
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
          is_listed: data.is_listed !== false,
          photo_ids: data.photo_ids ?? [],
          // ⚠ `??`, never `||` or a `.length` check. `null` means this profile has never
          // been asked (it predates the backend default, or came from a stub path); `[]`
          // means the instructor cleared every language. Collapsing the two would re-add
          // Polski to someone who removed it, on a form they only opened (WY-69).
          languages: data.languages ?? ["pl"],
          cities: (data.cities ?? []) as CityItem[],
          certificates: (data.certificates ?? []) as CertificateItem[],
          yoga_styles: data.yoga_styles.map((ys) => ({
            yoga_style_id: ys.yoga_style_id ?? null,
            custom_name: ys.custom_name ?? null,
            custom_icon_id: ys.custom_icon_id ?? null,
            description: ys.description ?? null,
          })) as InstructorYogaStyleIn[],
          social_links: (data.social_links ?? [])
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((link) => ({
              key: link.id,
              url: link.url,
              platform: link.platform as SocialLinkValue["platform"],
              handle: link.handle,
              label: link.label,
            })),
        });
      })
      .catch(() => {
        toast({ title: "Nie udało się wczytać danych instruktora", variant: "destructive" });
        router.push("/account/partner");
      })
      .finally(() => setIsLoading(false));
  }, [instructorId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        is_listed: values.is_listed !== false,
        photo_ids: (values.photo_ids ?? []).length ? values.photo_ids : null,
        languages: (values.languages ?? []).length ? values.languages : null,
        cities: (values.cities ?? []).length ? values.cities : null,
        certificates: (values.certificates ?? []).length ? values.certificates : null,
        yoga_styles: values.yoga_styles ?? [],
        social_links: ((values.social_links ?? []) as SocialLinkValue[]).map((link, index) => ({
          url: link.url,
          label: link.platform === "custom" ? link.label || null : null,
          position: index,
        })),
      };
      const { data: updated } = await axiosInstance.put<InstructorProfile>(
        `/instructors/${instructorId}`,
        payload,
      );
      setSlug(updated.slug);
      setIsPublished(updated.is_published);
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

  const handlePublish = async () => {
    try {
      const { data: published } = await axiosInstance.post<InstructorProfile>(
        `/instructors/${instructorId}/publish`,
      );
      setSlug(published.slug);
      setIsPublished(published.is_published);
      toast({
        title: "Profil opublikowany",
        description: "Publiczna strona nauczyciela jogi jest już dostępna.",
      });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data
        ?.detail;
      const message =
        typeof detail === "object" && detail && "message" in detail
          ? String((detail as { message?: string }).message)
          : "Nie udało się opublikować profilu.";
      toast({ title: "Publikacja nieudana", description: message, variant: "destructive" });
    }
  };

  const handleReinvite = async () => {
    setIsInviting(true);
    try {
      // Carrying the studio is what makes this "ask again" after a refusal: the backend
      // reopens that studio's rejected roster row alongside the new email (WY-63 case 4).
      // Without it the invite goes out while the roster keeps reading "Odrzucono".
      await axiosInstance.post(
        `/instructors/${instructorId}/reinvite${studio ? `?studio_id=${studio.id}` : ""}`,
      );
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
      await axiosInstance.delete(`/instructors/${instructorId}`);
      toast({ title: "Instruktor usunięty" });
      router.push("/account/partner/offer");
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { detail?: unknown } } })
        ?.response;
      const detail = response?.data?.detail;
      // 409 means the profile still teaches. Rather than a dead-end toast, say what holds
      // it and offer the way out the backend intends: hide the profile instead.
      if (response?.status === 409 && typeof detail === "object" && detail) {
        setDeleteBlockers(
          ((detail as { blockers?: DeleteBlockers }).blockers ?? {}) as DeleteBlockers,
        );
        return;
      }
      toast({ title: "Nie udało się usunąć instruktora", variant: "destructive" });
    }
  };

  const handleUnpublish = async () => {
    try {
      const { data: updated } = await axiosInstance.post<InstructorProfile>(
        `/instructors/${instructorId}/unpublish`,
      );
      setIsPublished(updated.is_published);
      setDeleteBlockers(null);
      toast({
        title: "Profil ukryty",
        description: "Nie jest już widoczny publicznie. Zajęcia pozostały bez zmian.",
      });
    } catch {
      toast({ title: "Nie udało się ukryć profilu", variant: "destructive" });
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {statusBanner}
          {!isOwnClaimedInstructor && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail instruktora *</FormLabel>
                  <FormDescription>
                    Ten profil jest już widoczny publicznie, ale możesz uzupełnić tylko podstawowe
                    dane. Zaproś instruktora e-mailem, aby mógł przejąć profil i uzupełnić go w
                    pełni (zdjęcia, style jogi, certyfikaty i więcej).
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
                    (maks. 200 znaków)
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
                  {field.value?.length ?? 0}/200
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

          {/* Everything below is profile *content* beyond the essentials (name, photo,
           * short bio, description, email) — for a profile the partner manages but hasn't
           * personally claimed, only the essentials are theirs to fill in. The real person
           * fills in the rest once they claim it. See
           * .plans/instructor-profile-permissions/. */}
          {isOwnClaimedInstructor && (
            <>
              <Separator />

              <FormField
                control={form.control}
                name="photo_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Galeria zdjęć</FormLabel>
                    <FormDescription>
                      Pomagają uczestnikom poznać instruktora — zdjęcia z zajęć, treningów lub
                      wydarzeń
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
                      Uczestnicy filtrują wydarzenia po języku — zaznacz wszystkie, w których
                      prowadzisz zajęcia
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

              <FormField
                control={form.control}
                name="social_links"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media społecznościowe</FormLabel>
                    <FormDescription>
                      Wklej linki do Instagrama, Facebooka i innych profili — pojawią się jako ikony
                      na publicznym profilu
                    </FormDescription>
                    <FormControl>
                      <SocialLinksField
                        value={(field.value ?? []) as SocialLinkValue[]}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <Separator />

          <StudioLinkSection instructorId={instructorId} />

          {extraActions}

          {/* Widoczność w wyszukiwarkach.

              Distinct from publish/unpublish below and above: unpublishing withdraws the
              page's content (it is how an unreviewed AI-generated draft stays private),
              while this leaves the profile rendering in full and only takes it out of
              search results and the instructor directory. A link the owner shares still
              works — that is the difference, and it is why the copy talks about being
              *found* rather than about being visible.

              Mirrors the identical control on the studio form. */}
          <Separator />
          <FormField
            control={form.control}
            name="is_listed"
            render={({ field }) => {
              const listed = field.value !== false;
              return (
                <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3 space-y-0">
                  <div>
                    <p className="text-sm font-semibold">
                      {listed ? "Profil publiczny" : "Profil ukryty"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {listed
                        ? "Profil jest widoczny w katalogu instruktorów i w wynikach wyszukiwania Google"
                        : "Profil nie pojawia się w katalogu ani w wyszukiwarkach — link, który wyślesz, nadal działa"}
                    </p>
                  </div>
                  <FormControl>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={listed}
                      aria-label="Widoczność profilu w wyszukiwarkach"
                      onClick={() => field.onChange(!listed)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        listed ? "bg-b2b-green-text" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          listed ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </FormControl>
                </FormItem>
              );
            }}
          />

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
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-b2b-red-solid hover:bg-b2b-red-solid/90"
                  >
                    Tak, usuń
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={deleteBlockers !== null}
              onOpenChange={(open) => !open && setDeleteBlockers(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Nie można usunąć instruktora</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ten profil jest jeszcze przypisany do:{" "}
                    {Object.entries(deleteBlockers ?? {})
                      .filter(([, count]) => count > 0)
                      .map(([kind, count]) =>
                        pluralize(count, BLOCKER_LABELS[kind as keyof DeleteBlockers]),
                      )
                      .join(", ")}
                    . Odepnij instruktora od tych pozycji albo ukryj profil — zajęcia i zapisy
                    pozostaną bez zmian.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  {isPublished && (
                    <AlertDialogAction onClick={handleUnpublish}>Ukryj profil</AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Fixed bottom action bar */}
          <PinnedFooter>
            {slug && isPublished && (
              <Button size="action" type="button" variant="outline" asChild>
                <Link href={`/instruktor/${slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={15} className="mr-1.5" />
                  Zobacz profil
                </Link>
              </Button>
            )}
            {!isPublished && (
              <Button
                size="action"
                type="button"
                variant="outline"
                onClick={handlePublish}
                disabled={form.formState.isSubmitting || isUploadingProfileImage}
              >
                Opublikuj profil
              </Button>
            )}
            <Button
              type="submit"
              size="action"
              variant="green"
              disabled={form.formState.isSubmitting || isUploadingProfileImage}
            >
              <Save size={15} className="mr-1.5" />
              {form.formState.isSubmitting ? "Zapisuję..." : "Zapisz profil"}
            </Button>
          </PinnedFooter>
        </form>
      </Form>
    </>
  );
}
