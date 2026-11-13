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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";

import { SportCardImage } from "@/components/booking/SportCardImage";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { SocialLinksField } from "@/components/common/SocialLinksField";
import { WyImage } from "@/components/custom/WyImage";
import { DashboardFooter } from "@/components/layout/DashboardFooter";
import { PhoneVerificationDialog } from "@/components/partner/PhoneVerificationDialog";
import type { StudioCandidate, StudioIdentity } from "@/components/studio-cta/StudioDiscovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectionChip } from "@/components/ui/selection-chip";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { amenityIcon } from "@/lib/amenityIcons";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { sportCardImage } from "@/lib/sportCardImages";
import {
  readSetup,
  removeSetup,
  type SetupSession,
  untouchedDraftValues,
  writeSetup,
} from "@/lib/studioSetup";
import { cn } from "@/lib/utils";

import { EventPhotosSection } from "../../../components/EventForm/components/EventPhotosSection";
import { EventHelpBarProvider } from "../../../components/EventForm/contexts/EventHelpBarContext";
import { OfferPassRow } from "./OfferPassRow";
import { PassModal } from "./PassModal";
import { SportCardModal } from "./SportCardModal";
import { StudioDashboardSidebar } from "./StudioDashboardSidebar";
import { draftFormValues, type StudioDraftProfile } from "./studioDraftPrefill";
import {
  buildStudioPayload,
  emptyStudioFormValues,
  formValuesFromStudio,
  studioDraftSchema,
  studioPublishSchema,
} from "./studioFormModel";
import { StudioLogoField } from "./StudioLogoField";
import type {
  Amenity,
  StudioApiResponse,
  StudioFormValues,
  StudioLocation,
  StudioPass,
  StudioRoom,
  StudioSportCard,
} from "./types";

interface StudioFormProps {
  routeId: string;
  initialName?: string;
}

type SubmitIntent = "draft" | "publish";

const fieldHeadingClass =
  "mb-1 flex text-xl font-medium leading-7 tracking-normal text-gray-800 md:text-3xl md:leading-9";

const fieldDescriptionClass =
  "mb-2 flex text-sm font-normal leading-snug text-gray-500 md:pt-2 md:text-xl";

const fieldTextClass = "text-base font-normal leading-snug md:text-xl";

function Section({
  title,
  children,
  id,
  className,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} aria-label={title} className={cn("py-4 md:py-5", className)}>
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
    "h-auto min-h-12 rounded-md bg-white px-4 py-3 shadow-none focus-visible:ring-brand-green md:min-h-14",
    fieldTextClass,
    hasError && "border-destructive focus-visible:ring-destructive",
  );
}

function textAreaClass(hasError?: boolean) {
  return cn(
    "min-h-24 rounded-md bg-white px-4 py-3 shadow-none focus-visible:ring-brand-green",
    fieldTextClass,
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

export function StudioForm({ routeId, initialName = "" }: StudioFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const draftToken = params.get("draft");
  const importJob = params.get("importJob");
  const importBranch = params.get("importBranch");
  const { user } = useAuth();
  const ownerId = user?.id || "";
  const [setupKey, setSetupKey] = useState(
    params.get("setup") || draftToken || (routeId === "create" ? "" : routeId),
  );
  const contextKey = `${ownerId}:${setupKey}:${routeId}`;
  const [reviewInput, setReviewInput] = useState<SetupSession | null>(null);
  const touchedFields = useRef(new Set<keyof StudioFormValues>());
  const sourceIdentity = useRef<StudioIdentity | undefined>(undefined);
  const operationKey = useRef("");
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const restoredDirty = useRef<(keyof StudioFormValues)[]>([]);
  const [identity, setIdentity] = useState<StudioIdentity | undefined>();
  const [duplicateAck, setDuplicateAck] = useState<string | undefined>();
  const [duplicateResult, setDuplicateResult] = useState<{
    matches: StudioCandidate[];
    fingerprint: string;
    requires_choice?: boolean;
  } | null>(null);
  const [draftCity, setDraftCity] = useState("");
  const [publicSource, setPublicSource] = useState<{ slug: string } | null>(null);
  const [enrichment, setEnrichment] = useState<string | null>(null);
  const { toast } = useToast();
  const { refetch: refetchCapabilities } = usePartnerCapabilities();
  const savingRef = useRef(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const isCreateRoute = routeId === "create";
  const [studioId, setStudioId] = useState<string | null>(isCreateRoute ? null : routeId);
  const pendingPublicClaim = !studioId && Boolean(publicSource);
  const [isLoading, setIsLoading] = useState(!isCreateRoute);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIsPublic, setCurrentIsPublic] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [directUploadError, setDirectUploadError] = useState<string | null>(null);
  const [isPhoneVerificationOpen, setIsPhoneVerificationOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File }[]>([]);
  const resolverSchemaRef = useRef(studioDraftSchema);
  const [migrationPending, setMigrationPending] = useState(false);
  const submitIntentRef = useRef<SubmitIntent>("draft");

  // Amenities catalogue
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  // Room input
  const [roomInput, setRoomInput] = useState("");
  // Pass modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [editingPass, setEditingPass] = useState<StudioPass | null>(null);
  const [editingPassIndex, setEditingPassIndex] = useState<number | null>(null);
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
    getFieldState,
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
  }, []);

  useEffect(() => {
    if (setupKey) return;
    const key = crypto.randomUUID();
    setSetupKey(key);
    const query = new URLSearchParams(params.toString());
    query.set("setup", key);
    router.replace(`/account/partner/studio/create?${query}`);
  }, [setupKey, params, router]);

  // Restore only after the session/account is known, before persistence is enabled.
  useEffect(() => {
    if (!isCreateRoute || !setupKey || !ownerId) return;
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
    const saved = readSetup(setupKey, ownerId);
    operationKey.current = saved?.operationKey || crypto.randomUUID();
    restoredDirty.current = saved?.dirtyFields || [];
    touchedFields.current = new Set(restoredDirty.current);
    setIdentity(saved?.identity);
    setDuplicateAck(saved?.duplicateAck);
    setDraftCity(saved?.city || "");
    reset(saved?.values || { ...emptyStudioFormValues, name: initialName });
    setReadyKey(contextKey);
  }, [isCreateRoute, setupKey, ownerId, contextKey, initialName, reset]);

  useEffect(() => {
    if (readyKey !== contextKey || !ownerId || !setupKey) return;
    writeSetup(
      setupKey,
      {
        operationKey: operationKey.current,
        studioId: studioId || undefined,
        values,
        identity,
        duplicateAck,
        city: draftCity,
        dirtyFields: [
          ...new Set([
            ...restoredDirty.current,
            ...touchedFields.current,
            ...(Object.keys(values) as (keyof StudioFormValues)[]).filter(
              (field) => getFieldState(field).isDirty,
            ),
          ]),
        ],
      },
      ownerId,
    );
  }, [
    values,
    identity,
    duplicateAck,
    draftCity,
    studioId,
    setupKey,
    ownerId,
    readyKey,
    contextKey,
    getFieldState,
  ]);

  useEffect(() => {
    if (!draftToken || !isCreateRoute || readyKey !== contextKey || studioId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const { data } = await axiosInstance.get<{
          profile: StudioDraftProfile;
          identity?: StudioIdentity;
          enrichment_state: string | null;
          source_public?: boolean;
          source_slug?: string | null;
        }>(`/studio-setup/drafts/${draftToken}`);
        if (!active) return;
        sourceIdentity.current = data.identity;
        setIdentity((chosen) => chosen || data.identity);
        setDraftCity(data.profile.city || "");
        setEnrichment(data.enrichment_state);
        setPublicSource(data.source_public && data.source_slug ? { slug: data.source_slug } : null);
        const incoming = draftFormValues(data.profile);
        if (data.source_public && data.source_slug)
          setValue("slug", data.source_slug, { shouldDirty: false });
        const protectedFields = new Set([
          ...touchedFields.current,
          ...restoredDirty.current,
          ...(Object.keys(getValues()).filter(
            (field) => getFieldState(field as keyof StudioFormValues).isDirty,
          ) as (keyof StudioFormValues)[]),
        ]);
        const focused = document.activeElement;
        const activeField =
          focused?.getAttribute("name") ||
          focused?.closest("[data-setup-field]")?.getAttribute("data-setup-field") ||
          focused?.id;
        const available = untouchedDraftValues(incoming, protectedFields, activeField);
        for (const field of Object.keys(available) as (keyof StudioFormValues)[]) {
          setValue(field, available[field] as StudioFormValues[typeof field], {
            shouldDirty: false,
          });
        }
        if (data.enrichment_state === "pending") timer = setTimeout(() => void load(), 2500);
      } catch {
        if (active) setEnrichment("failed");
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    draftToken,
    isCreateRoute,
    getFieldState,
    getValues,
    setValue,
    initialName,
    readyKey,
    contextKey,
    studioId,
  ]);

  // Surface text suggestions while editing; final writes recheck under the same lock.
  useEffect(() => {
    const city = values.location?.city || draftCity;
    if (identity || !values.name?.trim() || !(values.address || city)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      axiosInstance
        .post<{
          matches: StudioCandidate[];
          fingerprint: string;
          requires_choice: boolean;
        }>(
          "/studio-setup/duplicates",
          {
            name: values.name,
            address: values.address,
            city,
            latitude: values.location?.latitude,
            longitude: values.location?.longitude,
            place_id: values.location?.google_place_id,
            exclude_studio_id: studioId,
          },
          { signal: controller.signal },
        )
        .then(({ data }) => {
          if (!controller.signal.aborted) {
            setDuplicateResult(
              data.requires_choice && data.fingerprint !== duplicateAck ? data : null,
            );
          }
        })
        .catch(() => {
          /* Final save remains authoritative if suggestions are unavailable. */
        });
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    values.name,
    values.address,
    values.location?.city,
    values.location?.latitude,
    values.location?.longitude,
    values.location?.google_place_id,
    draftCity,
    studioId,
    identity,
    duplicateAck,
  ]);

  // Load existing studio
  useEffect(() => {
    if (!studioId || !ownerId) return;
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    axiosInstance
      .get<StudioApiResponse>(`/studios/${studioId}`)
      .then(async (response) => {
        setMigrationPending(response.data.migration_pending === true);
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
        if (!active) return;
        const saved = readSetup(setupKey, ownerId);
        const sameStudio = saved?.studioId === studioId;
        operationKey.current = sameStudio ? saved.operationKey : crypto.randomUUID();
        restoredDirty.current = sameStudio ? saved.dirtyFields || [] : [];
        touchedFields.current = new Set(restoredDirty.current);
        reset(sameStudio && saved.values ? saved.values : formValues);
        if (params.get("reviewSetup"))
          setReviewInput(readSetup(params.get("reviewSetup")!, ownerId));
        setReadyKey(contextKey);
      })
      .catch(() => {
        setLoadError("Nie udało się załadować studia.");
      })
      .finally(() => setIsLoading(false));
    return () => {
      active = false;
    };
  }, [studioId, reset, ownerId, setupKey, contextKey, params]);

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
    touchedFields.current.add(name);
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

    if (savingRef.current) return;
    savingRef.current = true;
    setIsSavingBusiness(true);
    try {
      await saveValidatedStudio(intent);
    } finally {
      savingRef.current = false;
      setIsSavingBusiness(false);
    }
  }

  async function saveValidatedStudio(intent: SubmitIntent) {
    const values = getValues();
    const payload = buildStudioPayload(values);
    if (intent === "publish") payload.is_listed = true;
    try {
      let response;
      if (studioId && !identity) {
        response = await axiosInstance.put<StudioApiResponse>(`/studios/${studioId}`, {
          ...payload,
          duplicate_ack: duplicateAck,
        });
      } else {
        response = await axiosInstance.post<StudioApiResponse>("/studio-setup/save", {
          operation_key: operationKey.current || (operationKey.current = crypto.randomUUID()),
          studio_id: studioId,
          profile: payload,
          draft_token:
            !identity ||
            !sourceIdentity.current ||
            (identity.kind === sourceIdentity.current.kind &&
              identity.id === sourceIdentity.current.id)
              ? draftToken
              : null,
          identity,
          duplicate_ack: duplicateAck,
          city: values.location?.city || draftCity,
        });
        removeSetup(setupKey, ownerId);
        setReadyKey(null);
        refetchCapabilities();
        setIdentity(undefined);
        operationKey.current = "";
        setStudioId(response.data.id);
        router.replace(
          `/account/partner/studio/${response.data.id}/edit${importJob ? `?${new URLSearchParams({ importJob, ...(importBranch ? { importBranch } : {}) })}` : ""}`,
        );
      }
      removeSetup(setupKey, ownerId);
      touchedFields.current.clear();
      restoredDirty.current = [];
      setCurrentIsPublic(response.data.is_listed !== false);
      reset({
        ...values,
        is_public: response.data.is_listed !== false,
        is_listed: response.data.is_listed !== false,
      });
      toast({
        description: intent === "publish" ? "Studio opublikowane." : "Zmiany zapisane.",
      });
      router.refresh();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (detail?.code === "studio_match_required") {
        setDuplicateResult(detail);
        return;
      }
      if (
        detail?.error_code === "PHONE_VERIFICATION_REQUIRED" ||
        detail?.code === "phone_verification_required"
      ) {
        setIsPhoneVerificationOpen(true);
        return;
      }
      toast({
        title: intent === "publish" ? "Błąd publikacji" : "Błąd zapisu",
        description: (typeof detail === "string" && detail) || "Spróbuj ponownie.",
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
          <p className="text-base font-medium">{loadError}</p>
          <Button size="action" className="mt-4" onClick={() => router.refresh()}>
            Spróbuj ponownie
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <form
        className="min-h-screen bg-background"
        onSubmit={(e) => e.preventDefault()}
        onChangeCapture={(event) => {
          const target = event.target as HTMLElement;
          const field =
            target.getAttribute("name") ||
            target.closest("[data-setup-field]")?.getAttribute("data-setup-field");
          if (field && field in getValues())
            touchedFields.current.add(field as keyof StudioFormValues);
        }}
      >
        {migrationPending && (
          <div className="mx-auto max-w-5xl rounded-lg border bg-amber-50 p-4 text-sm">
            To prywatny szkic z importu. Zapisz zmiany, a następnie wróć do{" "}
            <Link className="underline font-medium" href="/account/partner/studio/import/fitssey">
              podsumowania importu
            </Link>
            , aby sprawdzić i opublikować studio.
          </div>
        )}
        <div className="flex flex-col md:flex-row">
          <StudioDashboardSidebar isLoading={isLoading} />

          <div className="flex-1 min-w-0">
            <div className="px-4 md:px-8 mx-auto max-w-[600px] pb-20">
              {reviewInput?.values && (
                <div className="my-4 rounded border p-3">
                  <p>
                    Zachowano niezapisane dane z poprzedniego formularza. Możesz zastosować swoje
                    zmiany i sprawdzić je przed zapisem.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      for (const field of reviewInput.dirtyFields || []) {
                        setDirtyValue(field, reviewInput.values![field]);
                      }
                      setReviewInput(null);
                    }}
                  >
                    Zastosuj moje zmiany
                  </Button>
                </div>
              )}
              <div className="my-4 space-y-3">
                {importJob && (
                  <Link
                    className="text-sm underline"
                    href={`/account/partner/studio/import/fitssey${importJob ? `/${encodeURIComponent(importJob)}` : ""}?${new URLSearchParams({ ...(studioId ? { studioId, setup: setupKey } : { setup: setupKey, ...(draftToken ? { draft: draftToken } : {}) }), ...(importBranch ? { importBranch } : {}) }).toString()}`}
                  >
                    Wróć do importu
                  </Link>
                )}
                {enrichment === "pending" && (
                  <p role="status">Uzupełniamy dane studia. Możesz już je edytować.</p>
                )}
                {enrichment === "failed" && (
                  <p role="status">Nie udało się uzupełnić danych. Możesz zrobić to ręcznie.</p>
                )}
                {duplicateResult && (
                  <section className="rounded border p-3" aria-label="Czy to Twoje studio?">
                    <h2>Czy to Twoje studio?</h2>
                    {duplicateResult.matches.length === 0 && (
                      <p>
                        Sprawdź nazwę i adres. Jeśli tworzysz osobną lokalizację, potwierdź wybór
                        poniżej.
                      </p>
                    )}
                    {duplicateResult.matches.map((item) => (
                      <div key={`${item.kind}:${item.id}`} className="my-2">
                        <p>
                          {item.name} · {item.city} · {item.address}
                        </p>
                        {item.action === "managed" ? (
                          <p>Profil jest już zarządzany</p>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (item.action === "edit") {
                                router.push(
                                  `/account/partner/studio/${item.id}/edit?reviewSetup=${encodeURIComponent(setupKey)}`,
                                );
                                return;
                              }
                              setIdentity({ kind: item.kind, id: item.id });
                              setDuplicateResult(null);
                            }}
                          >
                            To moje studio
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDuplicateAck(duplicateResult.fingerprint);
                        setDuplicateResult(null);
                      }}
                    >
                      To inne studio
                    </Button>
                  </section>
                )}
              </div>
              {/* ── Section 1: Podstawy ── */}
              <Section id="studio-basics-section" title="Podstawy">
                <div className="space-y-8 md:space-y-10">
                  {/* Logo — V1's compact tile + "Zmień logo", not a full dropzone. */}
                  <div className="[&>div>label]:flex [&>div>label]:text-xl [&>div>label]:leading-7 [&>div>label]:tracking-normal [&>div>label]:text-gray-800 md:[&>div>label]:text-3xl md:[&>div>label]:leading-9 [&>div>p]:flex [&>div>p]:text-sm [&>div>p]:font-normal [&>div>p]:leading-snug [&>div>p]:text-gray-500 md:[&>div>p]:pt-2 md:[&>div>p]:text-xl">
                    <StudioLogoField
                      studioName={values.name}
                      imageId={values.image_id}
                      previewUrl={logoPreviewUrl}
                      isUploading={isUploadingLogo}
                      onFileSelect={handleLogoFileSelect}
                      onRemove={() => {
                        setLogoPreviewUrl(null);
                        setDirtyValue("image_id", null);
                      }}
                    />
                  </div>

                  <div data-error-field="name">
                    <label className={fieldHeadingClass} htmlFor="name">
                      Nazwa studia
                    </label>
                    <p className={fieldDescriptionClass}>
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
                    <label className={fieldHeadingClass} htmlFor="slug">
                      Adres URL studia
                    </label>
                    <p className={fieldDescriptionClass}>
                      Unikalny identyfikator studia, który jest częścią linku do Twojej strony
                      publicznej.
                    </p>
                    <Input
                      id="slug"
                      readOnly={pendingPublicClaim}
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
                      <p className="min-w-0 break-all text-sm text-muted-foreground">
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
                    <label className={fieldHeadingClass} htmlFor="description">
                      Opis
                    </label>
                    <p className={fieldDescriptionClass}>
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

                  {/* Widoczność */}
                  {!pendingPublicClaim && (
                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {values.is_listed ? "Strona publiczna" : "Strona ukryta"}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {values.is_listed
                            ? "Studio jest widoczne w wynikach wyszukiwania Google"
                            : "Studio nie jest indeksowane przez wyszukiwarki"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={migrationPending}
                        onClick={() => setDirtyValue("is_listed", !values.is_listed)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          values.is_listed ? "bg-b2b-green-text" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            values.is_listed ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </Section>

              {/* ── Section 2: Lokalizacja ── */}
              <Section
                id="studio-location-section"
                title="Lokalizacja"
                className="border-t border-border"
              >
                <div className="space-y-8 md:space-y-10">
                  <div
                    data-setup-field="address"
                    data-error-field="location_id"
                    className="relative"
                  >
                    <label className={fieldHeadingClass}>Adres</label>
                    <p className={fieldDescriptionClass}>
                      Adres studia wyświetlany na profilu z mapą — pomaga uczestnikom Was znaleźć
                    </p>
                    {values.location?.id && !isEditingLocation ? (
                      <div className="flex min-h-12 items-center gap-3 rounded-md border px-4 py-3 md:min-h-14">
                        <MapPin className="size-4 shrink-0 text-muted-foreground" />
                        <span className={cn("min-w-0 flex-1", fieldTextClass)}>
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
                          <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            name="address"
                            value={isEditingLocation ? locationQuery : values.address || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocationQuery(val);
                              if (!isEditingLocation) setDirtyValue("address", val);
                              setIsSearchingLocation(true);
                              if (locationDebounceRef.current)
                                clearTimeout(locationDebounceRef.current);
                              locationDebounceRef.current = setTimeout(
                                () => fetchLocationSuggestions(val),
                                300,
                              );
                            }}
                            className={cn(fieldClass(Boolean(errors.address)), "pl-11")}
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
                    <label className={fieldHeadingClass}>Sale</label>
                    <p className={fieldDescriptionClass}>
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
                        size="action"
                        variant="outline"
                        onClick={addRoom}
                        className="h-auto min-h-12 shrink-0 md:min-h-14"
                      >
                        Dodaj
                      </Button>
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── Section 3: Oferta ── */}
              <Section id="studio-oferta-section" title="Oferta" className="border-y border-border">
                <div className="space-y-8 md:space-y-10">
                  {/* Drop-in price */}
                  <div data-error-field="drop_in_price">
                    <label className={fieldHeadingClass}>Cena za jedno wejście</label>
                    <p className={fieldDescriptionClass}>
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
                        onValueChange={(value) => {
                          // The Select's hidden native input can emit an empty reset while
                          // restoring the form. No currency option represents that reset.
                          if (value) setDirtyValue("currency", value, true);
                        }}
                      >
                        <SelectTrigger data-setup-field="currency" className={fieldClass()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="[&_[role=option]]:text-base [&_[role=option]]:leading-snug md:[&_[role=option]]:text-xl">
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
                    <label className={fieldHeadingClass}>Karnety</label>
                    <p className={fieldDescriptionClass}>
                      Dodaj dostępne karnety z cenami — uczestnicy zobaczą je na profilu studia
                    </p>
                    <div className="space-y-2">
                      {(values.passes ?? []).map((pass, index) => (
                        <OfferPassRow
                          key={index}
                          pass={pass}
                          currency={values.currency}
                          dropInPrice={
                            values.drop_in_price != null && values.drop_in_price !== ""
                              ? Number(values.drop_in_price)
                              : null
                          }
                          onEdit={() => {
                            setEditingPass(pass);
                            setEditingPassIndex(index);
                            setIsPassModalOpen(true);
                          }}
                          onRemove={() => removePass(index)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 flex min-h-10 items-center gap-3 text-base font-medium text-brand-blue"
                      onClick={() => {
                        setEditingPass(null);
                        setEditingPassIndex(null);
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
                        if (editingPassIndex !== null) {
                          setDirtyValue(
                            "passes",
                            current.map((p, index) => (index === editingPassIndex ? pass : p)),
                          );
                        } else {
                          setDirtyValue("passes", [...current, pass]);
                        }
                      }}
                      studioId={studioId}
                      studioName={values.name}
                      dropInPrice={
                        values.drop_in_price !== "" ? Number(values.drop_in_price) : null
                      }
                      currency={values.currency || "PLN"}
                      editPass={editingPass}
                    />
                  </div>

                  {/* Karty sportowe tri-state */}
                  <div>
                    <label className={fieldHeadingClass}>Akceptujecie karty sportowe?</label>
                    <p className={fieldDescriptionClass}>
                      Informacja widoczna na profilu studia — uczestnicy często szukają studiów
                      akceptujących ich kartę
                    </p>
                    <SegmentedToggle
                      className="mb-3"
                      value={values.accepts_sport_cards}
                      onChange={(next) => setDirtyValue("accepts_sport_cards", next)}
                      options={[
                        { label: "Nie", value: false },
                        { label: "Tak", value: true },
                      ]}
                    />
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
                              {sportCardImage(
                                sc.sport_card?.slug,
                                sc.sport_card?.photo || sc.photo,
                              ) ? (
                                <SportCardImage
                                  src={
                                    sportCardImage(
                                      sc.sport_card?.slug,
                                      sc.sport_card?.photo || sc.photo,
                                    )!
                                  }
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
                                <p className="text-sm font-medium">
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

              <Section id="studio-details-section" title="Udogodnienia i media społecznościowe">
                <div className="space-y-8 md:space-y-10">
                  {/* Udogodnienia (amenities) toggle chips */}
                  <div>
                    <label className={fieldHeadingClass}>Udogodnienia</label>
                    <p className={fieldDescriptionClass}>
                      Zaznacz co oferuje Twoje studio — te informacje pomagają uczestnikom przy
                      wyborze
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allAmenities.map((amenity) => {
                        const Icon = amenityIcon(amenity.icon_id);
                        return (
                          <SelectionChip
                            key={amenity.id}
                            selected={(values.amenity_ids ?? []).includes(amenity.id)}
                            icon={<Icon />}
                            onClick={() => toggleAmenity(amenity.id)}
                          >
                            {amenity.name}
                          </SelectionChip>
                        );
                      })}
                    </div>
                  </div>

                  {/* Social links */}
                  <div>
                    <label className={fieldHeadingClass}>Media społecznościowe</label>
                    <p className={fieldDescriptionClass}>
                      Wklej linki do Instagrama, Facebooka i innych profili studia — pojawią się
                      jako ikony na publicznym profilu
                    </p>
                    <div
                      data-setup-field="social_links"
                      className="[&_input]:h-auto [&_input]:min-h-12 [&_input]:px-4 [&_input]:py-3 [&_input]:text-base [&_input]:font-normal [&_input]:leading-snug md:[&_input]:min-h-14 md:[&_input]:text-xl [&>div>div:first-child>button]:h-auto"
                    >
                      <SocialLinksField
                        value={values.social_links ?? []}
                        onChange={(next) => setDirtyValue("social_links", next)}
                      />
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── Section 5: Zdjęcia ── */}
              <Section
                id="studio-photos-section"
                title="Zdjęcia"
                className="border-t border-border [&>#event-photos-section]:pt-0"
              >
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
          viewPublicHref={
            pendingPublicClaim
              ? `/studio/${publicSource!.slug}`
              : !migrationPending && values.slug
                ? `/studio/${values.slug}`
                : undefined
          }
          viewPublicLabel="Zobacz profil"
          viewPublicLabelShort="Zobacz"
          viewPublicIcon={<ExternalLink className="size-4" />}
          showPublishButton={
            !migrationPending && !pendingPublicClaim && (!draftToken || enrichment !== null)
          }
          isPublished={currentIsPublic || pendingPublicClaim}
          isPublishing={isSubmitting || isSavingBusiness}
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
          isSaveDisabled={isSubmitting || isSavingBusiness}
        />
      </form>

      <PhoneVerificationDialog
        open={isPhoneVerificationOpen}
        onOpenChange={setIsPhoneVerificationOpen}
        onVerified={() => persist(submitIntentRef.current)}
      />
    </main>
  );
}
