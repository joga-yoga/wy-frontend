"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";

import { PassTile } from "@/components/common/PassTile";
import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { WyImage } from "@/components/custom/WyImage";
import { type Instructor, InstructorModal } from "@/components/instructors/InstructorModal";
import { DashboardFooter } from "@/components/layout/DashboardFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { EventPhotosSection } from "../../../components/EventForm/components/EventPhotosSection";
import { EventHelpBarProvider } from "../../../components/EventForm/contexts/EventHelpBarContext";
import { PassModal } from "./PassModal";
import { SportCardModal } from "./SportCardModal";
import { StudioDashboardSidebar } from "./StudioDashboardSidebar";
import {
  buildStudioPayload,
  emptyStudioFormValues,
  formValuesFromStudio,
  studioDraftSchema,
  studioPublishSchema,
} from "./studioFormModel";
import type {
  Amenity,
  StudioApiResponse,
  StudioFormValues,
  StudioInstructor,
  StudioLocation,
  StudioPass,
  StudioRoom,
  StudioSportCard,
} from "./types";

interface StudioFormProps {
  routeId: string;
}

type SubmitIntent = "draft" | "publish";

interface YogaStyle {
  id: string;
  name: string;
  slug: string;
}

function Section({
  title,
  children,
  first = false,
  id,
}: {
  title: string;
  children: ReactNode;
  first?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-5", !first && "border-t border-border")}>
      <div className="mb-4 flex items-center text-base font-bold uppercase tracking-0 text-muted-foreground">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="pt-1 text-sm text-destructive">{message}</p>;
}

function fieldClass(hasError?: boolean) {
  return cn(
    "h-12 rounded-md bg-white px-3 text-base shadow-none focus-visible:ring-brand-green",
    hasError && "border-destructive focus-visible:ring-destructive",
  );
}

function textAreaClass(hasError?: boolean) {
  return cn(
    "min-h-24 rounded-md bg-white px-3 py-2 text-base shadow-none focus-visible:ring-brand-green",
    hasError && "border-destructive focus-visible:ring-destructive",
  );
}

function blockInvalidNumberChars(event: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function StudioForm({ routeId }: StudioFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isCreateRoute = routeId === "create";
  const [studioId, setStudioId] = useState<string | null>(isCreateRoute ? null : routeId);
  const [isLoading, setIsLoading] = useState(!isCreateRoute);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIsPublic, setCurrentIsPublic] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [directUploadError, setDirectUploadError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File }[]>([]);
  const resolverSchemaRef = useRef(studioDraftSchema);
  const submitIntentRef = useRef<SubmitIntent>("draft");

  // Amenities catalogue
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  // Yoga styles catalogue
  const [allYogaStyles, setAllYogaStyles] = useState<YogaStyle[]>([]);
  // Instructors
  const [availableInstructors, setAvailableInstructors] = useState<Instructor[]>([]);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  // Room input
  const [roomInput, setRoomInput] = useState("");
  // Pass modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [editingPass, setEditingPass] = useState<StudioPass | null>(null);
  // Sport card modal
  const [isSportCardModalOpen, setIsSportCardModalOpen] = useState(false);
  const [editingSportCard, setEditingSportCard] = useState<StudioSportCard | null>(null);
  // Slug manual edit tracking
  const slugManuallyEditedRef = useRef(false);

  // Location autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{
      description: string;
      place_id: string;
      structured_formatting: { main_text: string; secondary_text: string };
    }>
  >([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [isFetchingLocationSuggestions, setIsFetchingLocationSuggestions] = useState(false);
  const locationDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const resolver = useMemo<Resolver<StudioFormValues>>(
    () => async (values, context, options) => {
      const activeSchema =
        submitIntentRef.current === "publish" ? studioPublishSchema : resolverSchemaRef.current;
      const activeResolver = yupResolver(activeSchema as any) as Resolver<StudioFormValues>;
      return activeResolver(values, context, options);
    },
    [],
  );

  const {
    register,
    control,
    reset,
    setValue,
    getValues,
    watch,
    trigger,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<StudioFormValues>({
    resolver,
    defaultValues: emptyStudioFormValues,
    mode: "onSubmit",
  });

  const values = watch();
  const watchedImageIds = values.image_ids ?? [];

  // Load catalogues
  useEffect(() => {
    axiosInstance
      .get<Amenity[]>("/amenities")
      .then(({ data }) => setAllAmenities(data))
      .catch(() => {});
    axiosInstance
      .get<YogaStyle[]>("/yoga-styles")
      .then(({ data }) => setAllYogaStyles(data))
      .catch(() => {});
  }, []);

  // Load instructors
  useEffect(() => {
    async function loadInstructors() {
      const merged = new Map<string, Instructor>();
      try {
        const owned = await axiosInstance.get<Instructor[]>("/instructors");
        console.log("🚀 ~ loadInstructors ~ owned:", owned);
        owned.data.forEach((i) => merged.set(i.id, { ...i, is_owned: true, is_foreign: false }));
      } catch {}
      try {
        const roster = await axiosInstance.get<Instructor[]>("/instructor-roster");
        roster.data.forEach((i) => merged.set(i.id, { ...i, is_foreign: i.is_owned === false }));
      } catch {}
      console.log("🚀 ~ loadInstructors ~ merged:", merged);
      setAvailableInstructors([...merged.values()]);
    }
    loadInstructors();
  }, []);

  // Hydrate instructor objects once both the form data and the available list are ready
  const watchedInstructorIds = values.instructor_ids ?? [];
  const watchedInstructors = values.instructors ?? [];
  useEffect(() => {
    if (
      watchedInstructorIds.length === 0 ||
      watchedInstructors.length > 0 ||
      availableInstructors.length === 0
    )
      return;
    const hydrated = watchedInstructorIds
      .map((id) => availableInstructors.find((i) => i.id === id))
      .filter(Boolean) as StudioInstructor[];
    if (hydrated.length > 0) {
      setValue("instructors", hydrated);
    }
  }, [watchedInstructorIds, watchedInstructors, availableInstructors, setValue]);

  // Reset on create mount
  useEffect(() => {
    if (!isCreateRoute) return;
    setStudioId(null);
    setIsLoading(false);
    setLoadError(null);
    setCurrentIsPublic(false);
    setIsUploadingImage(false);
    setIsUploadingLogo(false);
    setLogoPreviewUrl(null);
    setDirectUploadError(null);
    setPendingImages([]);
    setLocationQuery("");
    setLocationSuggestions([]);
    reset(emptyStudioFormValues);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing studio
  useEffect(() => {
    if (!studioId) return;
    setIsLoading(true);
    setLoadError(null);
    axiosInstance
      .get<StudioApiResponse>(`/studios/${studioId}`)
      .then(async (response) => {
        const formValues = formValuesFromStudio(response.data);
        setCurrentIsPublic(formValues.is_public);
        if (formValues.location_id) {
          try {
            const { data: locations } = await axiosInstance.get<StudioLocation[]>("/locations");
            const loc = locations.find((l) => l.id === formValues.location_id);
            if (loc) {
              formValues.location = loc;
              setLocationQuery(loc.address_line1 || loc.title || "");
              setIsSearchingLocation(false);
            }
          } catch {}
        }
        reset(formValues);
      })
      .catch(() => {
        setLoadError("Nie udało się załadować studia.");
      })
      .finally(() => setIsLoading(false));
  }, [studioId, reset]);

  // Unsaved changes warning
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  const scrollToFirstError = useCallback(() => {
    window.setTimeout(() => {
      const message = document.querySelector("[data-error-field] .text-destructive");
      const target = message?.closest("[data-error-field]");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }, []);

  function setDirtyValue<K extends keyof StudioFormValues>(
    name: K,
    value: StudioFormValues[K],
    shouldValidate = false,
  ) {
    setValue(name as any, value as any, { shouldDirty: true, shouldValidate });
  }

  async function persist(intent: SubmitIntent) {
    submitIntentRef.current = intent;
    resolverSchemaRef.current = intent === "publish" ? studioPublishSchema : studioDraftSchema;
    const valid = await trigger(undefined, { shouldFocus: true });
    if (!valid) {
      scrollToFirstError();
      toast({
        title: intent === "publish" ? "Nie można opublikować" : "Nie można zapisać",
        description:
          intent === "publish"
            ? "Uzupełnij pola oznaczone błędem."
            : "Do szkicu wystarczy nazwa studia.",
        variant: "destructive",
      });
      return;
    }

    const payload = buildStudioPayload(getValues());
    try {
      let response;
      if (studioId) {
        response = await axiosInstance.put<StudioApiResponse>(`/studios/${studioId}`, payload);
      } else {
        response = await axiosInstance.post<StudioApiResponse>("/studios", payload);
        setStudioId(response.data.id);
        router.replace(`/profile/studio/${response.data.id}/edit`);
      }
      setCurrentIsPublic(response.data.status === "claimed");
      reset(getValues());
      toast({
        description: intent === "publish" ? "Studio opublikowane." : "Zmiany zapisane.",
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: intent === "publish" ? "Błąd publikacji" : "Błąd zapisu",
        description: error.response?.data?.detail || "Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  }

  // ── Logo upload ───────────────────────────────────────────────────────

  async function handleLogoFileSelect(file: File) {
    setIsUploadingLogo(true);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(previewUrl);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axiosInstance.post<{ image_id: string }>(
        "/events/image-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setDirtyValue("image_id", response.data.image_id, true);
      toast({ description: "Logo przesłane." });
    } catch {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setLogoPreviewUrl(null);
      toast({ description: "Nie udało się przesłać logo.", variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
    }
  }

  // ── Gallery image upload ──────────────────────────────────────────────

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const nextPending = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
    }));
    setPendingImages((prev) => [...prev, ...nextPending]);
    setIsUploadingImage(true);
    setDirectUploadError(null);

    const uploadedIds: string[] = [];
    for (const pending of nextPending) {
      const formData = new FormData();
      formData.append("image", pending.file);
      try {
        const response = await axiosInstance.post<{ image_id: string }>(
          "/events/image-upload",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        uploadedIds.push(response.data.image_id);
      } catch (error: any) {
        const detail =
          error.response?.data?.detail || error.message || `Nie udało się przesłać pliku.`;
        setDirectUploadError((prev) => `${prev ? `${prev}\n` : ""}${detail}`);
      } finally {
        setPendingImages((prev) => prev.filter((item) => item.id !== pending.id));
      }
    }

    if (uploadedIds.length > 0) {
      setDirtyValue("image_ids", [...watchedImageIds, ...uploadedIds], true);
      toast({
        description:
          uploadedIds.length > 1 ? `Dodano ${uploadedIds.length} zdjęć.` : "Zdjęcie dodane.",
      });
    }
    setIsUploadingImage(false);
    event.target.value = "";
  }

  function handleRemoveImage(imageId: string) {
    setDirtyValue(
      "image_ids",
      watchedImageIds.filter((id) => id !== imageId),
      true,
    );
  }

  function handleSetCover(imageId: string) {
    setDirtyValue("image_ids", [imageId, ...watchedImageIds.filter((id) => id !== imageId)], true);
  }

  // ── Room helpers ──────────────────────────────────────────────────────

  function addRoom() {
    const name = roomInput.trim();
    if (!name) return;
    setDirtyValue("rooms", [...(values.rooms ?? []), { name }]);
    setRoomInput("");
  }

  function removeRoom(index: number) {
    setDirtyValue(
      "rooms",
      (values.rooms ?? []).filter((_, i) => i !== index),
    );
  }

  // ── Amenity toggle ────────────────────────────────────────────────────

  function toggleAmenity(amenityId: string) {
    const current = values.amenity_ids ?? [];
    const next = current.includes(amenityId)
      ? current.filter((id) => id !== amenityId)
      : [...current, amenityId];
    setDirtyValue("amenity_ids", next);
  }

  // ── Yoga style toggle ────────────────────────────────────────────────

  function toggleYogaStyle(styleId: string) {
    const current = values.yoga_style_ids ?? [];
    const next = current.includes(styleId)
      ? current.filter((id) => id !== styleId)
      : [...current, styleId];
    setDirtyValue("yoga_style_ids", next);
  }

  // ── Instructor helpers ────────────────────────────────────────────────

  function commitInstructors(nextInstructors: StudioInstructor[]) {
    const unique = [...new Map(nextInstructors.map((i) => [i.id, i])).values()];
    setDirtyValue("instructors", unique);
    setDirtyValue(
      "instructor_ids",
      unique.map((i) => i.id),
    );
  }

  function removeInstructor(instructorId: string) {
    commitInstructors((values.instructors ?? []).filter((i) => i.id !== instructorId));
  }

  // ── Pass helpers (list shell for T03 modal) ───────────────────────────

  function removePass(index: number) {
    setDirtyValue(
      "passes",
      (values.passes ?? []).filter((_, i) => i !== index),
    );
  }

  // ── Sport card helpers (list shell for T03 modal) ─────────────────────

  function removeSportCard(index: number) {
    setDirtyValue(
      "sport_card_acceptances",
      (values.sport_card_acceptances ?? []).filter((_, i) => i !== index),
    );
  }

  // ── Location autocomplete helpers ──────────────────────────────────────

  function fetchLocationSuggestions(query: string) {
    if (query.trim().length < 3) {
      setLocationSuggestions([]);
      return;
    }
    setIsFetchingLocationSuggestions(true);
    axiosInstance
      .get("/locations/autocomplete", { params: { input_text: query } })
      .then(({ data }) => setLocationSuggestions(data || []))
      .catch(() => setLocationSuggestions([]))
      .finally(() => setIsFetchingLocationSuggestions(false));
  }

  async function handleLocationSelected(suggestion: { description: string; place_id: string }) {
    setIsSearchingLocation(false);
    setIsEditingLocation(false);
    setLocationSuggestions([]);
    setLocationQuery(suggestion.description);
    try {
      const { data: location } = await axiosInstance.post<StudioLocation>("/locations", {
        google_place_id: suggestion.place_id,
      });
      setDirtyValue("location_id", location.id);
      setDirtyValue("location", location as any);
      setDirtyValue("address", location.address_line1 || suggestion.description);
    } catch {
      toast({ description: "Nie udało się zapisać lokalizacji.", variant: "destructive" });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="min-h-screen bg-muted px-4 py-8">
        <div className="mx-auto max-w-[600px] rounded-lg border bg-background p-6">
          <Loader2 className="mx-auto size-8 animate-spin text-brand-green" />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-muted px-4 py-8">
        <div className="mx-auto max-w-[600px] rounded-lg border bg-background p-6">
          <p className="text-base font-semibold">{loadError}</p>
          <Button className="mt-4" onClick={() => router.refresh()}>
            Spróbuj ponownie
          </Button>
        </div>
      </main>
    );
  }

  const instructors = values.instructors ?? [];
  const instructorIds = values.instructor_ids ?? [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <form className="min-h-screen bg-background" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col md:flex-row">
          <StudioDashboardSidebar isLoading={isLoading} />

          <div className="flex-1 min-w-0">
            <div className="px-4 md:px-8 mx-auto max-w-[600px] pb-20">
              {/* ── Section 1: Podstawy ── */}
              <Section id="studio-basics-section" title="Podstawy" first>
                <div className="space-y-4">
                  {/* Logo */}
                  <div>
                    <label className="mb-1 block text-base font-semibold">Logo</label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Wyświetlane na stronie studia, w wynikach wyszukiwania i na listach zajęć
                    </p>
                    <SingleImageUpload
                      existingImageId={values.image_id}
                      imagePreviewUrl={logoPreviewUrl}
                      isUploading={isUploadingLogo}
                      onFileSelect={handleLogoFileSelect}
                      onRemove={() => setDirtyValue("image_id", null)}
                      previewClassName="object-contain"
                    />
                  </div>

                  <div data-error-field="name">
                    <label className="mb-1 block text-base font-semibold" htmlFor="name">
                      Nazwa studia
                    </label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Oficjalna nazwa studia widoczna na stronie publicznej i w wyszukiwaniu
                    </p>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="np. Studio Jogi Harmonia"
                      className={fieldClass(Boolean(errors.name))}
                      onBlur={(e) => {
                        if (isCreateRoute && !slugManuallyEditedRef.current && !values.slug) {
                          const generated = slugify(e.target.value);
                          if (generated) {
                            setDirtyValue("slug", generated);
                          }
                        }
                      }}
                    />
                    <FieldError message={errors.name?.message} />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="mb-1 block text-base font-semibold" htmlFor="slug">
                      Adres URL studia
                    </label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Unikalny identyfikator studia, który jest częścią linku do Twojej strony
                      publicznej.
                    </p>
                    <Input
                      id="slug"
                      value={values.slug}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        slugManuallyEditedRef.current = true;
                        const slugified = slugify(e.target.value);
                        setDirtyValue("slug", slugified);
                      }}
                      className={fieldClass()}
                      placeholder="np. moje-studio-jogi"
                    />
                    <div className="mt-2 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                      <p className="min-w-0 break-all font-mono text-sm text-muted-foreground">
                        https://joga.yoga/studio/
                        {values.slug ? (
                          <span className="text-brand-green">{values.slug}</span>
                        ) : (
                          <span className="italic">...</span>
                        )}
                      </p>
                      <button
                        type="button"
                        className="ml-auto shrink-0 rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://joga.yoga/studio/${values.slug}`);
                          toast({ description: "Link skopiowany" });
                        }}
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div data-error-field="description">
                    <label className="mb-1 block text-base font-semibold" htmlFor="description">
                      Opis
                    </label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Opisz swoje studio — czym się wyróżniacie, jaka jest Wasza filozofia i co
                      uczestnicy mogą u Was znaleźć
                    </p>
                    <Textarea
                      id="description"
                      {...register("description")}
                      className={textAreaClass(Boolean(errors.description))}
                      placeholder="np. Nasze studio powstało z pasji do jogi i ruchu..."
                      spellCheck={false}
                    />
                    <FieldError message={errors.description?.message} />
                  </div>
                </div>
              </Section>

              {/* ── Section 2: Lokalizacja ── */}
              <Section id="studio-location-section" title="Lokalizacja">
                <div className="space-y-4">
                  <div data-error-field="location_id" className="relative">
                    <label className="mb-1 block text-base font-semibold">Adres</label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Adres studia wyświetlany na profilu z mapą — pomaga uczestnikom Was znaleźć
                    </p>
                    {values.location && !isEditingLocation ? (
                      <div className="flex items-center gap-2 rounded-md border px-3 py-3">
                        <MapPin className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 text-sm">
                          {values.location.address_line1}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 text-xs text-brand-blue hover:underline"
                          onClick={() => {
                            setIsEditingLocation(true);
                            setIsSearchingLocation(true);
                            setLocationQuery("");
                            setLocationSuggestions([]);
                          }}
                        >
                          Zmień
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={locationQuery}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocationQuery(val);
                              setIsSearchingLocation(true);
                              if (locationDebounceRef.current)
                                clearTimeout(locationDebounceRef.current);
                              locationDebounceRef.current = setTimeout(
                                () => fetchLocationSuggestions(val),
                                300,
                              );
                            }}
                            className={cn(fieldClass(Boolean(errors.address)), "pl-9")}
                            placeholder="Wpisz adres, aby wyszukać..."
                            autoComplete="off"
                          />
                        </div>
                        {isFetchingLocationSuggestions && (
                          <p className="mt-1 text-xs text-muted-foreground">Szukanie...</p>
                        )}
                        {locationSuggestions.length > 0 && isSearchingLocation && (
                          <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-[200px] overflow-y-auto">
                            {locationSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.place_id}
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent transition-colors"
                                onClick={() => handleLocationSelected(suggestion)}
                              >
                                <span className="text-sm font-medium">
                                  {suggestion.structured_formatting.main_text}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {suggestion.structured_formatting.secondary_text}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {isEditingLocation && (
                          <button
                            type="button"
                            className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setIsEditingLocation(false);
                              setIsSearchingLocation(false);
                              setLocationSuggestions([]);
                              setLocationQuery(
                                values.location?.address_line1 || values.location?.title || "",
                              );
                            }}
                          >
                            Anuluj
                          </button>
                        )}
                      </>
                    )}
                    <FieldError message={errors.address?.message} />
                  </div>

                  {/* Sale (rooms) tag input */}
                  <div>
                    <label className="mb-1 block text-base font-semibold">Sale</label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Opcjonalne — wypełnij tylko jeśli studio ma więcej niż jedną salę. Nazwy sal
                      będą widoczne w grafiku, żeby uczestnicy wiedzieli, gdzie odbywają się
                      zajęcia.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(values.rooms ?? []).map((room, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
                        >
                          {room.name}
                          <button
                            type="button"
                            onClick={() => removeRoom(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addRoom();
                          }
                        }}
                        placeholder="np. Sala Główna, Sala Zen..."
                        className={fieldClass()}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRoom}
                        className="h-12 shrink-0"
                      >
                        Dodaj
                      </Button>
                    </div>
                  </div>

                  {/* Udogodnienia (amenities) toggle chips */}
                  <div>
                    <label className="mb-1 block text-base font-semibold">Udogodnienia</label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Zaznacz co oferuje Twoje studio — te informacje pomagają uczestnikom przy
                      wyborze
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allAmenities.map((amenity) => (
                        <Badge
                          key={amenity.id}
                          variant={
                            (values.amenity_ids ?? []).includes(amenity.id) ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleAmenity(amenity.id)}
                        >
                          {amenity.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── Section 3: Instruktorzy ── */}
              <Section id="studio-instructors-section" title="Instruktorzy">
                <div className="space-y-4">
                  <div className="space-y-3">
                    {instructors.map((instructor) => {
                      const resolved =
                        availableInstructors.find((i) => i.id === instructor.id) ?? instructor;
                      const isOwned = (resolved as any).is_owned === true;

                      return (
                        <div key={instructor.id} className="flex min-h-12 items-center gap-3">
                          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-base font-medium text-brand-green">
                            {instructor.image_id ? (
                              <WyImage
                                src={instructor.image_id}
                                alt={instructor.name}
                                width={44}
                                height={44}
                                className="size-11 rounded-full object-cover"
                              />
                            ) : (
                              instructor.name
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((p) => p[0]?.toUpperCase())
                                .join("")
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-base font-semibold">
                              {instructor.name}
                            </div>
                            {!isOwned && (
                              <span className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                Zewnętrzny
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 text-muted-foreground"
                            onClick={() => removeInstructor(instructor.id)}
                            aria-label={`Usuń instruktora ${instructor.name}`}
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="flex min-h-10 items-center gap-3 text-base font-medium text-brand-blue"
                    onClick={() => setIsInstructorModalOpen(true)}
                  >
                    <Plus className="size-5" />
                    Dodaj instruktora
                  </button>
                  <InstructorModal
                    isOpen={isInstructorModalOpen}
                    onClose={() => setIsInstructorModalOpen(false)}
                    onInstructorSaved={(instructor) => {
                      const saved = instructor as StudioInstructor;
                      setAvailableInstructors((prev) => {
                        const exists = prev.some((i) => i.id === saved.id);
                        return exists
                          ? prev.map((i) => (i.id === saved.id ? (saved as any) : i))
                          : [...prev, saved as any];
                      });
                      commitInstructors([...instructors, saved]);
                      setIsInstructorModalOpen(false);
                    }}
                    existingInstructors={availableInstructors}
                    availableInstructors={availableInstructors}
                    selectedInstructorIds={instructorIds}
                  />

                  {/* Style jogi */}
                  <div className="pt-2">
                    <label className="mb-1 block text-base font-semibold">Style jogi</label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Widoczne na profilu studia i w filtrach wyszukiwania
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allYogaStyles.map((style) => (
                        <Badge
                          key={style.id}
                          variant={
                            (values.yoga_style_ids ?? []).includes(style.id) ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleYogaStyle(style.id)}
                        >
                          {style.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── Section 4: Oferta ── */}
              <Section id="studio-oferta-section" title="Oferta">
                <div className="space-y-6">
                  {/* Drop-in price */}
                  <div data-error-field="drop_in_price">
                    <label className="mb-1 block text-base font-semibold">
                      Cena za jedno wejście
                    </label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Cena jednorazowego wejścia dla osób bez karnetu i karty sportowej
                    </p>
                    <div className="grid grid-cols-[1fr_88px] gap-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="np. 50"
                        onKeyDown={blockInvalidNumberChars}
                        {...register("drop_in_price")}
                        className={fieldClass(Boolean(errors.drop_in_price))}
                      />
                      <Select
                        value={values.currency}
                        onValueChange={(value) => setDirtyValue("currency", value, true)}
                      >
                        <SelectTrigger className="h-12 rounded-md text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLN">zł</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <FieldError message={errors.drop_in_price?.message} />
                  </div>

                  {/* Karnety list */}
                  <div>
                    <label className="mb-1 block text-base font-semibold">Karnety</label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Dodaj dostępne karnety z cenami — uczestnicy zobaczą je na profilu studia
                    </p>
                    <div className="space-y-2">
                      {(values.passes ?? []).map((pass, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5"
                        >
                          <button
                            type="button"
                            className="shrink-0"
                            onClick={() => {
                              setEditingPass(pass);
                              setIsPassModalOpen(true);
                            }}
                          >
                            <PassTile
                              sessionCount={
                                pass.session_count != null ? Number(pass.session_count) : null
                              }
                              durationDays={
                                pass.duration_days != null ? Number(pass.duration_days) : null
                              }
                              size="sm"
                            />
                          </button>
                          <button
                            type="button"
                            className="text-left flex-1 min-w-0"
                            onClick={() => {
                              setEditingPass(pass);
                              setIsPassModalOpen(true);
                            }}
                          >
                            <p className="text-sm font-semibold">{pass.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {pass.price} {getCurrencySymbol(pass.currency || values.currency)}
                            </p>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground"
                            onClick={() => removePass(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 flex min-h-10 items-center gap-3 text-base font-medium text-brand-blue"
                      onClick={() => {
                        setEditingPass(null);
                        setIsPassModalOpen(true);
                      }}
                    >
                      <Plus className="size-5" />
                      Dodaj karnet
                    </button>
                    <PassModal
                      isOpen={isPassModalOpen}
                      onClose={() => setIsPassModalOpen(false)}
                      onSaved={(pass) => {
                        const current = values.passes ?? [];
                        if (editingPass?.id) {
                          setDirtyValue(
                            "passes",
                            current.map((p) => (p.id === editingPass.id ? pass : p)),
                          );
                        } else {
                          setDirtyValue("passes", [...current, pass]);
                        }
                      }}
                      studioId={studioId}
                      dropInPrice={
                        values.drop_in_price !== "" ? Number(values.drop_in_price) : null
                      }
                      currency={values.currency || "PLN"}
                      editPass={editingPass}
                    />
                  </div>

                  {/* Karty sportowe tri-state */}
                  <div>
                    <label className="mb-1 block text-base font-semibold">
                      Akceptujecie karty sportowe?
                    </label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Informacja widoczna na profilu studia — uczestnicy często szukają studiów
                      akceptujących ich kartę
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        className={cn(
                          "min-h-10 rounded-lg border text-sm",
                          values.accepts_sport_cards === false
                            ? "border-brand-green font-semibold text-foreground"
                            : "border-border text-muted-foreground",
                        )}
                        onClick={() => setDirtyValue("accepts_sport_cards", false)}
                      >
                        Nie
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "min-h-10 rounded-lg border text-sm",
                          values.accepts_sport_cards === true
                            ? "border-brand-green font-semibold text-foreground"
                            : "border-border text-muted-foreground",
                        )}
                        onClick={() => setDirtyValue("accepts_sport_cards", true)}
                      >
                        Tak
                      </button>
                    </div>
                    {values.accepts_sport_cards === true && (
                      <div className="space-y-2">
                        {(values.sport_card_acceptances ?? []).map((sc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
                          >
                            <button
                              type="button"
                              className="flex items-center gap-3 min-w-0 flex-1 text-left"
                              onClick={() => {
                                setEditingSportCard(sc);
                                setIsSportCardModalOpen(true);
                              }}
                            >
                              {sc.sport_card?.photo || sc.photo ? (
                                <WyImage
                                  src={(sc.sport_card?.photo || sc.photo)!}
                                  alt={sc.sport_card?.name ?? sc.name ?? ""}
                                  width={80}
                                  height={50}
                                  className="h-[50px] w-20 shrink-0 rounded object-contain"
                                />
                              ) : (
                                <div className="flex h-[50px] w-20 shrink-0 items-center justify-center rounded bg-muted">
                                  <CreditCard className="size-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                  {sc.sport_card?.name ?? sc.name ?? "Karta sportowa"}
                                </p>
                                {sc.fee != null && sc.fee !== "" && Number(sc.fee) > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    Dopłata: {sc.fee} {getCurrencySymbol(values.currency)}
                                  </p>
                                )}
                              </div>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground shrink-0"
                              onClick={() => removeSportCard(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="flex min-h-10 items-center gap-3 text-base font-medium text-brand-blue"
                          onClick={() => {
                            setEditingSportCard(null);
                            setIsSportCardModalOpen(true);
                          }}
                        >
                          <Plus className="size-5" />
                          Dodaj kartę sportową
                        </button>
                        <SportCardModal
                          isOpen={isSportCardModalOpen}
                          onClose={() => {
                            setIsSportCardModalOpen(false);
                            setEditingSportCard(null);
                          }}
                          onSaved={(sc) => {
                            const current = values.sport_card_acceptances ?? [];
                            if (editingSportCard) {
                              setDirtyValue(
                                "sport_card_acceptances",
                                current.map((existing) =>
                                  existing === editingSportCard ? sc : existing,
                                ),
                              );
                            } else {
                              setDirtyValue("sport_card_acceptances", [...current, sc]);
                            }
                            setEditingSportCard(null);
                          }}
                          studioId={studioId}
                          currency={values.currency || "PLN"}
                          editCard={editingSportCard}
                          existingCardIds={(values.sport_card_acceptances ?? [])
                            .filter((sc) => sc.sport_card_id)
                            .map((sc) => sc.sport_card_id!)}
                        />
                      </div>
                    )}
                    {values.accepts_sport_cards === false && (
                      <div className="flex items-start gap-2 rounded-lg bg-muted/50 border px-3 py-2.5 text-sm text-muted-foreground">
                        <span className="shrink-0">ⓘ</span>
                        <span>
                          {`Na profilu studia pokażemy „Nie akceptujemy kart sportowych" — to ważna informacja dla uczestników.`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* ── Section 5: Zdjęcia ── */}
              <Section id="studio-photos-section" title="Zdjęcia">
                <EventHelpBarProvider>
                  <EventPhotosSection
                    errors={errors as any}
                    watchedImageIds={watchedImageIds}
                    handleRemoveImage={handleRemoveImage}
                    handleImageSelected={handleImageSelected}
                    isUploadingImage={isUploadingImage}
                    directUploadError={directUploadError}
                    pendingImages={pendingImages.map((item) => item.file)}
                    control={control as any}
                    name="image_ids"
                    handleSetCover={handleSetCover}
                    showHeader={false}
                  />
                </EventHelpBarProvider>
              </Section>

              {/* ── Widoczność ── */}
              <Section id="studio-visibility-section" title="Widoczność">
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {values.is_listed ? "Strona publiczna" : "Strona ukryta"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {values.is_listed
                        ? "Studio jest widoczne w wynikach wyszukiwania Google"
                        : "Studio nie jest indeksowane przez wyszukiwarki"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDirtyValue("is_listed", !values.is_listed)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      values.is_listed ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        values.is_listed ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </Section>
            </div>
          </div>
        </div>

        <DashboardFooter
          title={studioId ? "Edytuj studio" : "Nowe studio"}
          viewPublicHref={values.slug ? `/studio/${values.slug}` : undefined}
          viewPublicLabel="Zobacz stronę publiczną"
          viewPublicLabelShort="Zobacz"
          viewPublicIcon={<ExternalLink className="size-4" />}
          showPublishButton
          isPublished={currentIsPublic}
          isPublishing={isSubmitting}
          onPublishToggle={() => persist("publish")}
          publishButtonLabel="Opublikuj studio"
          publishButtonLabelShort="Opublikuj"
          publishingButtonLabel="Publikuję..."
          publishingButtonLabelShort="Publikuję..."
          publishIcon={<Send className="size-4" />}
          publishingIcon={<Loader2 className="size-4 animate-spin" />}
          onUpdate={() => persist("draft")}
          updateLabel="Zapisz"
          updateLabelShort="Zapisz"
          updateIcon={<Save className="size-4" />}
          isSaveDisabled={isSubmitting}
        />
      </form>
    </main>
  );
}
