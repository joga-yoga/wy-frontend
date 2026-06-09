"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { InstructorForm, InstructorFormData, instructorSchema } from "./InstructorForm";

// Exported so EventForm / EventInstructorsSection can use the same type
export interface Instructor {
  id: string;
  name: string;
  email?: string | null;
  description?: string | null;
  image_id: string | null;
  claim_status?: string | null;
  is_claimed?: boolean;
  claimed_at?: string | null;
  is_foreign?: boolean;
  is_owned?: boolean;
}

// ── Add-mode step types ───────────────────────────────────────────────────────
type CreateStep = "picker" | "input" | "preview" | "details";
type ResolutionType = "existing_instructor" | "existing_user" | "new_instructor";

interface ResolvedPreview {
  instructor_id: string;
  claim_status: string;
  name: string;
  image_id: string | null;
  resolution_type: ResolutionType;
  is_owned: boolean;
}

// ── Input-step schema ─────────────────────────────────────────────────────────
const inputSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail"),
});

type InputFormData = z.infer<typeof inputSchema>;

// ── Details-step schema ───────────────────────────────────────────────────────
const detailsSchema = z.object({
  name: z.string().min(1, "Imię jest wymagane"),
  short_bio: z.string().max(120, "Maksymalnie 120 znaków").optional(),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

interface InstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstructorSaved: (instructor: Instructor) => void;
  initialInstructor?: Instructor | null;
  eventId?: string | null;
  existingInstructors?: Instructor[];
  availableInstructors?: Instructor[];
  selectedInstructorIds?: string[];
}

export function InstructorModal({
  isOpen,
  onClose,
  onInstructorSaved,
  initialInstructor,
  eventId,
  existingInstructors,
  availableInstructors = [],
  selectedInstructorIds = [],
}: InstructorModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isCreateMode = !initialInstructor;

  // Derived: hide "It's me" if the user already has a claimed instructor or one with their email
  const alreadyClaimed =
    user != null &&
    (existingInstructors?.some((i) => {
      const canBeCurrentUserProfile = i.is_owned === true || !i.is_foreign;
      return (
        canBeCurrentUserProfile &&
        (i.is_claimed === true || (i.email && i.email.toLowerCase() === user.email.toLowerCase()))
      );
    }) ??
      false);

  // ── Edit-mode state ──────────────────────────────────────────────────────
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [newlyUploadedImageId, setNewlyUploadedImageId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [editEmail, setEditEmail] = useState(initialInstructor?.email ?? "");
  const [editClaimStatus, setEditClaimStatus] = useState(initialInstructor?.claim_status ?? null);
  const [isInviting, setIsInviting] = useState(false);
  const showEditEmailField = !isCreateMode && !initialInstructor?.is_claimed;

  const editForm = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: initialInstructor?.name || "",
      description: "",
      image: undefined,
    },
  });

  // ── Create-mode state ─────────────────────────────────────────────────────
  const [createStep, setCreateStep] = useState<CreateStep>("input");
  const [resolvedPreview, setResolvedPreview] = useState<ResolvedPreview | null>(null);

  // Details step image state
  const [detailsImageId, setDetailsImageId] = useState<string | null>(null);
  const [detailsPreviewUrl, setDetailsPreviewUrl] = useState<string | null>(null);
  const [isUploadingDetailsImage, setIsUploadingDetailsImage] = useState(false);

  const inputForm = useForm<InputFormData>({
    resolver: zodResolver(inputSchema),
    defaultValues: { email: "" },
  });

  const detailsForm = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: "", short_bio: "" },
  });

  const pickerInstructors = useMemo(
    () =>
      availableInstructors.filter((instructor) => !selectedInstructorIds.includes(instructor.id)),
    [availableInstructors, selectedInstructorIds],
  );

  // Reset all create-mode state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        setCreateStep(pickerInstructors.length > 0 ? "picker" : "input");
        setResolvedPreview(null);
        inputForm.reset({ email: "" });
        detailsForm.reset({ name: "", short_bio: "" });
        setDetailsImageId(null);
        if (detailsPreviewUrl) URL.revokeObjectURL(detailsPreviewUrl);
        setDetailsPreviewUrl(null);
        setIsUploadingDetailsImage(false);
      } else {
        editForm.reset({
          name: initialInstructor?.name || "",
          description: "",
          image: undefined,
        });
        setCurrentImageId(initialInstructor?.image_id || null);
        setNewlyUploadedImageId(null);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        setRemoveCurrentImage(false);
        setIsUploadingImage(false);
        setEditEmail(initialInstructor?.email ?? "");
        setEditClaimStatus(initialInstructor?.claim_status ?? null);
        setIsInviting(false);
      }
    }
  }, [isOpen, isCreateMode, pickerInstructors.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      if (detailsPreviewUrl) URL.revokeObjectURL(detailsPreviewUrl);
    };
  }, [imagePreviewUrl, detailsPreviewUrl]);

  // ── Edit-mode image handlers ─────────────────────────────────────────────
  const handleImageUpload = useCallback(
    async (file: File) => {
      setIsUploadingImage(true);
      const imageFormData = new FormData();
      imageFormData.append("image", file);
      const newPreviewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(newPreviewUrl);
      setNewlyUploadedImageId(null);
      setRemoveCurrentImage(false);
      try {
        const response = await axiosInstance.post("/instructors/image-upload", imageFormData);
        setNewlyUploadedImageId(response.data.image_id);
        toast({ description: "Zdjęcie przesłane. Zapisz zmiany, aby zastosować." });
      } catch (err: unknown) {
        if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl);
        setImagePreviewUrl(null);
        setNewlyUploadedImageId(null);
        editForm.setValue("image", null);
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
        toast({
          title: "Błąd przesyłania zdjęcia",
          description: detail || "Nie udało się przesłać zdjęcia.",
          variant: "destructive",
        });
      } finally {
        setIsUploadingImage(false);
      }
    },
    [toast, editForm],
  );

  const imageFile = editForm.watch("image");
  useEffect(() => {
    const file = imageFile?.[0];
    if (file instanceof File) handleImageUpload(file);
  }, [imageFile, handleImageUpload]);

  function handleRemoveImageClick() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    editForm.setValue("image", null);
    setNewlyUploadedImageId(null);
    setRemoveCurrentImage(true);
    toast({ description: "Zdjęcie usunięte. Zapisz zmiany, aby potwierdzić." });
  }

  // ── Details-step image handler ────────────────────────────────────────────
  async function handleDetailsImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (detailsPreviewUrl) URL.revokeObjectURL(detailsPreviewUrl);
    setDetailsPreviewUrl(preview);
    setIsUploadingDetailsImage(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await axiosInstance.post<{ image_id: string }>("/instructors/image-upload", fd);
      setDetailsImageId(res.data.image_id);
    } catch {
      toast({ description: "Nie udało się przesłać zdjęcia.", variant: "destructive" });
      URL.revokeObjectURL(preview);
      setDetailsPreviewUrl(null);
    } finally {
      setIsUploadingDetailsImage(false);
    }
  }

  // ── Edit-mode submit ─────────────────────────────────────────────────────
  async function onEditSubmit(data: InstructorFormData) {
    if (isUploadingImage) {
      toast({ description: "Poczekaj na zakończenie przesyłania zdjęcia." });
      return;
    }
    const payload: {
      name: string;
      description?: string;
      image_id?: string | null;
      email?: string | null;
    } = {
      name: data.name,
    };
    if (data.description) payload.description = data.description;
    if (newlyUploadedImageId) payload.image_id = newlyUploadedImageId;
    else if (removeCurrentImage) payload.image_id = null;
    if (showEditEmailField) payload.email = editEmail.trim() || null;
    try {
      const response = await axiosInstance.put(`/instructors/${initialInstructor!.id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      const updated = response.data as Instructor;
      toast({ description: "Instruktor zaktualizowany!" });
      onInstructorSaved(updated);
      onClose();
      setCurrentImageId(updated.image_id || null);
      setNewlyUploadedImageId(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      editForm.setValue("image", null);
      setRemoveCurrentImage(false);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      if (status === 409 || detail?.toLowerCase().includes("email")) {
        toast({
          description: "Ten e-mail jest już przypisany do innego instruktora.",
          variant: "destructive",
        });
        return;
      }
      toast({
        description: `Błąd aktualizacji: ${detail || "Nieznany błąd"}`,
        variant: "destructive",
      });
    }
  }

  // ── Edit-mode reinvite ────────────────────────────────────────────────────
  async function handleReinvite() {
    setIsInviting(true);
    try {
      await axiosInstance.post(`/instructors/${initialInstructor!.id}/reinvite`);
      setEditClaimStatus("invited");
      toast({
        description: "Zaproszenie wysłane. Instruktor otrzyma e-mail z linkiem.",
      });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast({
        description:
          status === 429
            ? "Zaproszenie zostało już wysłane. Spróbuj ponownie za kilka minut."
            : "Nie udało się wysłać zaproszenia.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  }

  // ── Create: "It's me" ─────────────────────────────────────────────────────
  async function handleItsMe() {
    try {
      const response = await axiosInstance.post("/instructors/self", {});
      toast({ description: "Twój profil instruktora gotowy!" });
      onInstructorSaved({ ...response.data, is_owned: true, is_foreign: false });
      onClose();
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      toast({ description: `Błąd: ${detail || "Nieznany błąd"}`, variant: "destructive" });
    }
  }

  // ── Create: input step submit (email → resolve) ───────────────────────────
  async function onInputSubmit(data: InputFormData) {
    try {
      const payload: { email: string; event_id?: string } = { email: data.email };
      if (eventId) payload.event_id = eventId;
      const res = await axiosInstance.post<{
        instructor_id: string;
        claim_status: string;
        created: boolean;
        name?: string | null;
        image_id?: string | null;
        resolution_type: ResolutionType;
        is_owned: boolean;
      }>("/instructors/resolve", payload);

      if (!res.data.created) {
        // Existing instructor found — use name/image from resolve response
        setResolvedPreview({
          instructor_id: res.data.instructor_id,
          claim_status: res.data.claim_status,
          name: res.data.name ?? data.email,
          image_id: res.data.image_id ?? null,
          resolution_type: res.data.resolution_type,
          is_owned: res.data.is_owned,
        });
        setCreateStep("preview");
      } else {
        // New stub created — go to details step
        setResolvedPreview({
          instructor_id: res.data.instructor_id,
          claim_status: res.data.claim_status,
          name: "",
          image_id: null,
          resolution_type: res.data.resolution_type,
          is_owned: true,
        });
        setCreateStep("details");
      }
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      toast({ description: `Błąd: ${detail || "Nieznany błąd"}`, variant: "destructive" });
    }
  }

  // ── Create: preview step — connect ───────────────────────────────────────
  function handleConnect() {
    if (!resolvedPreview) return;
    const instructor: Instructor = {
      id: resolvedPreview.instructor_id,
      name: resolvedPreview.name,
      image_id: resolvedPreview.image_id,
      claim_status: resolvedPreview.claim_status,
      is_owned: resolvedPreview.is_owned,
      is_foreign: !resolvedPreview.is_owned,
    };
    const hint =
      resolvedPreview.resolution_type === "existing_instructor"
        ? "Istniejący profil instruktora zostanie dodany do wydarzenia."
        : "Instruktor dodany.";
    toast({ description: hint });
    onInstructorSaved(instructor);
    onClose();
  }

  // ── Create: details step submit (patch stub) ──────────────────────────────
  async function onDetailsSubmit(data: DetailsFormData) {
    if (!resolvedPreview) return;
    if (isUploadingDetailsImage) {
      toast({ description: "Poczekaj na zakończenie przesyłania zdjęcia." });
      return;
    }
    try {
      const payload: { name: string; short_bio?: string; image_id?: string | null } = {
        name: data.name,
      };
      if (data.short_bio) payload.short_bio = data.short_bio;
      if (detailsImageId) payload.image_id = detailsImageId;

      await axiosInstance.put(`/instructors/${resolvedPreview.instructor_id}`, payload);

      const instructor: Instructor = {
        id: resolvedPreview.instructor_id,
        name: data.name,
        image_id: detailsImageId,
        claim_status: resolvedPreview.claim_status,
        is_owned: true,
        is_foreign: false,
      };
      toast({ description: "Instruktor dodany!" });
      onInstructorSaved(instructor);
      onClose();
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      toast({ description: `Błąd: ${detail || "Nieznany błąd"}`, variant: "destructive" });
    }
  }

  const CLAIM_STATUS_LABEL: Record<string, string> = {
    claimed: "Ma konto",
    invited: "Zaproszony/a",
    invitable: "Bez konta",
    legacy: "Bez e-maila",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal>
      <DialogContent className="flex flex-col w-full h-full md:h-auto rounded-none md:rounded-lg overflow-y-scroll max-h-screen max-w-full md:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "Dodaj instruktora" : "Edytuj instruktora"}</DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? createStep === "picker"
                ? "Wybierz instruktora z zapisanej listy albo dodaj nowego przez e-mail."
                : createStep === "preview"
                  ? "Znaleźliśmy istniejącego instruktora."
                  : createStep === "details"
                    ? "Uzupełnij podstawowe dane nowego instruktora."
                    : alreadyClaimed
                      ? "Podaj e-mail instruktora — sprawdzimy, czy jest już w systemie."
                      : "Podaj e-mail instruktora lub zaznacz 'To ja', jeśli to Ty prowadzisz zajęcia."
              : "Zaktualizuj dane instruktora."}
          </DialogDescription>
        </DialogHeader>

        {isCreateMode ? (
          <>
            {/* ── Step: picker ───────────────────────────────────────── */}
            {createStep === "picker" && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  {pickerInstructors.map((instructor) => (
                    <button
                      key={instructor.id}
                      type="button"
                      className="w-full flex items-center gap-3 rounded-md border p-3 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        onInstructorSaved(instructor);
                        onClose();
                      }}
                    >
                      <WyImage
                        src={
                          instructor.image_id ||
                          `https://avatar.vercel.sh/${instructor.name.replace(/\s+/g, "_")}.png?size=40`
                        }
                        alt={instructor.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover border min-h-[40px] flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{instructor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {instructor.is_owned ? "Twój profil" : "Z zapisanej listy"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Anuluj
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setCreateStep("input")}>
                    Dodaj przez e-mail
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* ── Step: input ─────────────────────────────────────────── */}
            {createStep === "input" && (
              <form onSubmit={inputForm.handleSubmit(onInputSubmit)} className="space-y-4 py-2">
                {/* "It's me" — hidden when user already has a claimed/linked instructor */}
                {!alreadyClaimed && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 rounded-md border p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={handleItsMe}
                  >
                    <Checkbox id="isMe" checked={false} tabIndex={-1} />
                    <Label
                      htmlFor="isMe"
                      className="cursor-pointer text-sm font-medium pointer-events-none"
                    >
                      To ja — jestem instruktorem tego wydarzenia
                    </Label>
                  </button>
                )}

                <div className="space-y-1">
                  <Label htmlFor="add-email">E-mail instruktora</Label>
                  <Input
                    id="add-email"
                    type="email"
                    placeholder="instruktor@example.com"
                    {...inputForm.register("email")}
                  />
                  {inputForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {inputForm.formState.errors.email.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sprawdzimy e-mail i dodamy instruktora — pojawi się na wydarzeniu od razu.
                  </p>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {pickerInstructors.length > 0 && (
                    <Button type="button" variant="ghost" onClick={() => setCreateStep("picker")}>
                      ← Wróć do listy
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={onClose}>
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={inputForm.formState.isSubmitting}>
                    {inputForm.formState.isSubmitting ? "Sprawdzam..." : "Dalej →"}
                  </Button>
                </DialogFooter>
              </form>
            )}

            {/* ── Step: preview (existing instructor found) ───────────── */}
            {createStep === "preview" && resolvedPreview && (
              <div className="space-y-4 py-2">
                <div className="rounded-lg border p-4 flex items-center gap-3">
                  <WyImage
                    src={
                      resolvedPreview.image_id ||
                      `https://avatar.vercel.sh/${resolvedPreview.name.replace(/\s+/g, "_")}.png?size=48`
                    }
                    alt={resolvedPreview.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover border min-h-[48px] flex-shrink-0"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-medium truncate">{resolvedPreview.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CLAIM_STATUS_LABEL[resolvedPreview.claim_status] ??
                        resolvedPreview.claim_status}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ten instruktor jest już na joga.yoga. Dodamy istniejący profil do wydarzenia bez
                  wysyłania nowego zaproszenia.
                </p>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCreateStep("input");
                      inputForm.reset({ email: "" });
                    }}
                  >
                    ← Zmień e-mail
                  </Button>
                  <Button type="button" onClick={handleConnect}>
                    Połącz z wydarzeniem
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* ── Step: details (new stub — fill in name + photo + bio) ── */}
            {createStep === "details" && (
              <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  {resolvedPreview?.resolution_type === "existing_user"
                    ? "Wyślemy e-mail z prośbą o przejęcie profilu instruktora. Instruktor pojawi się na wydarzeniu od razu."
                    : "Wyślemy zaproszenie do dołączenia i przejęcia profilu instruktora. Instruktor pojawi się na wydarzeniu od razu."}
                </p>
                <div className="space-y-1">
                  <Label htmlFor="details-name">Imię i nazwisko *</Label>
                  <Input
                    id="details-name"
                    placeholder="np. Anna Kowalska"
                    {...detailsForm.register("name")}
                  />
                  {detailsForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {detailsForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="details-bio">
                    Zdanie o sobie{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (maks. 120 znaków, opcjonalnie)
                    </span>
                  </Label>
                  <Textarea
                    id="details-bio"
                    rows={2}
                    placeholder="np. Certyfikowana instruktorka Hatha z 10-letnim doświadczeniem"
                    {...detailsForm.register("short_bio")}
                  />
                  {detailsForm.formState.errors.short_bio && (
                    <p className="text-xs text-destructive">
                      {detailsForm.formState.errors.short_bio.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="details-photo">Zdjęcie profilowe (opcjonalnie)</Label>
                  {detailsPreviewUrl ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={detailsPreviewUrl}
                        alt="Podgląd"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          URL.revokeObjectURL(detailsPreviewUrl);
                          setDetailsPreviewUrl(null);
                          setDetailsImageId(null);
                        }}
                      >
                        Usuń
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="details-photo"
                      type="file"
                      accept="image/*"
                      disabled={isUploadingDetailsImage}
                      onChange={handleDetailsImageSelect}
                    />
                  )}
                  {isUploadingDetailsImage && (
                    <p className="text-xs text-muted-foreground">Przesyłanie...</p>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    disabled={detailsForm.formState.isSubmitting || isUploadingDetailsImage}
                  >
                    {detailsForm.formState.isSubmitting ? "Zapisuję..." : "Dodaj instruktora"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        ) : (
          <>
            {showEditEmailField && (
              <div className="space-y-2 py-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-instructor-email">E-mail instruktora (opcjonalnie)</Label>
                  <Input
                    id="edit-instructor-email"
                    type="email"
                    placeholder="instruktor@example.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Potrzebny do wysłania zaproszenia — nie jest wyświetlany publicznie.
                  </p>
                </div>
                {editEmail.trim() &&
                  (editClaimStatus === "invitable" || editClaimStatus === "invited") && (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 gap-2">
                      <p className="text-xs text-muted-foreground">
                        {editClaimStatus === "invited"
                          ? "Zaproszenie oczekuje na odpowiedź."
                          : "Instruktor nie przejął jeszcze profilu."}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleReinvite}
                        disabled={isInviting}
                      >
                        {isInviting
                          ? "Wysyłam..."
                          : editClaimStatus === "invited"
                            ? "Wyślij ponownie"
                            : "Wyślij zaproszenie"}
                      </Button>
                    </div>
                  )}
              </div>
            )}
            <InstructorForm
              form={editForm}
              onSubmit={onEditSubmit}
              currentImageId={currentImageId}
              imagePreviewUrl={imagePreviewUrl}
              isUploadingImage={isUploadingImage}
              newlyUploadedImageId={newlyUploadedImageId}
              removeCurrentImage={removeCurrentImage}
              onRemoveImage={handleRemoveImageClick}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={editForm.formState.isSubmitting || isUploadingImage}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                onClick={editForm.handleSubmit(onEditSubmit)}
                disabled={editForm.formState.isSubmitting || isUploadingImage}
              >
                {editForm.formState.isSubmitting || isUploadingImage
                  ? "Zapisywanie..."
                  : "Zapisz zmiany"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
