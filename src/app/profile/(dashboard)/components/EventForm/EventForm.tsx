"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { ExternalLink, EyeOff, Loader2, Plus, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { FieldArrayPath, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import * as yup from "yup";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  EventFormData,
  EventInitialData,
  retreatFormSchema,
  workshopFormSchema,
} from "@/lib/schemas/event";

import { BlockBrowserNavigation, BlockerWhenDirty } from "./block-navigation/navigation-block";
import { EventDetailsSection } from "./components/EventDetailsSection";
import { EventHelpBar } from "./components/EventHelpBar";
import { EventHospitalitySection } from "./components/EventHospitalitySection";
import { EventImportantInfoSection } from "./components/EventImportantInfoSection";
import { EventInstructorsSection } from "./components/EventInstructorsSection";
import { EventLocationSection } from "./components/EventLocationSection";
import { EventPhotosSection } from "./components/EventPhotosSection";
import { EventPricingSection } from "./components/EventPricingSection";
import { EventProgramSection } from "./components/EventProgramSection";
import { EventSkillLevel } from "./components/EventSkillLevel";
import { WorkshopMetaSection } from "./components/WorkshopMetaSection";
import { EventHelpBarProvider } from "./contexts/EventHelpBarContext";

export interface Location {
  id: string;
  title: string;
  country?: string | null;
}

interface EventFormProps {
  eventId?: string;
  initialData?: Partial<EventFormData>;
  onLoadingChange?: (isLoading: boolean) => void;
  mode?: "retreat" | "workshop";
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
    program: (data.program ?? [])
      .map((item) => ({
        description: item.description?.trim() ?? "",
        imageId: item.imageId,
      }))
      .filter((item) => item.description !== ""),
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

export function EventForm({
  eventId,
  initialData,
  onLoadingChange,
  mode = "retreat",
}: EventFormProps) {
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
  const [isPublishConfirmModalOpen, setIsPublishConfirmModalOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File }[]>([]);
  const [uploadingProgramImages, setUploadingProgramImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    control,
    watch,
    getValues,
    reset,
    setValue,
    trigger,
  } = useForm<EventFormData>({
    resolver: yupResolver(
      mode === "workshop"
        ? (workshopFormSchema as yup.ObjectSchema<EventFormData>)
        : (retreatFormSchema as yup.ObjectSchema<EventFormData>),
    ),
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
      price_includes: [""],
      price_excludes: [""],
      paid_attractions: [""],
      cancellation_policy: undefined,
      important_info: undefined,
      program: [],
      instructor_ids: [],
      is_public: false,
      location_id: null,
      image_ids: [],
      is_online: false,
      is_onsite: false,
      ...initialData,
    },
  });
  console.log("🚀 ~ EventForm ~ errors:", errors);

  const handleProgramImageChange = useCallback(
    async (file: File, index: number) => {
      if (!file) return;

      setUploadingProgramImages((prev) => ({ ...prev, [index]: true }));

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
        setValue(`program.${index}.imageId`, response.data.image_id, {
          shouldValidate: true,
          shouldDirty: true,
        });
        toast({ description: "Zdjęcie dla dnia programu zostało dodane." });
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          `Nie udało się przesłać pliku: ${file.name}.`;
        console.error("Program image upload failed:", errorMsg);
        toast({
          title: "Błąd przesyłania zdjęcia programu",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setUploadingProgramImages((prev) => ({ ...prev, [index]: false }));
      }
    },
    [setValue, toast],
  );

  const handleRemoveProgramImage = useCallback(
    (index: number) => {
      setValue(`program.${index}.imageId`, null, { shouldDirty: true });
      toast({ description: "Zdjęcie usunięte z dnia programu." });
    },
    [setValue, toast],
  );

  const startDateString = watch("start_date");
  const endDateString = watch("end_date");
  const slug = watch("slug");

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
      .get<EventInitialData>(`${mode === "workshop" ? "/workshops" : "/retreats"}/${eventId}`)
      .then((res) => {
        const fetchedData = res.data;
        setCurrentIsPublic(fetchedData.is_public ?? false);

        const dataForReset: Partial<EventFormData> = {};

        const yupSchemaFields = retreatFormSchema.fields;
        for (const key in yupSchemaFields) {
          const fieldKey = key as keyof EventFormData;
          const initialValue = fetchedData[fieldKey as keyof EventInitialData];

          if (fieldKey === ("image" as any) || fieldKey === ("image_id" as any)) {
            continue;
          }

          if (fieldKey === "program") {
            const programVal = fetchedData.program;
            if (Array.isArray(programVal)) {
              dataForReset.program = programVal.map((item) => {
                if (typeof item === "string") {
                  return { description: item, imageId: null };
                }
                return {
                  description: item.description ?? "",
                  imageId: item.imageId ?? null,
                };
              });
            } else {
              dataForReset.program = [];
            }
          } else if (
            fieldKey === "price_includes" ||
            fieldKey === "price_excludes" ||
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
        dataForReset.slug = fetchedData.slug;
        console.log("fetchedData", fetchedData);
        reset(dataForReset);
      })
      .catch((err) => {
        console.error("Failed to fetch event data:", err);
        setFetchError("Nie udało się załadować danych wyjazdu. Spróbuj ponownie.");
        toast({
          description:
            mode === "workshop"
              ? "Nie udało się załadować danych wydarzenia."
              : "Nie udało się załadować danych wyjazdu.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [eventId, isEditMode, reset, toast, mode]);

  // 2. Update onSubmit
  const onSubmit: SubmitHandler<EventFormData> = async (data) => {
    console.log("Internal onSubmit triggered with data:", data);
    const payload = prepareEventPayload(data);
    const submissionIsPublic = payload.is_public ?? false;

    try {
      if (isEditMode && eventId) {
        await axiosInstance.put(
          `${mode === "workshop" ? "/workshops" : "/retreats"}/${eventId}`,
          payload,
        );
        toast({
          description:
            mode === "workshop"
              ? "Warsztat zaktualizowany pomyślnie!"
              : "Wyjazd zaktualizowany pomyślnie!",
        });
        setCurrentIsPublic(submissionIsPublic);
        reset(getValues());
        router.refresh();
      } else {
        const response = await axiosInstance.post<{ id: string }>(
          mode === "workshop" ? "/workshops" : "/retreats",
          payload,
        );
        const newEventId = response.data.id;
        toast({
          description:
            mode === "workshop" ? "Warsztat utworzony pomyślnie!" : "Wyjazd utworzony pomyślnie!",
        });
        setCurrentIsPublic(submissionIsPublic);
        router.push(
          mode === "workshop"
            ? `${process.env.NEXT_PUBLIC_PROFILE_HOST}/workshops/${newEventId}/edit`
            : `${process.env.NEXT_PUBLIC_PROFILE_HOST}/retreats/${newEventId}/edit`,
        );
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
        description: `Nie udało się ${isEditMode ? "zaktualizować" : "utworzyć"} ${mode === "workshop" ? "wydarzenia" : "wyjazdu"}: ${errorMsg}`,
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
      setValue("is_public", true, { shouldDirty: false, shouldValidate: false });
      const formDataForPublish = getValues(); // This now has is_public: true
      const payloadForPublish = prepareEventPayload(formDataForPublish);

      try {
        await axiosInstance.put(
          `${mode === "workshop" ? "/workshops" : "/retreats"}/${eventId}`,
          payloadForPublish,
        );
        setCurrentIsPublic(true); // Successfully published and saved
        reset(getValues());
        toast({
          description: `${mode === "workshop" ? "Warsztat" : "Wyjazd"} opublikowany i zmiany zapisane pomyślnie.`,
        });
        router.refresh();

        const publicUrl =
          mode === "workshop"
            ? `${process.env.NEXT_PUBLIC_WORKSHOPS_HOST}/workshops/${slug || eventId}`
            : `${process.env.NEXT_PUBLIC_RETREATS_HOST}/retreats/${slug || eventId}`;
        router.push(publicUrl);
      } catch (error: any) {
        setValue("is_public", originalFormIsPublicValue, {
          shouldDirty: false,
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
        await axiosInstance.patch(
          `${mode === "workshop" ? "/workshops" : "/retreats"}/${eventId}`,
          { is_public: false },
        );
        setCurrentIsPublic(false);
        setValue("is_public", false, { shouldDirty: false, shouldValidate: false });
        toast({ description: `${mode === "workshop" ? "Warsztat" : "Wyjazd"} ukryty pomyślnie.` });
      } catch (error: any) {
        setValue("is_public", originalFormIsPublicValue, {
          shouldDirty: false,
          shouldValidate: false,
        });
        setCurrentIsPublic(originalFormIsPublicValue); // Revert UI if PATCH fails

        const errorMsg =
          error.response?.data?.detail || error.message || "Nie udało się ukryć wyjazdu.";
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
      setValue("is_public", true, { shouldDirty: false, shouldValidate: false });
      const isValid = await trigger(undefined, { shouldFocus: true });
      setValue("is_public", originalFormIsPublicValue, {
        shouldDirty: false,
        shouldValidate: false,
      }); // Revert for now

      if (!isValid) {
        toast({
          title: "Błąd walidacji",
          description: "Nie można opublikować wyjazdu. Formularz zawiera błędy.",
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

    const newPendingImages = Array.from(files).map((file) => ({
      id: `${file.name}-${new Date().getTime()}`,
      file,
    }));

    setPendingImages((prev) => [...prev, ...newPendingImages]);
    setIsUploadingImage(true);
    setDirectUploadError(null);
    let allUploadsSuccessful = true;
    const successfullyUploadedIds: string[] = [];

    for (const pendingImage of newPendingImages) {
      const imageFormData = new FormData();
      imageFormData.append("image", pendingImage.file);

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
        successfullyUploadedIds.push(response.data.image_id);
      } catch (err: any) {
        allUploadsSuccessful = false;
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          `Nie udało się przesłać pliku: ${pendingImage.file.name}.`;
        console.error("Direct image upload failed for file:", pendingImage.file.name, errorMsg);
        setDirectUploadError(
          (prevError) =>
            (prevError ? prevError + "\n" : "") +
            `Błąd przesyłania ${pendingImage.file.name}: ${errorMsg}`,
        );
      } finally {
        setPendingImages((prev) => prev.filter((p) => p.id !== pendingImage.id));
      }
    }

    if (successfullyUploadedIds.length > 0) {
      const currentImageIds = getValues("image_ids") || [];
      setValue("image_ids", [...currentImageIds, ...successfullyUploadedIds], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    setIsUploadingImage(false);
    if (event.target) {
      event.target.value = ""; // Reset file input for next selection
    }

    if (successfullyUploadedIds.length > 0 && allUploadsSuccessful) {
      toast({
        description:
          successfullyUploadedIds.length > 1
            ? `Dodano ${successfullyUploadedIds.length} zdjęć pomyślnie.`
            : "Zdjęcie dodane pomyślnie.",
      });
    } else if (successfullyUploadedIds.length > 0 && !allUploadsSuccessful) {
      toast({
        title: "Częściowy sukces przesyłania",
        description: `Dodano ${successfullyUploadedIds.length} z ${files.length} zdjęć. Sprawdź błędy poniżej pola przesyłania.`,
        variant: "default",
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

  const handleSetCover = (imageIdToSet: string) => {
    const currentImageIds = (getValues("image_ids") || []).filter((id) => id !== imageIdToSet);
    const newOrder = [imageIdToSet, ...currentImageIds];
    setValue("image_ids", newOrder, { shouldValidate: true, shouldDirty: true });
    toast({ description: "Ustawiono zdjęcie jako okładkę." });
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
    <EventHelpBarProvider>
      <BlockerWhenDirty control={control as any} />
      <BlockBrowserNavigation />
      <div
        className="flex flex-row md:justify-center gap-6 space-y-8 mx-auto"
        id="event-form-wrapper"
      >
        <div className="flex flex-col event-form-section-gap max-w-3xl mx-auto px-4 pb-12 md:mx-10 ">
          <EventDetailsSection
            project={mode === "workshop" ? "workshops" : "retreats"}
            control={control}
            register={register}
            errors={errors}
            includeMainAttractions={mode !== "workshop"}
          />
          {mode === "workshop" && (
            <WorkshopMetaSection control={control} register={register} errors={errors} />
          )}
          <EventInstructorsSection
            control={control}
            errors={errors}
            setValue={setValue}
            instructors={instructors}
            setIsInstructorModalOpen={setIsInstructorModalOpen}
            handleEditInstructor={handleEditInstructor}
            instructorToDelete={instructorToDelete}
            setInstructorToDelete={setInstructorToDelete}
            isDeletingInstructor={isDeletingInstructor}
            handleDeleteInstructor={handleDeleteInstructor}
          />
          {mode !== "workshop" && <EventSkillLevel control={control} errors={errors} />}
          <EventProgramSection
            project={mode === "workshop" ? "workshops" : "retreats"}
            control={control}
            register={register}
            errors={errors}
            programFields={programFields}
            append={append as (value: { description: string; imageId: string | null }) => void}
            remove={remove}
            calculatedDuration={calculatedDuration}
            dateRange={dateRange}
            setDateRange={setDateRange}
            setValue={setValue}
            uploadingProgramImages={uploadingProgramImages}
            onRemoveProgramImage={handleRemoveProgramImage}
            onProgramImageChange={handleProgramImageChange}
          />
          <EventLocationSection
            control={control}
            errors={errors}
            locations={locations}
            setIsLocationModalOpen={setIsLocationModalOpen}
            setEditingLocation={setEditingLocation}
            setLocationModalMode={setLocationModalMode}
          />
          {mode !== "workshop" && <EventHospitalitySection register={register} errors={errors} />}
          <EventPricingSection
            control={control}
            register={register}
            errors={errors}
            includeLists={mode !== "workshop"}
          />
          <EventImportantInfoSection register={register} errors={errors} />
          <EventPhotosSection
            errors={errors}
            watchedImageIds={watchedImageIds ?? []}
            handleRemoveImage={handleRemoveImage}
            handleImageSelected={handleImageSelected}
            isUploadingImage={isUploadingImage}
            directUploadError={directUploadError}
            pendingImages={pendingImages.map((p) => p.file)}
            control={control}
            name="image_ids"
            handleSetCover={handleSetCover}
          />

          {currentIsPublic && (
            <div className="flex flex-col gap-4 p-6 border rounded-lg bg-gray-50 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Widoczność</h3>
                  <p className="text-sm text-gray-500">
                    {mode === "workshop" ? "To wydarzenie" : "Ten wyjazd"} jest obecnie publicznie
                    widoczny.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                  onClick={handleToggleVisibility}
                  disabled={isTogglingVisibility}
                  type="button"
                >
                  {isTogglingVisibility ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ukrywanie...
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      {mode === "workshop" ? "Ukryj wydarzenie" : "Ukryj wyjazd"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        <EventHelpBar mode={mode} />
      </div>

      <DashboardFooter
        title={
          isEditMode
            ? mode === "workshop"
              ? "Edytuj wydarzenie"
              : "Edytuj wyjazd"
            : mode === "workshop"
              ? "Utwórz nowe wydarzenie"
              : "Utwórz nowy wyjazd"
        }
        onCreate={!isEditMode ? handleSubmit(onSubmit) : undefined}
        createLabel={
          isSubmitting
            ? "Tworzenie..."
            : mode === "workshop"
              ? "Utwórz wydarzenie"
              : "Utwórz wyjazd"
        }
        createLabelShort={isSubmitting ? "Tworzenie..." : "Utwórz"}
        createIcon={
          isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />
        }
        onUpdate={isEditMode ? handleSubmit(onSubmit) : undefined}
        updateLabel={isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
        updateLabelShort={isSubmitting ? "Zapisuję..." : "Zapisz"}
        updateIcon={
          isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />
        }
        viewPublicHref={
          isEditMode && eventId
            ? mode === "workshop"
              ? `${process.env.NEXT_PUBLIC_WORKSHOPS_HOST}/workshops/${slug || eventId}`
              : `${process.env.NEXT_PUBLIC_RETREATS_HOST}/retreats/${slug || eventId}`
            : undefined
        }
        viewPublicLabel="Zobacz stronę publiczną"
        viewPublicLabelShort="Zobacz"
        viewPublicIcon={<ExternalLink className="h-4 w-4" />}
        showPublishButton={isEditMode}
        isPublished={currentIsPublic}
        isPublishing={isTogglingVisibility}
        onPublishToggle={handlePublishButtonClick}
        publishButtonLabel={mode === "workshop" ? "Opublikuj wydarzenie" : "Opublikuj wyjazd"}
        publishButtonLabelShort="Opublikuj"
        unpublishButtonLabel={mode === "workshop" ? "Ukryj wydarzenie" : "Ukryj wyjazd"}
        unpublishButtonLabelShort="Ukryj"
        publishingButtonLabel="Zmieniam..."
        publishingButtonLabelShort="Zmieniam..."
        publishIcon={<Send className="h-4 w-4" />}
        unpublishIcon={<EyeOff className="h-4 w-4" />}
        publishingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
        isSaveDisabled={!isDirty}
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
              Czy na pewno chcesz opublikować to wyjazd? Stanie się ono widoczne dla wszystkich
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
    </EventHelpBarProvider>
  );
}
