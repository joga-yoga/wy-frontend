"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Edit2,
  EyeOff,
  HelpCircle,
  Info,
  Loader2,
  PlusCircle,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Controller,
  FieldArrayPath,
  FieldErrors,
  SubmitErrorHandler,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import * as yup from "yup";

import MultipleSelector, { Option } from "@/components/custom/multiple-selector";
import { Instructor, InstructorModal } from "@/components/instructors/InstructorModal";
import { DashboardFooter } from "@/components/layout/DashboardFooter";
import { LocationModal } from "@/components/locations/LocationModal";
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
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { EventFormData, eventFormSchema, EventInitialData } from "@/lib/schemas/event";
import { cn } from "@/lib/utils";

import { DynamicArrayInput } from "./DynamicArrayInput";
import { HelpBar } from "./HelpBar";

const OPTIONS: Option[] = [
  { label: "Początkujący", value: "beginner" },
  { label: "Średni", value: "intermediate" },
  { label: "Zaawansowany", value: "advanced" },
];

export interface Location {
  id: string;
  title: string;
  country?: string | null;
}

interface EventFormProps {
  eventId?: string;
  initialData?: Partial<EventFormData>;
}

// 1. Helper function to prepare event payload
const prepareEventPayload = (data: EventFormData): Partial<EventFormData> => {
  const payload: Omit<EventFormData, "start_date" | "end_date"> & {
    start_date: string | null | undefined;
    end_date: string | null | undefined;
  } = {
    ...data,
    start_date: data.start_date === "" ? null : data.start_date,
    end_date: data.end_date === "" ? null : data.end_date,
    price_includes: (data.price_includes ?? []).filter(
      (item) => typeof item === "string" && item.trim() !== "",
    ),
    price_excludes: (data.price_excludes ?? []).filter(
      (item) => typeof item === "string" && item.trim() !== "",
    ),
    program: (data.program ?? []).filter((item) => typeof item === "string" && item.trim() !== ""),
    included_trips: (data.included_trips ?? []).filter(
      (item) => typeof item === "string" && item.trim() !== "",
    ),
    paid_attractions: (data.paid_attractions ?? []).filter(
      (item) => typeof item === "string" && item.trim() !== "",
    ),
    skill_level: (data.skill_level ?? []).filter(
      (item) => typeof item === "string" && item.trim() !== "",
    ),
    image_ids: data.image_ids ?? [],
    main_attractions: (data.main_attractions ?? []).filter(
      (item) => typeof item === "string" && item.trim() !== "",
    ),
  };
  // Assuming 'image' and 'image_id' fields are not meant for direct submission
  // and are handled differently (e.g. image_ids is the source of truth for images).
  // If EventFormData is strictly what's sent, these deletes might not be needed
  // or 'image'/'image_id' shouldn't be on EventFormData.
  delete (payload as any).image;
  delete (payload as any).image_id;
  payload.instructor_ids = data.instructor_ids ?? [];
  return payload as Partial<EventFormData>; // Adjust cast if a more specific return type is defined
};

export function EventForm({ eventId, initialData }: EventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const isEditMode = !!eventId;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [currentIsPublic, setCurrentIsPublic] = useState<boolean>(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [calculatedDuration, setCalculatedDuration] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);
  const [isDeletingInstructor, setIsDeletingInstructor] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [directUploadError, setDirectUploadError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationModalMode, setLocationModalMode] = useState<"create" | "edit">("create");
  const [isHelpBarOpen, setIsHelpBarOpen] = useState(true);
  const [activeTipId, setActiveTipId] = useState<string | undefined>(undefined);
  const [isPublishConfirmModalOpen, setIsPublishConfirmModalOpen] = useState(false);

  const handleFocusField = (tipId: string) => {
    if (isHelpBarOpen) {
      setActiveTipId(tipId);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    getValues,
    reset,
    setValue,
    trigger,
  } = useForm<EventFormData>({
    resolver: yupResolver(eventFormSchema as yup.ObjectSchema<EventFormData>),
    defaultValues: {
      title: "",
      description: undefined,
      start_date: "",
      end_date: "",
      price: undefined,
      currency: "PLN",
      main_attractions: [],
      language: "pl",
      skill_level: [],
      accommodation_description: undefined,
      guest_welcome_description: undefined,
      food_description: undefined,
      price_includes: [],
      price_excludes: [],
      included_trips: [],
      paid_attractions: [],
      cancellation_policy: undefined,
      important_info: undefined,
      program: [],
      instructor_ids: [],
      is_public: false,
      location_id: null,
      image_ids: [],
      ...initialData,
    } as Partial<EventFormData>,
  });

  const startDateString = watch("start_date");
  const endDateString = watch("end_date");

  useEffect(() => {
    const start = startDateString ? parseISO(startDateString) : undefined;
    const end = endDateString ? parseISO(endDateString) : undefined;

    if (start && isValid(start) && end && isValid(end)) {
      setDateRange({ from: start, to: end });
    } else if (start && isValid(start)) {
      setDateRange({ from: start, to: undefined });
    } else {
      setDateRange(undefined);
    }
  }, [startDateString, endDateString]);

  useEffect(() => {
    if (startDateString && endDateString) {
      const startDate = parseISO(startDateString);
      const endDate = parseISO(endDateString);

      if (isValid(startDate) && isValid(endDate) && endDate >= startDate) {
        setCalculatedDuration(differenceInCalendarDays(endDate, startDate) + 1);
      } else {
        setCalculatedDuration(0);
      }
    } else {
      setCalculatedDuration(0);
    }
  }, [startDateString, endDateString]);

  const {
    fields: programFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "program" as FieldArrayPath<EventFormData>,
  });

  const {
    fields: priceIncludesFields,
    append: appendPriceInclude,
    remove: removePriceInclude,
    replace: replacePriceIncludes,
  } = useFieldArray({
    control,
    name: "price_includes" as FieldArrayPath<EventFormData>,
  });

  const fetchInstructors = useCallback(async () => {
    try {
      const response = await axiosInstance.get<Instructor[]>("/instructors");
      setInstructors(response.data);
    } catch (error) {
      console.error("Failed to fetch instructors:", error);
      toast({
        description: "Nie udało się załadować listy instruktorów.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await axiosInstance.get<Location[]>("/locations");
      setLocations(response.data);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      toast({
        description: "Nie udało się załadować listy lokalizacji.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchInstructors();
    fetchLocations();
  }, [fetchInstructors, fetchLocations]);

  useEffect(() => {
    if (!isEditMode) return;
    setIsLoading(true);
    setFetchError(null);

    axiosInstance
      .get<EventInitialData>(`/events/${eventId}`)
      .then((res) => {
        const fetchedData = res.data;
        setCurrentIsPublic(fetchedData.is_public ?? false);

        const dataForReset: Partial<EventFormData> = {};

        const yupSchemaFields = eventFormSchema.fields;
        for (const key in yupSchemaFields) {
          const fieldKey = key as keyof EventFormData;
          const initialValue = fetchedData[fieldKey as keyof EventInitialData];

          if (fieldKey === ("image" as any) || fieldKey === ("image_id" as any)) {
            continue;
          }

          if (fieldKey === "start_date" || fieldKey === "end_date") {
            dataForReset[fieldKey] =
              typeof initialValue === "string" ? initialValue.split("T")[0] : undefined;
          } else if (fieldKey === "program") {
            const programVal = fetchedData.program;
            if (Array.isArray(programVal)) {
              dataForReset.program = programVal.filter(
                (item): item is string => typeof item === "string",
              );
            } else {
              dataForReset.program = [];
            }
          } else if (
            fieldKey === "price_includes" ||
            fieldKey === "price_excludes" ||
            fieldKey === "included_trips" ||
            fieldKey === "paid_attractions" ||
            fieldKey === "skill_level" ||
            fieldKey === "main_attractions"
          ) {
            const arrayValUntyped: unknown = fetchedData[fieldKey as keyof EventInitialData];
            if (Array.isArray(arrayValUntyped)) {
              (dataForReset as any)[fieldKey] = arrayValUntyped.filter(
                (item): item is string => typeof item === "string",
              );
            } else {
              (dataForReset as any)[fieldKey] = [];
            }
          } else if (fieldKey === "instructor_ids") {
            const populatedInstructors = (fetchedData as any).instructors as
              | Array<{ id: string; [key: string]: any }>
              | undefined;
            if (Array.isArray(populatedInstructors)) {
              dataForReset.instructor_ids = populatedInstructors
                .map((instructor) => instructor.id)
                .filter((item): item is string => typeof item === "string");
            } else {
              dataForReset.instructor_ids = [];
            }
          } else if (fieldKey === "location_id") {
            if (typeof initialValue === "string") {
              dataForReset[fieldKey] = initialValue;
            } else if (fetchedData.location && typeof fetchedData.location.id === "string") {
              dataForReset[fieldKey] = fetchedData.location.id;
            } else {
              dataForReset[fieldKey] = null;
            }
          } else if (fieldKey === "image_ids") {
            const imageIdsVal = fetchedData.image_ids;
            if (Array.isArray(imageIdsVal)) {
              dataForReset.image_ids = imageIdsVal.filter(
                (item): item is string => typeof item === "string",
              );
            } else {
              dataForReset.image_ids = [];
            }
          } else if (initialValue !== undefined && initialValue !== null) {
            (dataForReset as any)[fieldKey] = initialValue;
          } else if (fieldKey === "currency" && !initialValue) {
            dataForReset[fieldKey] = "PLN";
          } else if (fieldKey === "language" && !initialValue) {
            dataForReset[fieldKey] = "pl";
          }
        }

        if (!dataForReset.language) {
          dataForReset.language = "pl";
        }

        // Ensure RHF's is_public state is also initialized
        if (typeof fetchedData.is_public === "boolean") {
          dataForReset.is_public = fetchedData.is_public;
        }

        reset(dataForReset);
      })
      .catch((err) => {
        console.error("Failed to fetch event data:", err);
        setFetchError("Nie udało się załadować danych wydarzenia. Spróbuj ponownie.");
        toast({
          description: "Nie udało się załadować danych wydarzenia.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [eventId, isEditMode, reset, toast]);

  // 2. Update onSubmit
  const onSubmit: SubmitHandler<EventFormData> = async (data) => {
    console.log("Internal onSubmit triggered with data:", data);
    const payload = prepareEventPayload(data);
    const submissionIsPublic = payload.is_public ?? false;

    try {
      if (isEditMode && eventId) {
        await axiosInstance.put(`/events/${eventId}`, payload);
        toast({ description: "Wydarzenie zaktualizowane pomyślnie!" });
        setCurrentIsPublic(submissionIsPublic);
        router.refresh();
      } else {
        const response = await axiosInstance.post<{ id: string }>("/events", payload);
        const newEventId = response.data.id;
        toast({ description: "Wydarzenie utworzone pomyślnie!" });
        setCurrentIsPublic(submissionIsPublic);
        router.push(`/dashboard/events/${newEventId}/edit`);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail?.[0]?.msg ||
        error.response?.data?.detail ||
        error.message ||
        "Spróbuj ponownie.";
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} event:`,
        error.response?.data || error.message,
      );
      toast({
        title: `Błąd ${isEditMode ? "aktualizacji" : "tworzenia"}`,
        description: `Nie udało się ${isEditMode ? "zaktualizować" : "utworzyć"} wydarzenia: ${errorMsg}`,
        variant: "destructive",
      });
    }
  };

  // 3. Update handleToggleVisibility
  const handleToggleVisibility = async () => {
    if (!eventId) return; // Should only be callable in edit mode

    setIsTogglingVisibility(true);
    const newStatus = !currentIsPublic; // If true, we are trying to publish. If false, unpublish.
    const originalFormIsPublicValue = getValues("is_public");

    if (newStatus === true) {
      // Attempting to publish (and save all changes)
      // Validation is now done in handlePublishButtonClick before opening the modal
      setValue("is_public", true, { shouldDirty: true, shouldValidate: false });
      const formDataForPublish = getValues(); // This now has is_public: true
      const payloadForPublish = prepareEventPayload(formDataForPublish);

      try {
        await axiosInstance.put(`/events/${eventId}`, payloadForPublish);
        setCurrentIsPublic(true); // Successfully published and saved
        toast({ description: "Wydarzenie opublikowane i zmiany zapisane pomyślnie." });
        router.refresh();
      } catch (error: any) {
        setValue("is_public", originalFormIsPublicValue, {
          shouldDirty: true,
          shouldValidate: false,
        });
        setCurrentIsPublic(originalFormIsPublicValue); // Revert UI if PUT fails

        const errorMsg =
          error.response?.data?.detail?.[0]?.msg ||
          error.response?.data?.detail ||
          error.message ||
          "Spróbuj ponownie.";
        console.error("Failed to publish and update event:", error.response?.data || error.message);
        toast({
          title: "Błąd publikacji",
          description: `Nie udało się opublikować i zapisać zmian: ${errorMsg}`,
          variant: "destructive",
        });
      } finally {
        setIsTogglingVisibility(false);
      }
    } else {
      // Attempting to unpublish (newStatus === false)
      try {
        await axiosInstance.patch(`/events/${eventId}`, { is_public: false });
        setCurrentIsPublic(false);
        setValue("is_public", false, { shouldDirty: true, shouldValidate: false });
        toast({ description: "Wydarzenie ukryte pomyślnie." });
      } catch (error: any) {
        setValue("is_public", originalFormIsPublicValue, {
          shouldDirty: true,
          shouldValidate: false,
        });
        setCurrentIsPublic(originalFormIsPublicValue); // Revert UI if PATCH fails

        const errorMsg =
          error.response?.data?.detail || error.message || "Nie udało się ukryć wydarzenia.";
        console.error("Failed to unpublish event:", error.response?.data || error.message);
        toast({
          title: "Błąd zmiany widoczności",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setIsTogglingVisibility(false);
      }
    }
  };

  const handlePublishButtonClick = async () => {
    if (!currentIsPublic) {
      // Attempting to publish, validate first
      const originalFormIsPublicValue = getValues("is_public");
      setValue("is_public", true, { shouldDirty: true, shouldValidate: false });
      const isValid = await trigger(undefined, { shouldFocus: true });
      setValue("is_public", originalFormIsPublicValue, {
        shouldDirty: true,
        shouldValidate: false,
      }); // Revert for now

      if (!isValid) {
        toast({
          title: "Błąd walidacji",
          description: "Nie można opublikować wydarzenia. Formularz zawiera błędy.",
          variant: "destructive",
          duration: 2000,
        });
        return;
      }
      setIsPublishConfirmModalOpen(true);
    } else {
      // Attempting to unpublish
      handleToggleVisibility();
    }
  };

  const handleInstructorSaved = (savedInstructor: Instructor) => {
    setInstructors((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === savedInstructor.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = savedInstructor;
        return updated;
      } else {
        return [...prev, savedInstructor];
      }
    });
    const currentIds = getValues("instructor_ids") || [];
    if (!currentIds.includes(savedInstructor.id)) {
      setValue("instructor_ids", [...currentIds, savedInstructor.id], { shouldDirty: true });
    }

    setIsInstructorModalOpen(false);
  };

  const handleLocationSaved = (savedLocation: Location) => {
    fetchLocations();
    setIsLocationModalOpen(false);
    setEditingLocation(null);
    setValue("location_id", savedLocation.id, { shouldDirty: true });
    toast({ description: "Lokalizacja zapisana pomyślnie." });
  };

  const handleLocationDeleted = (deletedLocationId: string) => {
    setLocations((prevLocations) => prevLocations.filter((loc) => loc.id !== deletedLocationId));
    if (getValues("location_id") === deletedLocationId) {
      setValue("location_id", null, { shouldDirty: true });
    }
    toast({ description: "Lokalizacja usunięta pomyślnie." });
    fetchLocations(); // Refetch to ensure consistency, though client-side update is done
  };

  const handleEditInstructor = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsInstructorModalOpen(true);
  };

  const handleDeleteInstructor = async () => {
    if (!instructorToDelete) return;

    setIsDeletingInstructor(true);
    try {
      await axiosInstance.delete(`/instructors/${instructorToDelete.id}`);
      toast({ description: `Instruktor "${instructorToDelete.name}" usunięty pomyślnie.` });

      setInstructors((prev) => prev.filter((i) => i.id !== instructorToDelete.id));

      const currentIds = getValues("instructor_ids") || [];
      if (currentIds.includes(instructorToDelete.id)) {
        setValue(
          "instructor_ids",
          currentIds.filter((id) => id !== instructorToDelete.id),
          {
            shouldDirty: true,
          },
        );
      }

      setInstructorToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete instructor:", error);
      toast({
        title: "Błąd usuwania",
        description: `Nie udało się usunąć instruktora: ${error.response?.data?.detail || error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeletingInstructor(false);
    }
  };

  const watchedImageIds = watch("image_ids");

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploadingImage(true);
    setDirectUploadError(null);
    let allUploadsSuccessful = true;
    const newImageIds: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageFormData = new FormData();
      imageFormData.append("image", file);

      try {
        const response = await axiosInstance.post<{ image_id: string }>(
          "/events/image-upload",
          imageFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
        newImageIds.push(response.data.image_id);
      } catch (err: any) {
        allUploadsSuccessful = false;
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          `Nie udało się przesłać pliku: ${file.name}.`;
        console.error("Direct image upload failed for file:", file.name, errorMsg);
        setDirectUploadError(
          (prevError) =>
            (prevError ? prevError + "\n" : "") + `Błąd przesyłania ${file.name}: ${errorMsg}`,
        );
        // We'll show a summary toast later
      }
    }

    if (newImageIds.length > 0) {
      const currentImageIds = getValues("image_ids") || [];
      setValue("image_ids", [...currentImageIds, ...newImageIds], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    setIsUploadingImage(false);
    if (event.target) {
      event.target.value = ""; // Reset file input
    }

    if (newImageIds.length > 0 && allUploadsSuccessful) {
      toast({
        description:
          newImageIds.length > 1
            ? `Dodano ${newImageIds.length} zdjęć pomyślnie.`
            : "Zdjęcie dodane pomyślnie.",
      });
    } else if (newImageIds.length > 0 && !allUploadsSuccessful) {
      toast({
        title: "Częściowy sukces przesyłania",
        description: `Dodano ${newImageIds.length} z ${files.length} zdjęć. Sprawdź błędy poniżej pola przesyłania.`,
        variant: "default", // Or "warning" if you have one
      });
    } else if (!allUploadsSuccessful) {
      toast({
        title: "Błąd przesyłania zdjęć",
        description:
          "Nie udało się przesłać żadnego ze zdjęć. Szczegóły błędu powinny być widoczne poniżej pola do przesyłania.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = (imageIdToRemove: string) => {
    const currentImageIds = getValues("image_ids") || [];
    setValue(
      "image_ids",
      currentImageIds.filter((id) => id !== imageIdToRemove),
      { shouldValidate: true, shouldDirty: true },
    );
    toast({ description: "Zdjęcie usunięte z listy." });
  };

  if (isLoading && isEditMode) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{fetchError}</p>
        <Button onClick={() => router.back()}>Wróć</Button>
      </div>
    );
  }

  return (
    <div className="" id="event-form-wrapper">
      {!isHelpBarOpen ? (
        <div className="fixed top-[80px] bottom-[48px] right-4 z-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsHelpBarOpen(!isHelpBarOpen)}
            aria-label={isHelpBarOpen ? "Zamknij pomoc" : "Otwórz pomoc"}
          >
            {isHelpBarOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-row gap-6 space-y-8">
        <div className="flex-grow space-y-[64px] max-w-3xl mx-auto py-10">
          <div className="space-y-[64px]" id="event-details">
            <div className="space-y-2">
              <Label htmlFor="title" size="event">
                Tytuł
              </Label>
              <Label htmlFor="title" size="event-description">
                Przyciągnij klientów tytułem, który podkreśla czas trwania, miejsce docelowe i
                atrakcje programu
              </Label>
              <Separator className="my-8" />
              <Input
                id="title"
                {...register("title")}
                placeholder="Tytuł"
                onFocus={() => handleFocusField("title")}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" size="event">
                Opis
              </Label>
              <Label htmlFor="description" size="event-description">
                Przedstaw swoją ofertę w krótkim podsumowaniu, aby przyciągnąć uwagę klientów
              </Label>
              <Separator className="my-8" />
              <Textarea
                id="description"
                {...register("description")}
                rows={4}
                placeholder="Opis"
                onFocus={() => handleFocusField("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-[64px]" id="event-details-continued">
            <div className="space-y-6" id="event-location-dates">
              <div className="space-y-2">
                <Label htmlFor="start_date" size="event">
                  Termin wydarzenia
                </Label>
                <Separator className="my-8" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground",
                      )}
                      onFocus={() => handleFocusField("date")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y", { locale: pl })} -{" "}
                            {format(dateRange.to, "LLL dd, y", { locale: pl })}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y", { locale: pl })
                        )
                      ) : (
                        <span>Wybierz zakres dat</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <div
                        ref={field.ref}
                        tabIndex={-1}
                        className="absolute w-0 h-0 opacity-0 pointer-events-none"
                      />
                    )}
                  />
                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <div
                        ref={field.ref}
                        tabIndex={-1}
                        className="absolute w-0 h-0 opacity-0 pointer-events-none"
                      />
                    )}
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      showOutsideDays={false}
                      onSelect={(selectedRange: DateRange | undefined) => {
                        setDateRange(selectedRange);
                        if (selectedRange?.from) {
                          setValue("start_date", format(selectedRange.from, "yyyy-MM-dd"), {
                            shouldValidate: true,
                          });
                        } else {
                          setValue("start_date", "", { shouldValidate: true });
                        }
                        if (selectedRange?.to) {
                          setValue("end_date", format(selectedRange.to, "yyyy-MM-dd"), {
                            shouldValidate: true,
                          });
                        } else {
                          setValue("end_date", "", { shouldValidate: true });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {errors.start_date && (
                  <p className="text-sm text-destructive">
                    Błąd daty rozpoczęcia: {errors.start_date.message}
                  </p>
                )}
                {!errors.start_date && errors.end_date && (
                  <p className="text-sm text-destructive">
                    Błąd daty zakończenia: {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_level" size="event">
                Poziom zaawansowania
              </Label>
              <Separator className="my-8" />
              <Controller
                name="skill_level"
                control={control}
                render={({ field }) => (
                  <div onFocus={() => handleFocusField("skill_level")} tabIndex={0}>
                    <MultipleSelector
                      defaultOptions={OPTIONS}
                      selectFirstItem={false}
                      value={
                        field.value?.map((val: string) => ({
                          label: OPTIONS.find((o) => o.value === val)?.label || val,
                          value: val,
                        })) || []
                      }
                      onChange={(options: Option[]) => {
                        field.onChange(options.map((option) => option.value));
                      }}
                      placeholder="Wybierz poziom zaawansowania"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          Brak wyników.
                        </p>
                      }
                      hidePlaceholderWhenSelected
                    />
                  </div>
                )}
              />
              {errors.skill_level && (
                <p className="text-sm text-destructive">{errors.skill_level.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" size="event">
                Język prowadzenia zajęć
              </Label>
              <Separator className="my-8" />
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "pl"}
                    onOpenChange={(isOpen) => isOpen && handleFocusField("language")}
                  >
                    <SelectTrigger onFocus={() => handleFocusField("language")}>
                      <SelectValue placeholder="Wybierz język" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pl">Polski</SelectItem>
                      <SelectItem value="en">Angielski</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.language && (
                <p className="text-sm text-destructive">{errors.language.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-6" id="event-instructors">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="instructors" size="event">
                  Instruktorzy
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setIsHelpBarOpen(true);
                    handleFocusField("instructors");
                  }}
                  aria-label="Pomoc dla sekcji instruktorzy"
                >
                  <HelpCircle size={16} />
                </Button>
              </div>
              <Label htmlFor="instructors" size="event-description">
                Wybierz instruktorów, którzy będą prowadzić wydarzenie
              </Label>
              <Separator className="my-8" />
              <div className="flex justify-between items-center border-b pb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInstructorModalOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Dodaj Instruktora
                </Button>
              </div>
              <Controller
                control={control}
                name="instructor_ids"
                render={({ field }) => (
                  <AlertDialog onOpenChange={(open) => !open && setInstructorToDelete(null)}>
                    <ScrollArea
                      className="h-72 w-full rounded-md p-1"
                      onFocusCapture={() => handleFocusField("instructors")}
                    >
                      <div className="space-y-3">
                        {instructors.length > 0 ? (
                          instructors.map((instructor) => (
                            <div
                              key={instructor.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex items-center gap-3 flex-grow">
                                <Image
                                  src={
                                    instructor.image_id
                                      ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_40,h_40,g_face,r_max/v1/${instructor.image_id}`
                                      : `https://avatar.vercel.sh/${instructor.name.replace(/\s+/g, "_")}.png?size=40`
                                  }
                                  alt={instructor.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover border"
                                />
                                <Label
                                  htmlFor={`instructor-switch-${instructor.id}`}
                                  className="font-medium cursor-pointer text-sm"
                                >
                                  {instructor.name}
                                </Label>
                              </div>

                              <div className="flex items-center flex-shrink-0 gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditInstructor(instructor)}
                                  className="h-8 px-2"
                                  aria-label={`Edit ${instructor.name}`}
                                >
                                  <Edit2 size={16} className="text-muted-foreground" />
                                </Button>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setInstructorToDelete(instructor)}
                                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    aria-label={`Delete ${instructor.name}`}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </AlertDialogTrigger>
                                <Switch
                                  id={`instructor-switch-${instructor.id}`}
                                  checked={field.value?.includes(instructor.id)}
                                  onCheckedChange={(checked) => {
                                    const currentIds = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentIds, instructor.id]);
                                    } else {
                                      field.onChange(
                                        currentIds.filter((id) => id !== instructor.id),
                                      );
                                    }
                                  }}
                                  className="ml-2"
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-center py-4 text-gray-500">
                            Nie znaleziono instruktorów. Kliknij &quot;Dodaj Instruktora&quot;, aby
                            dodać nowego.
                          </p>
                        )}
                      </div>
                      {instructorToDelete && (
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Na pewno usunąć instruktora?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie instruktora
                              &quot;<strong>{instructorToDelete.name}</strong>&quot; z Twojej listy
                              i wszystkich powiązanych wydarzeń.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeletingInstructor}>
                              Anuluj
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={isDeletingInstructor}
                              onClick={handleDeleteInstructor}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {isDeletingInstructor ? "Usuwanie..." : "Tak, usuń"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </ScrollArea>
                  </AlertDialog>
                )}
              />
              {errors.instructor_ids && (
                <p className="text-sm text-destructive">{errors.instructor_ids.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="location_id" size="event">
                Lokalizacja
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                onClick={() => {
                  setIsHelpBarOpen(true);
                  handleFocusField("location_id");
                }}
                aria-label="Pomoc dla sekcji lokalizacja"
              >
                <HelpCircle size={16} />
              </Button>
            </div>
            <Separator className="my-8" />
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  {locations.length > 0 ? (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        onOpenChange={(isOpen) => isOpen && handleFocusField("location_id")}
                      >
                        <SelectTrigger onFocus={() => handleFocusField("location_id")}>
                          <SelectValue placeholder="Wybierz lokalizację" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.title}
                              {loc.country ? ` (${loc.country})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const selectedLoc = locations.find((l) => l.id === field.value);
                          if (selectedLoc) {
                            setEditingLocation(selectedLoc);
                            setLocationModalMode("edit");
                            setIsLocationModalOpen(true);
                          } else {
                            toast({
                              description: "Wybierz lokalizację do edycji.",
                              variant: "default",
                            });
                          }
                        }}
                        disabled={!field.value}
                        aria-label="Edytuj wybraną lokalizację"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingLocation(null);
                          setLocationModalMode("create");
                          setIsLocationModalOpen(true);
                        }}
                        aria-label="Dodaj nową lokalizację"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingLocation(null);
                        setLocationModalMode("create");
                        setIsLocationModalOpen(true);
                      }}
                      aria-label="Dodaj pierwszą lokalizację"
                      className="w-full justify-start"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Dodaj pierwszą lokalizację
                    </Button>
                  )}
                </div>
              )}
            />
            {errors.location_id && (
              <p className="text-sm text-destructive">{errors.location_id.message}</p>
            )}
          </div>

          <div className="space-y-[64px]" id="event-pricing">
            <div className="space-y-2">
              <Label htmlFor="price" size="event">
                Cena
              </Label>
              <Label htmlFor="price" size="event-description">
                Podaj pełną cenę za udział w wydarzeniu za jedną osobę
              </Label>
              <Separator className="my-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex">
                    Cena
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step=""
                    {...register("price", {
                      setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                    })}
                    placeholder="Cena za jedną osobę"
                    onFocus={() => handleFocusField("price")}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="flex">
                    Waluta
                  </Label>
                  <Controller
                    name="currency"
                    control={control}
                    defaultValue="PLN"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || "PLN"}>
                        <SelectTrigger id="currency" onFocus={() => handleFocusField("price")}>
                          <SelectValue placeholder="Wybierz walutę" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLN">PLN</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.currency && (
                    <p className="text-sm text-destructive">{errors.currency.message}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_includes" size="event">
                Co jest wliczone w cenę
              </Label>
              <Label htmlFor="price_includes" size="event-description">
                Wymień wszystkie aktywności, udogodnienia i usługi, które są zawarte w cenie
                pakietu.
              </Label>
              <Separator className="my-8" />
              <Controller
                name="price_includes"
                control={control}
                render={({ field, fieldState }) => (
                  <DynamicArrayInput
                    initialValues={(field.value ?? []).filter(
                      (item): item is string => typeof item === "string",
                    )}
                    onChange={field.onChange}
                    placeholder="Np. Śniadanie, Transfer z lotniska"
                    ariaLabel="Lista rzeczy wliczonych w cenę"
                    error={fieldState.error}
                    onFocus={() => handleFocusField("price_includes")}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_excludes" size="event">
                Co nie jest wliczone w cenę
              </Label>
              <Label htmlFor="price_excludes" size="event-description">
                Wymień wszystkie elementy istotne dla uczestników, które nie są zawarte w cenie
                pakietu
              </Label>
              <Separator className="my-8" />
              <Controller
                name="price_excludes"
                control={control}
                render={({ field, fieldState }) => (
                  <DynamicArrayInput
                    initialValues={(field.value ?? []).filter(
                      (item): item is string => typeof item === "string",
                    )}
                    onChange={field.onChange}
                    placeholder="Np. Lunch, Opłaty klimatyczne"
                    ariaLabel="Lista rzeczy niewliczonych w cenę"
                    error={fieldState.error}
                    onFocus={() => handleFocusField("price_excludes")}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2" id="event-main-attractions">
            <Label htmlFor="main_attractions" size="event">
              Najważniejsze atrakcje
            </Label>
            <Label htmlFor="main_attractions" size="event-description">
              Wyróżnij to, co jest wyjątkowe w tej podróży, w 6–8 punktach
            </Label>
            <Separator className="my-8" />
            <Controller
              name="main_attractions"
              control={control}
              render={({ field, fieldState }) => (
                <DynamicArrayInput
                  initialValues={(field.value ?? []).filter(
                    (item): item is string => typeof item === "string",
                  )}
                  onChange={field.onChange}
                  placeholder="Wymień główny punkt programu lub unikalną cechę..."
                  ariaLabel="Lista najważniejszych atrakcji"
                  error={fieldState.error}
                  onFocus={() => handleFocusField("main_attractions")}
                />
              )}
            />
          </div>

          <div className="space-y-6" id="event-hospitality">
            <div className="space-y-2">
              <Label htmlFor="accommodation_description" size="event">
                Nocleg
              </Label>
              <Label htmlFor="accommodation_description" size="event-description">
                Opisz miejsce lub miejsca, w których będą przebywać uczestnicy
              </Label>
              <Separator className="my-8" />
              <Textarea
                id="accommodation_description"
                {...register("accommodation_description")}
                rows={3}
                placeholder="Opisz miejsce lub miejsca, w których będą przebywać uczestnicy"
                onFocus={() => handleFocusField("accommodation_description")}
              />
              {errors.accommodation_description && (
                <p className="text-sm text-destructive">
                  {errors.accommodation_description.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest_welcome_description" size="event">
                Powitanie gości
              </Label>
              <Label htmlFor="guest_welcome_description" size="event-description">
                Opisz, kto będzie gościł uczestników oraz o której godzinie przewidziane są
                zameldowanie i wymeldowanie.
              </Label>
              <Separator className="my-8" />
              <Textarea
                id="guest_welcome_description"
                {...register("guest_welcome_description")}
                rows={3}
                placeholder="Powitanie gości"
                onFocus={() => handleFocusField("guest_welcome_description")}
              />
              {errors.guest_welcome_description && (
                <p className="text-sm text-destructive">
                  {errors.guest_welcome_description.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="food_description" size="event">
                Wyżywienie
              </Label>
              <Label htmlFor="food_description" size="event-description">
                Wybierz wszystkie rodzaje jedzenia, które są serwowane, oraz wszelkie wymagania
                dietetyczne, które są uwzględniane{" "}
              </Label>
              <Separator className="my-8" />
              <Textarea
                id="food_description"
                {...register("food_description")}
                rows={3}
                placeholder="Wyżywienie"
                onFocus={() => handleFocusField("food_description")}
              />
              {errors.food_description && (
                <p className="text-sm text-destructive">{errors.food_description.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-6" id="event-activities">
            <div className="space-y-2">
              <Label htmlFor="included_trips" size="event">
                Wliczone wycieczki
              </Label>
              <Label htmlFor="included_trips" size="event-description">
                Podaj więcej szczegółów na temat wycieczek, które są zawarte w pakiecie
              </Label>
              <Separator className="my-8" />
              <Controller
                name="included_trips"
                control={control}
                render={({ field, fieldState }) => (
                  <DynamicArrayInput
                    initialValues={(field.value ?? []).filter(
                      (item): item is string => typeof item === "string",
                    )}
                    onChange={field.onChange}
                    placeholder="Np. Wycieczka górska, Zwiedzanie miasta"
                    ariaLabel="Lista wliczonych wycieczek"
                    error={fieldState.error}
                    onFocus={() => handleFocusField("included_trips")}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid_attractions" size="event">
                Dodatkowe atrakcje za dopłatą
              </Label>
              <Label htmlFor="paid_attractions" size="event-description">
                Podziel się informacjami o innych aktywnościach, które uczestnicy mogą zrobić w
                okolicy za dodatkową opłatę
              </Label>
              <Separator className="my-8" />
              <Controller
                name="paid_attractions"
                control={control}
                render={({ field, fieldState }) => (
                  <DynamicArrayInput
                    initialValues={(field.value ?? []).filter(
                      (item): item is string => typeof item === "string",
                    )}
                    onChange={field.onChange}
                    placeholder="Np. Masaż, Wypożyczenie sprzętu"
                    ariaLabel="Lista dodatkowych płatnych atrakcji"
                    error={fieldState.error}
                    onFocus={() => handleFocusField("paid_attractions")}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-6" id="event-program">
            <Label htmlFor="program" size="event">
              Program wydarzenia (dzień po dniu)
            </Label>
            <Label htmlFor="program" size="event-description">
              Opisz pełny program dla uczestników i podziel się z nimi, jak będą wyglądały ich dni
            </Label>
            <Separator className="my-8" />
            {programFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-2 border p-3 rounded-md bg-muted/30 relative group"
              >
                <Label
                  htmlFor={`program.${index}`}
                  className="pt-2 font-semibold whitespace-nowrap"
                >
                  {" "}
                  Dzień {index + 1}:{" "}
                </Label>
                <div className="flex-grow space-y-1">
                  <Textarea
                    id={`program.${index}`}
                    {...register(`program.${index}` as const)}
                    placeholder={`Opis programu na dzień ${index + 1}`}
                    rows={3}
                    className="bg-background"
                    onFocus={() => handleFocusField("program")}
                  />
                  {errors.program?.[index] && (
                    <p className="text-sm text-destructive">{errors.program[index]?.message}</p>
                  )}
                </div>
              </div>
            ))}
            {calculatedDuration > 0 && programFields.length < calculatedDuration && (
              <Button type="button" variant="outline" size="sm" onClick={() => append("")}>
                <PlusCircle className="mr-2 h-4 w-4" /> Dodaj dzień {programFields.length + 1}
              </Button>
            )}
            {calculatedDuration > 0 && programFields.length > calculatedDuration && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(programFields.length - 1)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Usuń ostatni dzień
              </Button>
            )}
            {calculatedDuration === 0 && (
              <p className="text-sm text-gray-500 italic">
                Wybierz datę rozpoczęcia i zakończenia, aby dodać program dnia.
              </p>
            )}
          </div>

          <div className="space-y-6" id="event-policies">
            <div className="space-y-2">
              <Label htmlFor="cancellation_policy" size="event">
                Zasady anulowania rezerwacji
              </Label>
              <Label htmlFor="cancellation_policy" size="event-description">
                Tutaj należy opisać, na jakich warunkach uczestnik może odwołać swój udział w
                wydarzeniu
              </Label>
              <Separator className="my-8" />
              <Textarea
                id="cancellation_policy"
                {...register("cancellation_policy")}
                rows={3}
                placeholder="Zasady anulowania rezerwacji"
                onFocus={() => handleFocusField("cancellation_policy")}
              />
              {errors.cancellation_policy && (
                <p className="text-sm text-destructive">{errors.cancellation_policy.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="important_info" size="event">
                Warto wiedzieć przed wyjazdem
              </Label>
              <Label htmlFor="important_info" size="event-description">
                Podziel się dodatkowymi informacjami, które mogą być istotne dla uczestników. Ta
                sekcja nie będzie publikowana w ofercie, a jedynie widoczna w powiadomieniach e-mail
                dla klientów
              </Label>
              <Separator className="my-8" />
              <Textarea
                id="important_info"
                {...register("important_info")}
                rows={3}
                placeholder="Warto wiedzieć przed wyjazdem"
                onFocus={() => handleFocusField("important_info")}
              />
              {errors.important_info && (
                <p className="text-sm text-destructive">{errors.important_info.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-6" id="event-images-section">
            <div className="flex items-center gap-2">
              <Label htmlFor="images" size="event">
                Zdjęcia wydarzenia
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                onClick={() => {
                  setIsHelpBarOpen(true);
                  handleFocusField("images");
                }}
                aria-label="Pomoc dla sekcji zdjęcia"
              >
                <HelpCircle size={16} />
              </Button>
            </div>
            <Label htmlFor="images" size="event-description">
              Dodaj zdjęcia, które pomogą uczestnikom zrozumieć, co czeka ich na wydarzeniu
            </Label>
            <Separator className="my-8" />
            {watchedImageIds && watchedImageIds.length > 0 && (
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {watchedImageIds.map((imageId) => (
                  <div key={imageId} className="relative group">
                    <Image
                      src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_200,h_150/v1/${imageId}`}
                      alt="Zdjęcie wydarzenia"
                      width={200}
                      height={150}
                      className="rounded border object-cover w-full"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      onClick={() => handleRemoveImage(imageId)}
                      aria-label="Usuń zdjęcie"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="image-upload-input" className="flex">
                {watchedImageIds && watchedImageIds.length > 0
                  ? "Dodaj kolejne zdjęcia"
                  : "Dodaj zdjęcia wydarzenia"}
              </Label>
              <Input
                id="image-upload-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelected}
                disabled={isUploadingImage}
                onFocus={() => handleFocusField("images")}
              />
              {isUploadingImage && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Przesyłanie zdjęcia...
                </div>
              )}
              {directUploadError && <p className="text-sm text-destructive">{directUploadError}</p>}
              {errors.image_ids && (
                <p className="text-sm text-destructive">{errors.image_ids.message}</p>
              )}
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div
              className="mt-6 p-4 border border-red-300 bg-red-50 rounded-md space-y-2"
              id="form-errors-summary"
            >
              <h3 className="text-lg font-semibold text-red-700">Wystąpiły błędy w formularzu:</h3>
              <ul className="list-disc list-inside pl-2 text-red-600 text-sm">
                {Object.entries(errors).map(([fieldName, fieldError]) => {
                  if (fieldError && fieldError.message) {
                    return <li key={fieldName}>{`${fieldName}: ${fieldError.message}`}</li>;
                  } else if (Array.isArray(fieldError)) {
                    return fieldError.map((errorItem, index) =>
                      errorItem && errorItem.message ? (
                        <li
                          key={`${fieldName}.${index}`}
                        >{`${fieldName}[${index}]: ${errorItem.message}`}</li>
                      ) : null,
                    );
                  } else if (typeof fieldError === "object" && fieldError !== null) {
                    const message = (fieldError as any).message;
                    if (message) {
                      return <li key={`${fieldName}-root`}>{`${fieldName}: ${message}`}</li>;
                    }
                  }
                  return null;
                })}
              </ul>
            </div>
          )}
        </div>

        {isHelpBarOpen && (
          <HelpBar
            isOpen={isHelpBarOpen}
            onClose={() => setIsHelpBarOpen(false)}
            activeTipId={activeTipId}
          />
        )}
      </div>

      <DashboardFooter
        title={isEditMode ? "Edytuj wydarzenie" : "Utwórz nowe wydarzenie"}
        onUpdate={handleSubmit(onSubmit)}
        updateLabel={
          isSubmitting
            ? isEditMode
              ? "Zapisywanie..."
              : "Tworzenie..."
            : isEditMode
              ? "Zapisz zmiany"
              : "Utwórz wydarzenie"
        }
        updateIcon={
          isSubmitting ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="ml-2 h-4 w-4" />
          )
        }
        viewPublicHref={isEditMode && eventId ? `/events/${eventId}` : undefined}
        viewPublicLabel="Zobacz stronę publiczną"
        showPublishButton={isEditMode}
        isPublished={currentIsPublic}
        isPublishing={isTogglingVisibility}
        onPublishToggle={handlePublishButtonClick}
        publishIcon={<Send className="ml-2 h-4 w-4" />}
        unpublishIcon={<EyeOff className="ml-2 h-4 w-4" />}
        publishingIcon={<Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      />

      <InstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => {
          setIsInstructorModalOpen(false);
          setEditingInstructor(null);
        }}
        onInstructorSaved={handleInstructorSaved}
        initialInstructor={editingInstructor}
      />

      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => {
            setIsLocationModalOpen(false);
            setEditingLocation(null);
          }}
          onLocationSaved={handleLocationSaved}
          initialData={editingLocation}
          mode={locationModalMode}
          onLocationDeleted={handleLocationDeleted}
        />
      )}

      <AlertDialog open={isPublishConfirmModalOpen} onOpenChange={setIsPublishConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdź publikację</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz opublikować to wydarzenie? Stanie się ono widoczne dla wszystkich
              użytkowników. Wszelkie wprowadzone zmiany zostaną zapisane.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isTogglingVisibility}
              onClick={() => setIsPublishConfirmModalOpen(false)}
            >
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isTogglingVisibility}
              onClick={() => {
                setIsPublishConfirmModalOpen(false);
                handleToggleVisibility();
              }}
            >
              {isTogglingVisibility ? "Publikowanie..." : "Tak, opublikuj i zapisz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
