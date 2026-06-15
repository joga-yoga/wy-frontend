"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  BadgeCheck,
  ExternalLink,
  FileText,
  Laptop,
  Loader2,
  MapPin,
  Plus,
  Save,
  Send,
  Shuffle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";

import { DashboardFooter } from "@/components/layout/DashboardFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

import { EventPhotosSection } from "../../../components/EventForm/components/EventPhotosSection";
import { EventVisibilitySection } from "../../../components/EventForm/components/EventVisibilitySection";
import { EventHelpBarProvider } from "../../../components/EventForm/contexts/EventHelpBarContext";
import { CourseDashboardSidebar } from "./CourseDashboardSidebar";
import { CourseDateField } from "./CourseDateField";
import {
  buildCoursePayload,
  CERTIFICATION_DESIGNATIONS,
  CERTIFICATION_LABELS,
  courseDraftSchema,
  coursePublishSchema,
  deriveCourseFormat,
  emptyCourseFormValues,
  formValuesFromCourse,
  PAYMENT_METHOD_LABELS,
  setCourseFormat,
} from "./courseFormModel";
import { CourseInstructorsField } from "./CourseInstructorsField";
import { CourseLocationField } from "./CourseLocationField";
import { CourseModuleBuilder } from "./CourseModuleBuilder";
import { MoreDetailsBuilder } from "./MoreDetailsBuilder";
import type {
  CertificationChoice,
  CourseApiResponse,
  CourseFormat,
  CourseFormValues,
  PaymentMethod,
} from "./types";

interface CourseFormProps {
  routeId: string;
}

type SubmitIntent = "draft" | "publish" | "hide";

const formatCards: Array<{
  value: CourseFormat;
  label: string;
  icon: typeof MapPin;
}> = [
  { value: "onsite", label: "Stacjonarnie", icon: MapPin },
  { value: "hybrid", label: "Hybrydowo", icon: Shuffle },
  { value: "online", label: "Online", icon: Laptop },
];

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

export function CourseForm({ routeId }: CourseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isCreateRoute = routeId === "create";
  const [courseId, setCourseId] = useState<string | null>(isCreateRoute ? null : routeId);
  const [isLoading, setIsLoading] = useState(!isCreateRoute);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [isDepositEnabled, setIsDepositEnabled] = useState(false);
  const [isHarmonogramEditing, setIsHarmonogramEditing] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [directUploadError, setDirectUploadError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File }[]>([]);
  const resolverSchemaRef = useRef(courseDraftSchema);
  const submitIntentRef = useRef<SubmitIntent>("draft");

  const resolver = useMemo<Resolver<CourseFormValues>>(
    () => async (values, context, options) => {
      const activeSchema =
        submitIntentRef.current === "publish" ? coursePublishSchema : resolverSchemaRef.current;
      const activeResolver = yupResolver(activeSchema as any) as Resolver<CourseFormValues>;
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
  } = useForm<CourseFormValues>({
    resolver,
    defaultValues: emptyCourseFormValues,
    mode: "onSubmit",
  });

  const values = watch();
  const format = deriveCourseFormat(values);
  const hasRecognizedCertification = values.certificationChoice.startsWith("recognized:");
  const hasHarmonogram = Boolean(values.harmonogram?.trim());

  const watchedImageIds = values.image_ids ?? [];

  // Reset to initial create state on every mount (guards against Next.js router cache state persistence)
  useEffect(() => {
    if (!isCreateRoute) return;
    setCourseId(null);
    setIsLoading(false);
    setLoadError(null);
    setIsPaymentExpanded(false);
    setIsDepositEnabled(false);
    setIsHarmonogramEditing(false);
    setCurrentIsPublic(false);
    setIsUploadingImage(false);
    setDirectUploadError(null);
    setPendingImages([]);
    reset(emptyCourseFormValues);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!courseId) return;
    setIsLoading(true);
    setLoadError(null);
    axiosInstance
      .get<CourseApiResponse>(`/courses/${courseId}`)
      .then((response) => {
        const formValues = formValuesFromCourse(response.data);
        setCurrentIsPublic(Boolean(response.data.is_public));
        setIsPaymentExpanded(
          Boolean(
            response.data.deposit_amount ||
              response.data.payment_terms ||
              response.data.balance_payment_methods?.length,
          ),
        );
        setIsDepositEnabled(Boolean(response.data.deposit_amount));
        setIsHarmonogramEditing(Boolean(response.data.harmonogram));
        reset(formValues);
      })
      .catch(() => {
        setLoadError("Nie udało się załadować kursu.");
      })
      .finally(() => setIsLoading(false));
  }, [courseId, reset]);

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

  function setDirtyValue<K extends keyof CourseFormValues>(
    name: K,
    value: CourseFormValues[K],
    shouldValidate = false,
  ) {
    setValue(name as any, value as any, { shouldDirty: true, shouldValidate });
  }

  async function persist(intent: SubmitIntent) {
    submitIntentRef.current = intent;
    resolverSchemaRef.current = intent === "publish" ? coursePublishSchema : courseDraftSchema;
    const valid = await trigger(undefined, { shouldFocus: true });
    if (!valid) {
      scrollToFirstError();
      toast({
        title: intent === "publish" ? "Nie można opublikować" : "Nie można zapisać",
        description:
          intent === "publish"
            ? "Uzupełnij pola oznaczone błędem. Wpisane dane zostały zachowane."
            : "Do szkicu wystarczy nazwa kursu.",
        variant: "destructive",
      });
      return;
    }

    const isPublic = intent === "publish" ? true : intent === "hide" ? false : currentIsPublic;
    const payload = buildCoursePayload({ ...getValues(), is_public: isPublic });
    try {
      let response;
      if (courseId) {
        response = await axiosInstance.put<CourseApiResponse>(`/courses/${courseId}`, payload);
      } else {
        response = await axiosInstance.post<CourseApiResponse>("/courses", payload);
        setCourseId(response.data.id);
        router.replace(`/profile/courses/${response.data.id}/edit`);
      }
      setCurrentIsPublic(Boolean(response.data.is_public));
      reset({ ...getValues(), is_public: isPublic });
      toast({
        description:
          intent === "publish"
            ? "Kurs opublikowany."
            : intent === "hide"
              ? "Kurs ukryty."
              : "Zmiany zapisane.",
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
          error.response?.data?.detail ||
          error.message ||
          `Nie udało się przesłać pliku: ${pending.file.name}.`;
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <form className="min-h-screen bg-background" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-col md:flex-row">
          <CourseDashboardSidebar isLoading={isLoading} />

          <div className="flex-1 min-w-0">
            <div className="px-4 md:px-8 mx-auto max-w-[600px] pb-20">
              <Section id="course-basics-section" title="Podstawy" first>
                <div className="space-y-4">
                  <div data-error-field="title">
                    <label className="mb-2 block text-base font-semibold" htmlFor="title">
                      Nazwa kursu
                    </label>
                    <Input
                      id="title"
                      {...register("title")}
                      className={fieldClass(Boolean(errors.title))}
                    />
                    <FieldError message={errors.title?.message} />
                  </div>

                  <div data-error-field="description">
                    <label className="mb-2 block text-base font-semibold" htmlFor="description">
                      Krótki opis
                    </label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      className={textAreaClass(Boolean(errors.description))}
                      placeholder="Solidne podstawy klasycznej jogi i metodyki nauczania..."
                      spellCheck={false}
                    />
                    <FieldError message={errors.description?.message} />
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <label className="text-base font-bold" htmlFor="is_teacher_training">
                          To kurs nauczycielski
                        </label>
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">
                          Włącz, jeśli kurs przygotowuje do nauczania jogi (np. RYT 200). Pomaga
                          uczestnikom go znaleźć.
                        </p>
                      </div>
                      <Switch
                        id="is_teacher_training"
                        checked={values.is_teacher_training}
                        onCheckedChange={(checked) => setDirtyValue("is_teacher_training", checked)}
                        className="mt-1 data-[state=checked]:bg-brand-green"
                      />
                    </div>
                  </div>
                </div>
              </Section>

              <Section id="course-format-section" title="Jak odbywa się kurs">
                <div data-error-field="is_onsite" className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {formatCards.map((card) => {
                      const Icon = card.icon;
                      const selected = format === card.value;
                      return (
                        <button
                          type="button"
                          key={card.value}
                          className={cn(
                            "flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border bg-white px-2 text-sm font-semibold",
                            selected && "border-2 border-brand-green bg-muted text-black",
                          )}
                          onClick={() => {
                            const next = setCourseFormat(card.value);
                            setDirtyValue("is_online", next.is_online, true);
                            setDirtyValue("is_onsite", next.is_onsite, true);
                          }}
                        >
                          <Icon className="size-6" />
                          {card.label}
                        </button>
                      );
                    })}
                  </div>
                  <FieldError message={errors.is_onsite?.message} />
                  {values.is_onsite && (
                    <CourseLocationField control={control} errors={errors} setValue={setValue} />
                  )}
                </div>
              </Section>

              <Section id="course-dates-section" title="Terminy">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <CourseDateField
                      id="start_date"
                      label="Początek"
                      value={values.start_date}
                      error={errors.start_date?.message}
                      onChange={(value) => setDirtyValue("start_date", value, true)}
                    />
                    <CourseDateField
                      id="end_date"
                      label="Koniec"
                      value={values.end_date}
                      error={errors.end_date?.message}
                      onChange={(value) => setDirtyValue("end_date", value, true)}
                    />
                  </div>
                  <CourseDateField
                    id="enrollment_closes"
                    label={
                      <>
                        Zapisy do{" "}
                        <span className="font-medium text-muted-foreground">- opcjonalnie</span>
                      </>
                    }
                    value={values.enrollment_closes}
                    error={errors.enrollment_closes?.message}
                    onChange={(value) => setDirtyValue("enrollment_closes", value, true)}
                  />

                  {isHarmonogramEditing || hasHarmonogram ? (
                    <div className="rounded-lg border p-4">
                      {isHarmonogramEditing ? (
                        <div className="space-y-3">
                          <label className="block text-base font-semibold" htmlFor="harmonogram">
                            Harmonogram zajęć
                          </label>
                          <Textarea
                            id="harmonogram"
                            {...register("harmonogram")}
                            placeholder="Zjazdy stacjonarne co drugi weekend..."
                            className="min-h-24 rounded-md text-base"
                            spellCheck={false}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              className="bg-black text-white hover:bg-black/90"
                              onClick={() => setIsHarmonogramEditing(false)}
                            >
                              Gotowe
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 text-left"
                          onClick={() => setIsHarmonogramEditing(true)}
                        >
                          <FileText className="mt-1 size-5 text-brand-green" />
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold">Harmonogram zajęć</p>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">
                              {values.harmonogram}
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex min-h-10 items-center gap-3 text-left text-base font-medium text-brand-blue"
                      onClick={() => setIsHarmonogramEditing(true)}
                    >
                      <Plus className="size-5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        Dodaj harmonogram (jak rozłożone są zajęcia)
                      </span>
                    </button>
                  )}
                </div>
              </Section>

              <Section id="course-program-section" title="Program kursu">
                <CourseModuleBuilder
                  modules={values.modules ?? []}
                  errors={errors}
                  onChange={(modules) => setDirtyValue("modules", modules, true)}
                />
              </Section>

              <Section title="Prowadzący">
                <CourseInstructorsField errors={errors} setValue={setValue} watch={watch} />
              </Section>

              <Section id="course-certificate-section" title="Certyfikat">
                <div className="space-y-4">
                  <div data-error-field="certificationChoice">
                    <label className="mb-2 block text-base font-semibold">
                      Jaki certyfikat otrzymują uczestnicy?
                    </label>
                    <Select
                      value={values.certificationChoice}
                      onValueChange={(nextValue) => {
                        const choice = nextValue as CertificationChoice;
                        setDirtyValue("certificationChoice", choice, true);
                        if (choice !== "school" && choice !== "other") {
                          setDirtyValue("certificationName", "", true);
                        }
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-md text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak certyfikatu</SelectItem>
                        <SelectItem value="school">Certyfikat wewnętrzny szkoły</SelectItem>
                        <SelectItem value="other">Inny certyfikat</SelectItem>
                        {CERTIFICATION_DESIGNATIONS.map((designation) => (
                          <SelectItem key={designation} value={`recognized:${designation}`}>
                            {CERTIFICATION_LABELS[designation]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(values.certificationChoice === "school" ||
                    values.certificationChoice === "other") && (
                    <div data-error-field="certificationName">
                      <Input
                        {...register("certificationName")}
                        placeholder="Nazwa certyfikatu"
                        className={fieldClass(Boolean(errors.certificationName))}
                      />
                      <FieldError message={errors.certificationName?.message} />
                    </div>
                  )}
                  {hasRecognizedCertification && (
                    <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-sm font-medium text-brand-green">
                      <BadgeCheck className="size-5" />
                      Pokażemy odznakę &quot;Rozpoznany format certyfikatu&quot;
                    </div>
                  )}
                </div>
              </Section>

              <Section id="course-pricing-section" title="Cena">
                <div className="space-y-4">
                  <div data-error-field="price">
                    <label className="mb-2 block text-base font-semibold" htmlFor="price">
                      {isPaymentExpanded ? "Cena całkowita" : "Cena"}
                    </label>
                    <div className="grid grid-cols-[1fr_88px] gap-3">
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        onKeyDown={blockInvalidNumberChars}
                        {...register("price")}
                        className={fieldClass(Boolean(errors.price))}
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
                    <FieldError message={errors.price?.message} />
                  </div>

                  {!isPaymentExpanded ? (
                    <button
                      type="button"
                      className="flex min-h-10 items-center gap-3 text-left text-base font-medium text-brand-blue"
                      onClick={() => setIsPaymentExpanded(true)}
                    >
                      <Plus className="size-5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        Opcje płatności (zadatek, raty, sposób zapłaty)
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-5 rounded-lg border p-4">
                      <div>
                        <div className="flex items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <label className="text-base font-semibold" htmlFor="deposit-enabled">
                              Pobieram zadatek
                            </label>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Zadatek jest pobierany online, reszta płatna później.
                            </p>
                          </div>
                          <Switch
                            id="deposit-enabled"
                            checked={isDepositEnabled}
                            onCheckedChange={(checked) => {
                              setIsDepositEnabled(checked);
                              if (!checked) setDirtyValue("deposit_amount", "", true);
                            }}
                            className="data-[state=checked]:bg-brand-green"
                          />
                        </div>
                        {isDepositEnabled && (
                          <div data-error-field="deposit_amount" className="mt-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              onKeyDown={blockInvalidNumberChars}
                              placeholder="Kwota zadatku (pobierana online)"
                              {...register("deposit_amount")}
                              className={fieldClass(Boolean(errors.deposit_amount))}
                            />
                            <FieldError message={errors.deposit_amount?.message} />
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="mb-3 text-base font-semibold">
                          Pozostała kwota - sposób zapłaty
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => {
                            const selected = values.balance_payment_methods.includes(method);
                            return (
                              <button
                                type="button"
                                key={method}
                                className={cn(
                                  "min-h-9 rounded-full border px-3 text-sm font-medium",
                                  selected && "border-brand-green bg-muted text-black",
                                )}
                                onClick={() => {
                                  const next = selected
                                    ? values.balance_payment_methods.filter(
                                        (item) => item !== method,
                                      )
                                    : [...values.balance_payment_methods, method];
                                  setDirtyValue("balance_payment_methods", next);
                                }}
                              >
                                {PAYMENT_METHOD_LABELS[method]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-base font-semibold"
                          htmlFor="payment_terms"
                        >
                          Warunki płatności / raty
                        </label>
                        <Textarea
                          id="payment_terms"
                          {...register("payment_terms")}
                          className="min-h-24 rounded-md text-base"
                          placeholder="Opcjonalnie - opisz raty lub terminy własnymi słowami"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              <Section id="course-photos-section" title="Zdjęcia">
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

              <Section id="course-more-details-section" title="Więcej szczegółów">
                <MoreDetailsBuilder
                  values={values}
                  setField={(name, value) => setDirtyValue(name, value as any, true)}
                />
              </Section>

              {currentIsPublic && courseId && (
                <EventVisibilitySection
                  type="course"
                  isToggling={isSubmitting}
                  onHide={() => persist("hide")}
                />
              )}
            </div>
          </div>
        </div>

        <DashboardFooter
          title={courseId ? "Edytuj kurs" : "Nowy kurs"}
          viewPublicHref={courseId ? `/kursy/${courseId}` : undefined}
          viewPublicLabel="Zobacz stronę publiczną"
          viewPublicLabelShort="Zobacz"
          viewPublicIcon={<ExternalLink className="size-4" />}
          showPublishButton
          isPublished={currentIsPublic}
          isPublishing={isSubmitting}
          onPublishToggle={() => persist("publish")}
          publishButtonLabel="Opublikuj kurs"
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
