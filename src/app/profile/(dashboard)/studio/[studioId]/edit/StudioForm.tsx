"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { ExternalLink, Loader2, Pencil, Plus, Save, Send, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";

import { WyImage } from "@/components/custom/WyImage";
import { type Instructor, InstructorModal } from "@/components/instructors/InstructorModal";
import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { DashboardFooter } from "@/components/layout/DashboardFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
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
  StudioPass,
  StudioRoom,
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
        owned.data.forEach((i) => merged.set(i.id, { ...i, is_owned: true, is_foreign: false }));
      } catch {}
      try {
        const roster = await axiosInstance.get<Instructor[]>("/instructor-roster");
        roster.data.forEach((i) => merged.set(i.id, { ...i, is_foreign: i.is_owned === false }));
      } catch {}
      setAvailableInstructors([...merged.values()]);
    }
    loadInstructors();
  }, []);

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
    reset(emptyStudioFormValues);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing studio
  useEffect(() => {
    if (!studioId) return;
    setIsLoading(true);
    setLoadError(null);
    axiosInstance
      .get<StudioApiResponse>(`/studios/${studioId}`)
      .then((response) => {
        const formValues = formValuesFromStudio(response.data);
        setCurrentIsPublic(formValues.is_public);
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
                    <label className="mb-2 block text-base font-semibold">Logo</label>
                    <SingleImageUpload
                      existingImageId={values.image_id}
                      imagePreviewUrl={logoPreviewUrl}
                      isUploading={isUploadingLogo}
                      onFileSelect={handleLogoFileSelect}
                      onRemove={() => setDirtyValue("image_id", null)}
                    />
                  </div>

                  <div data-error-field="name">
                    <label className="mb-2 block text-base font-semibold" htmlFor="name">
                      Nazwa studia
                    </label>
                    <Input
                      id="name"
                      {...register("name")}
                      className={fieldClass(Boolean(errors.name))}
                    />
                    <FieldError message={errors.name?.message} />
                  </div>

                  <div data-error-field="description">
                    <label className="mb-2 block text-base font-semibold" htmlFor="description">
                      Opis
                    </label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      className={textAreaClass(Boolean(errors.description))}
                      placeholder="Opis studia..."
                      spellCheck={false}
                    />
                    <FieldError message={errors.description?.message} />
                  </div>
                </div>
              </Section>

              {/* ── Section 2: Lokalizacja ── */}
              <Section id="studio-location-section" title="Lokalizacja">
                <div className="space-y-4">
                  <div data-error-field="address">
                    <label className="mb-2 block text-base font-semibold" htmlFor="address">
                      Adres
                    </label>
                    <Input
                      id="address"
                      {...register("address")}
                      className={fieldClass(Boolean(errors.address))}
                      placeholder="np. ul. Marszałkowska 1, Warszawa"
                    />
                    <FieldError message={errors.address?.message} />
                  </div>

                  {/* Sale (rooms) tag input */}
                  <div>
                    <label className="mb-2 block text-base font-semibold">Sale</label>
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
                        placeholder="Wpisz nazwę sali i naciśnij Enter"
                        className={fieldClass()}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRoom}
                        className="shrink-0"
                      >
                        Dodaj
                      </Button>
                    </div>
                  </div>

                  {/* Udogodnienia (amenities) toggle chips */}
                  <div>
                    <label className="mb-2 block text-base font-semibold">Udogodnienia</label>
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
                    <label className="mb-2 block text-base font-semibold">Style jogi</label>
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
                    <label className="mb-2 block text-base font-semibold">
                      Cena za jedno wejście
                    </label>
                    <div className="grid grid-cols-[1fr_88px] gap-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        onKeyDown={blockInvalidNumberChars}
                        {...register("drop_in_price")}
                        className={fieldClass(Boolean(errors.drop_in_price))}
                      />
                      <Input
                        value={values.currency}
                        onChange={(e) => setDirtyValue("currency", e.target.value)}
                        className={fieldClass()}
                        placeholder="PLN"
                      />
                    </div>
                    <FieldError message={errors.drop_in_price?.message} />
                  </div>

                  {/* Karnety list */}
                  <div>
                    <label className="mb-2 block text-base font-semibold">Karnety</label>
                    <div className="space-y-2">
                      {(values.passes ?? []).map((pass, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
                        >
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
                              {pass.price} {pass.currency || values.currency}
                              {pass.duration_days ? ` · ${pass.duration_days} dni` : ""}
                              {pass.session_count ? ` · ${pass.session_count} wejść` : ""}
                            </p>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
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
                    <label className="mb-2 block text-base font-semibold">Karty sportowe</label>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        className={cn(
                          "min-h-9 rounded-full border px-4 text-sm font-medium",
                          values.accepts_sport_cards === false &&
                            "border-brand-green bg-muted text-black",
                        )}
                        onClick={() => setDirtyValue("accepts_sport_cards", false)}
                      >
                        Nie
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "min-h-9 rounded-full border px-4 text-sm font-medium",
                          values.accepts_sport_cards === true &&
                            "border-brand-green bg-muted text-black",
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
                            <div>
                              <p className="text-sm font-semibold">
                                {sc.sport_card?.name ?? sc.name ?? "Karta sportowa"}
                              </p>
                              {sc.fee != null && sc.fee !== "" && Number(sc.fee) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Dopłata: {sc.fee} {values.currency}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground"
                              onClick={() => removeSportCard(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="flex min-h-10 items-center gap-3 text-base font-medium text-brand-blue"
                          onClick={() => setIsSportCardModalOpen(true)}
                        >
                          <Plus className="size-5" />
                          Dodaj kartę sportową
                        </button>
                        <SportCardModal
                          isOpen={isSportCardModalOpen}
                          onClose={() => setIsSportCardModalOpen(false)}
                          onSaved={(sc) => {
                            setDirtyValue("sport_card_acceptances", [
                              ...(values.sport_card_acceptances ?? []),
                              sc,
                            ]);
                          }}
                          studioId={studioId}
                          currency={values.currency || "PLN"}
                        />
                      </div>
                    )}
                    {values.accepts_sport_cards === false && (
                      <p className="text-sm text-muted-foreground">
                        Na stronie publicznej wyświetlimy informację, że studio nie akceptuje kart
                        sportowych.
                      </p>
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
            </div>
          </div>
        </div>

        <DashboardFooter
          title={studioId ? "Edytuj studio" : "Nowe studio"}
          viewPublicHref={studioId ? `/studio/${studioId}` : undefined}
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
