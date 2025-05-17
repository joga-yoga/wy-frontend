"use client";

import { yupResolver } from "@hookform/resolvers/yup"; // Import yupResolver
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns"; // Import date-fns functions
import { Edit2, Loader2, PlusCircle, Trash2 } from "lucide-react"; // Import icons
import { Calendar as CalendarIcon } from "lucide-react"; // Use Calendar icon
import { Cat, Dog, Fish, Rabbit, Turtle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Controller,
  FieldArrayPath, // Import FieldArrayPath
  FieldErrors, // Import FieldErrors type
  SubmitErrorHandler, // Import SubmitErrorHandler
  SubmitHandler, // Keep if onSubmit stays here, remove if passed in
  useFieldArray, // Import useForm
  useForm, // Import useForm
} from "react-hook-form";
import * as yup from "yup"; // Import yup itself for casting

import MultipleSelector, { Option } from "@/components/custom/multiple-selector";
import { Instructor, InstructorModal } from "@/components/instructors/InstructorModal";
import { DashboardFooter } from "@/components/layout/DashboardFooter";
import { LocationModal } from "@/components/locations/LocationModal"; // Import LocationModal
import {
  AlertDialog, // Import AlertDialog components
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
} from "@/components/ui/select"; // Import Select components
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { EventFormData, eventFormSchema, EventInitialData } from "@/lib/schemas/event";
import { cn } from "@/lib/utils"; // For conditional classes

import { DynamicArrayInput } from "./DynamicArrayInput";

const OPTIONS: Option[] = [
  { label: "Początkujący", value: "beginner" },
  { label: "Średni", value: "intermediate" },
  { label: "Zaawansowany", value: "advanced" },
];
// Define Location type
export interface Location {
  id: string;
  title: string;
  country?: string | null;
}

interface EventFormProps {
  eventId?: string;
}

export function EventForm({ eventId }: EventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const isEditMode = !!eventId;

  // Add internal state if needed (e.g., for loading, fetched data)
  const [isLoading, setIsLoading] = useState(isEditMode); // Example state
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [currentIsPublic, setCurrentIsPublic] = useState<boolean>(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [calculatedDuration, setCalculatedDuration] = useState(0);
  // State for the Date Range Picker
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  // === State for Instructor Modal ===
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  // === State for Instructor being edited ===
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  // === State for Instructor Deletion ===
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);
  const [isDeletingInstructor, setIsDeletingInstructor] = useState(false);

  // === ADDED: State for direct image upload ===
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [directUploadError, setDirectUploadError] = useState<string | null>(null);
  // No longer a single preview URL, image_ids from form will be the source of truth for display
  // const [currentImagePreviewUrl, setCurrentImagePreviewUrl] = useState<string | null>(null);

  // === State for Location ===
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationModalMode, setLocationModalMode] = useState<"create" | "edit">("create");

  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["react", "angular"]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }, // Get errors, isSubmitting directly
    control, // Get control directly
    watch, // Get watch directly
    getValues, // Get getValues directly
    reset, // Need reset for initial data
    setValue, // Need setValue to update dates from picker
  } = useForm<EventFormData>({
    resolver: yupResolver(eventFormSchema as yup.ObjectSchema<EventFormData>), // Use yupResolver with cast
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
      price_excludes: [], // Changed to array
      included_trips: [], // Changed to array
      paid_attractions: [], // Changed to array
      cancellation_policy: undefined,
      important_info: undefined,
      program: [],
      instructor_ids: [],
      is_public: false,
      location_id: null,
      image_ids: [], // Changed from image_id to image_ids
    } as Partial<EventFormData>, // Explicitly type defaultValues
  });

  const startDateString = watch("start_date");
  const endDateString = watch("end_date");

  // Effect to initialize dateRange state from form values
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

  // Setup useFieldArray for the program
  const {
    fields: programFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "program" as FieldArrayPath<EventFormData>,
  });

  // === ADDED: Setup useFieldArray for price_includes ===
  const {
    fields: priceIncludesFields,
    append: appendPriceInclude,
    remove: removePriceInclude,
    replace: replacePriceIncludes, // For setting initial values or whole array changes
  } = useFieldArray({
    control,
    name: "price_includes" as FieldArrayPath<EventFormData>, // Assuming 'price_includes' is an array of strings
  });

  // === Fetch Instructors Function ===
  const fetchInstructors = async () => {
    try {
      const response = await axiosInstance.get<Instructor[]>("/instructors");
      setInstructors(response.data);
    } catch (error) {
      console.error("Failed to fetch instructors:", error);
      // Consider showing a toast message
      toast({
        description: "Nie udało się załadować listy instruktorów.",
        variant: "destructive",
      });
    }
  };

  // === Fetch Locations Function ===
  const fetchLocations = async () => {
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
  };

  // Keep useEffect for fetching instructors on mount
  useEffect(() => {
    fetchInstructors();
    fetchLocations(); // Fetch locations on mount
  }, []);

  // Update image and visibility state when initialData changes
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

        // Iterate over the keys of the Yup object shape
        const yupSchemaFields = eventFormSchema.fields;
        for (const key in yupSchemaFields) {
          const fieldKey = key as keyof EventFormData;
          const initialValue = fetchedData[fieldKey as keyof EventInitialData];

          if (fieldKey === ("image" as any) || fieldKey === ("image_id" as any)) {
            // also skip old image_id
            // Still relevant to skip an 'image' field if it exists
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
            const instructorIdsVal = fetchedData.instructor_ids;
            if (Array.isArray(instructorIdsVal)) {
              dataForReset.instructor_ids = instructorIdsVal.filter(
                (item): item is string => typeof item === "string",
              );
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
            // Changed from image_id to image_ids
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
            // Ensure default for currency if not present
            dataForReset[fieldKey] = "PLN";
          } else if (fieldKey === "language" && !initialValue) {
            dataForReset[fieldKey] = "pl";
          }
          // For other fields, if initialValue is undefined/null, they won't be set in dataForReset,
          // and react-hook-form will use defaultValues from useForm.
        }

        // Ensure language has a default if not present in fetchedData
        if (!dataForReset.language) {
          dataForReset.language = "pl";
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
  }, [eventId, isEditMode, reset, toast]); // Add reset to dependency array

  // Handler for toggling public status
  const handleToggleVisibility = async () => {
    if (!eventId) return;

    setIsTogglingVisibility(true);
    const newStatus = !currentIsPublic;

    try {
      await axiosInstance.patch(`/events/${eventId}`, { is_public: newStatus });
      setCurrentIsPublic(newStatus);
      // Update the form state as well if 'is_public' is used elsewhere
      setValue("is_public", newStatus, { shouldDirty: true });
      toast({ description: `Wydarzenie ${newStatus ? "opublikowane" : "ukryte"} pomyślnie.` });
    } catch (error: any) {
      console.error("Failed to toggle event visibility:", error);
      toast({
        description: `Nie udało się zmienić widoczności: ${error.response?.data?.detail || error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // onSubmit handler definition (will need to be defined here)
  const onSubmit: SubmitHandler<EventFormData> = async (data) => {
    console.log("Internal onSubmit triggered with data:", data);

    // Prepare the payload as a JSON object
    const payload: Partial<EventFormData> = {
      ...data,
      price_includes: (data.price_includes ?? []).filter(
        (item) => typeof item === "string" && item.trim() !== "",
      ),
      price_excludes: (data.price_excludes ?? []).filter(
        (item) => typeof item === "string" && item.trim() !== "",
      ),
      program: (data.program ?? []).filter(
        (item) => typeof item === "string" && item.trim() !== "",
      ),
      included_trips: (data.included_trips ?? []).filter(
        (item) => typeof item === "string" && item.trim() !== "",
      ),
      paid_attractions: (data.paid_attractions ?? []).filter(
        (item) => typeof item === "string" && item.trim() !== "",
      ),
      skill_level: (data.skill_level ?? []).filter(
        (item) => typeof item === "string" && item.trim() !== "",
      ),
      image_ids: data.image_ids ?? [], // Ensure image_ids is an array
      main_attractions: (data.main_attractions ?? []).filter(
        (item) => typeof item === "string" && item.trim() !== "",
      ), // Process as array
    };

    // Remove image field explicitly if it somehow lingers
    delete (payload as any).image;
    delete (payload as any).image_id; // also remove old image_id if present

    // Ensure instructor_ids is an array, even if empty, for consistency
    payload.instructor_ids = data.instructor_ids ?? [];

    try {
      if (isEditMode) {
        // For PUT, it's good practice to send only changed fields if using PATCH behavior,
        // but for simplicity with PUT, we send the whole payload.
        // Backend PUT is designed to handle full or partial updates via EventUpdatePartial.
        await axiosInstance.put(`/events/${eventId}`, payload);
        toast({ description: "Wydarzenie zaktualizowane pomyślnie!" });
        router.refresh(); // Refresh data on the current page for updates
      } else {
        const response = await axiosInstance.post<{ id: string }>("/events", payload);
        const newEventId = response.data.id; // Extract the ID

        toast({ description: "Wydarzenie utworzone pomyślnie!" });

        // Redirect to the edit page for the new event
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

  // === Handler for saving instructor from Modal ===
  const handleInstructorSaved = (savedInstructor: Instructor) => {
    // Add or update the instructor in the local state
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
    // Optionally, auto-select the newly added instructor
    const currentIds = getValues("instructor_ids") || [];
    if (!currentIds.includes(savedInstructor.id)) {
      setValue("instructor_ids", [...currentIds, savedInstructor.id], { shouldDirty: true });
    }

    setIsInstructorModalOpen(false); // Close modal
  };

  // === Handler for Location Saved (from modal) ===
  const handleLocationSaved = (savedLocation: Location) => {
    fetchLocations(); // Re-fetch all locations
    setIsLocationModalOpen(false);
    setEditingLocation(null);
    // Set the saved/selected location as the event's location_id
    setValue("location_id", savedLocation.id, { shouldDirty: true });
    toast({ description: "Lokalizacja zapisana pomyślnie." });
  };

  // === Handler to initiate editing an instructor ===
  const handleEditInstructor = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsInstructorModalOpen(true);
  };

  // === Handler for Deleting Instructor ===
  const handleDeleteInstructor = async () => {
    if (!instructorToDelete) return;

    setIsDeletingInstructor(true);
    try {
      await axiosInstance.delete(`/instructors/${instructorToDelete.id}`);
      toast({ description: `Instruktor "${instructorToDelete.name}" usunięty pomyślnie.` });

      // Remove from local instructors state
      setInstructors((prev) => prev.filter((i) => i.id !== instructorToDelete.id));

      // Uncheck/remove from form state if selected
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

      setInstructorToDelete(null); // Close dialog
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

  // === ADDED: Watch image_id to update preview ===
  const watchedImageIds = watch("image_ids"); // Changed from image_id

  // === ADDED: Handler for when a new image file is selected ===
  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    setDirectUploadError(null);

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

      const newImageId = response.data.image_id;
      const currentImageIds = getValues("image_ids") || [];
      setValue("image_ids", [...currentImageIds, newImageId], {
        shouldValidate: true,
        shouldDirty: true,
      });
      toast({ description: "Zdjęcie dodane pomyślnie." });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || err.message || "Nie udało się przesłać zdjęcia.";
      console.error("Direct image upload failed:", errorMsg);
      setDirectUploadError(errorMsg);
      toast({
        title: "Błąd przesyłania zdjęcia",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      // Clear the file input
      if (event.target) {
        event.target.value = "";
      }
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
    // Note: Actual deletion from Cloudinary happens on form submission (PUT/PATCH) by the backend
    // if this imageId is no longer in the image_ids list.
  };

  // Loading state rendering
  if (isLoading && isEditMode) {
    // Only show skeleton in edit mode while loading initial data
    // ... (skeleton rendering remains same)
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

  // Error state rendering
  if (fetchError) {
    // ... (error rendering remains same)
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{fetchError}</p>
        <Button onClick={() => router.back()}>Wróć</Button>
      </div>
    );
  }

  // Main form rendering
  return (
    <div className="space-y-8 pt-10" id="event-form">
      {/* Remove intermediate div, apply max-width and spacing to this outer div */}
      <div className="space-y-[64px] max-w-3xl mx-auto">
        {/* Form fields use internal register, errors, control */}
        {/* Section 1: Title, Description & Section 3: Details merged */}
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
            <Input id="title" {...register("title")} placeholder="Tytuł" />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" size="event">
              Opis
            </Label>
            <Label htmlFor="description" size="event-description">
              Przedstaw swoją ofertę w krótkim podsumowaniu, aby przyciągnąć uwagę klientów
            </Label>
            <Separator className="my-8" />
            <Textarea id="description" {...register("description")} rows={4} placeholder="Opis" />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-[64px]" id="event-details">
          <div className="space-y-6" id="event-location-dates">
            {/* Date Range Picker */}
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
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Wybierz zakres dat</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(selectedRange: DateRange | undefined) => {
                      setDateRange(selectedRange);
                      // Update react-hook-form fields
                      if (selectedRange?.from) {
                        setValue("start_date", format(selectedRange.from, "yyyy-MM-dd"), {
                          shouldValidate: true,
                        });
                      } else {
                        setValue("start_date", "", { shouldValidate: true }); // Clear if no start date
                      }
                      if (selectedRange?.to) {
                        setValue("end_date", format(selectedRange.to, "yyyy-MM-dd"), {
                          shouldValidate: true,
                        });
                      } else {
                        setValue("end_date", "", { shouldValidate: true }); // Clear if no end date
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              {/* Display validation errors for start/end dates below the popover */}
              {errors.start_date && (
                <p className="text-sm text-red-500">
                  Błąd daty rozpoczęcia: {errors.start_date.message}
                </p>
              )}
              {!errors.start_date && errors.end_date && (
                <p className="text-sm text-red-500">
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
                />
              )}
            />
            {errors.skill_level && (
              <p className="text-sm text-red-500">{errors.skill_level.message}</p>
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
                <Select onValueChange={field.onChange} value={field.value || "pl"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz język" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pl">Polski</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.language && (
              <p className="text-sm text-destructive">{errors.language.message}</p>
            )}
          </div>
        </div>

        {/* Section: Location Selector */}
        <div className="space-y-2">
          <Label htmlFor="location_id" size="event">
            Lokalizacja
          </Label>
          <Separator className="my-8" />
          <Controller
            name="location_id"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={locations.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        locations.length > 0
                          ? "Wybierz lokalizację"
                          : "Brak lokalizacji, dodaj nową"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/* No empty SelectItem value needed if Select placeholder works */}
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
                      // If nothing is selected, or if it's to prevent error,
                      // we might want to ensure a location is selected first for editing.
                      // Or, this button is disabled if !field.value
                      toast({ description: "Wybierz lokalizację do edycji.", variant: "default" });
                    }
                  }}
                  disabled={!field.value || locations.length === 0} // Disable if no value or no locations
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
              </div>
            )}
          />
          {errors.location_id && (
            <p className="text-sm text-destructive">{errors.location_id.message}</p>
          )}
        </div>

        {/* Section 2: Price, Included/Excluded */}
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
                  })} // Convert empty string or value to number/undefined
                  placeholder="Cena za jedną osobę"
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex">
                  Waluta
                </Label>
                <Controller
                  name="currency"
                  control={control}
                  defaultValue="PLN" // Ensure default value is set for Controller
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "PLN"} // Ensure value is controlled
                      // defaultValue="PLN" // Handled by Controller's defaultValue and field.value
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Wybierz walutę" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLN">PLN</SelectItem>
                        {/* Add other currencies here when needed */}
                        {/* <SelectItem value="EUR">EUR</SelectItem> */}
                        {/* <SelectItem value="USD">USD</SelectItem> */}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.currency && (
                  <p className="text-sm text-red-500">{errors.currency.message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_includes" size="event">
              Co jest wliczone w cenę
            </Label>
            <Label htmlFor="price_includes" size="event-description">
              Wymień wszystkie aktywności, udogodnienia i usługi, które są zawarte w cenie pakietu.
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
                />
              )}
            />
          </div>
        </div>

        {/* Section: Main Attractions - ADDED */}
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
              />
            )}
          />
        </div>

        {/* Section 5: Accommodation, Guests, Food */}
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
            />
            {errors.accommodation_description && (
              <p className="text-sm text-red-500">{errors.accommodation_description.message}</p>
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
            />
            {errors.guest_welcome_description && (
              <p className="text-sm text-red-500">{errors.guest_welcome_description.message}</p>
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
            />
            {errors.food_description && (
              <p className="text-sm text-red-500">{errors.food_description.message}</p>
            )}
          </div>
        </div>

        {/* Section 6: Itinerary, Trips, Extra Attractions, Spa */}
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
                />
              )}
            />
          </div>
        </div>

        {/* Section: Program (dynamic) */}
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
              <Label htmlFor={`program.${index}`} className="pt-2 font-semibold whitespace-nowrap">
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
                />
                {errors.program?.[index] && (
                  <p className="text-sm text-red-500">{errors.program[index]?.message}</p>
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

        {/* Section 7: Policies and Important Info */}
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
            />
            {errors.cancellation_policy && (
              <p className="text-sm text-red-500">{errors.cancellation_policy.message}</p>
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
            />
            {errors.important_info && (
              <p className="text-sm text-red-500">{errors.important_info.message}</p>
            )}
          </div>
        </div>

        {/* Section 8: Images */}
        <div className="space-y-6" id="event-images-section">
          <Label htmlFor="images" size="event">
            Zdjęcia wydarzenia
          </Label>
          <Label htmlFor="images" size="event-description">
            Dodaj zdjęcia, które pomogą uczestnikom zrozumieć, co czeka ich na wydarzeniu
          </Label>
          <Separator className="my-8" />
          {watchedImageIds && watchedImageIds.length > 0 && (
            <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {watchedImageIds.map((imageId) => (
                <div key={imageId} className="relative group">
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_200,h_150/v1/${imageId}`}
                    alt="Zdjęcie wydarzenia"
                    className="rounded border object-cover w-full h-[150px]"
                    onError={(e) => {
                      // Optionally hide or show placeholder if image fails to load
                      // e.currentTarget.style.display = "none";
                    }}
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
                ? "Dodaj kolejne zdjęcie"
                : "Dodaj zdjęcia wydarzenia"}
            </Label>
            <Input
              id="image-upload-input"
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              disabled={isUploadingImage}
            />
            {isUploadingImage && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Przesyłanie zdjęcia...
              </div>
            )}
            {directUploadError && <p className="text-sm text-red-500">{directUploadError}</p>}
            {errors.image_ids && <p className="text-sm text-red-500">{errors.image_ids.message}</p>}
          </div>
        </div>

        {/* Section: Instructors */}
        <div className="space-y-6" id="event-instructors">
          <div className="space-y-2">
            <Label htmlFor="instructors" size="event">
              Instruktorzy
            </Label>
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
                // Wrap ScrollArea inside AlertDialog provider
                <AlertDialog onOpenChange={(open) => !open && setInstructorToDelete(null)}>
                  <ScrollArea className="h-48 w-full rounded-md border p-4">
                    <div className="space-y-2">
                      {instructors.length > 0 ? (
                        instructors.map((instructor) => (
                          <div
                            key={instructor.id}
                            className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-muted/50"
                          >
                            {/* Checkbox and Label */}
                            <div className="flex items-center gap-2 flex-grow">
                              <Checkbox
                                id={`instructor-${instructor.id}`}
                                checked={field.value?.includes(instructor.id)}
                                onCheckedChange={(checked) => {
                                  const currentIds = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentIds, instructor.id]);
                                  } else {
                                    field.onChange(currentIds.filter((id) => id !== instructor.id));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`instructor-${instructor.id}`}
                                className="font-normal cursor-pointer"
                              >
                                {instructor.name}
                              </Label>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex items-center flex-shrink-0 gap-1">
                              {/* Edit Button */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditInstructor(instructor)}
                                className="h-7 px-2"
                                aria-label={`Edit ${instructor.name}`}
                              >
                                <Edit2 size={14} className="text-muted-foreground" />
                              </Button>
                              {/* Delete Button Trigger */}
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setInstructorToDelete(instructor)}
                                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  aria-label={`Delete ${instructor.name}`}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nie znaleziono instruktorów.</p>
                      )}
                    </div>
                    {/* Confirmation Dialog Content */}
                    {instructorToDelete && (
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Na pewno usunąć instruktora?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie instruktora
                            &quot;<strong>{instructorToDelete.name}</strong>&quot; z Twojej listy i
                            wszystkich powiązanych wydarzeń.
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
              <p className="text-sm text-red-500">{errors.instructor_ids.message}</p>
            )}
          </div>
        </div>

        {/* Section 9: Visibility */}
        {isEditMode && (
          <div className="space-y-6" id="event-visibility">
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant={currentIsPublic ? "destructive" : "default"}
                onClick={handleToggleVisibility}
                disabled={isTogglingVisibility}
              >
                {isTogglingVisibility
                  ? "Zmieniam..."
                  : currentIsPublic
                    ? "Ukryj wydarzenie (Unpublish)"
                    : "Opublikuj wydarzenie (Publish)"}
              </Button>
              <p className="text-sm text-gray-500">
                {currentIsPublic
                  ? "Wydarzenie jest publiczne i widoczne w wyszukiwarce."
                  : "Wydarzenie jest prywatne. Opublikuj, aby było widoczne."}
              </p>
            </div>
          </div>
        )}
        {!isEditMode && (
          <div className="space-y-2" id="event-visibility">
            <Label htmlFor="is_public_create" size="event">
              Widoczność początkowa
            </Label>
            <Separator className="my-8" />
            <div className="flex items-center space-x-2">
              <Controller
                name="is_public"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="is_public_create"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_public_create" className="font-normal">
                Opublikuj wydarzenie od razu po utworzeniu
              </Label>
            </div>
            {errors.is_public && <p className="text-sm text-red-500">{errors.is_public.message}</p>}
          </div>
        )}

        {/* Display all form errors at the bottom */}
        {Object.keys(errors).length > 0 && (
          <div
            className="mt-6 p-4 border border-red-300 bg-red-50 rounded-md space-y-2"
            id="form-errors-summary"
          >
            <h3 className="text-lg font-semibold text-red-700">Wystąpiły błędy w formularzu:</h3>
            <ul className="list-disc list-inside pl-2 text-red-600 text-sm">
              {Object.entries(errors).map(([fieldName, fieldError]) => {
                if (fieldError && fieldError.message) {
                  // Handle direct field errors
                  return <li key={fieldName}>{`${fieldName}: ${fieldError.message}`}</li>;
                } else if (Array.isArray(fieldError)) {
                  // Handle errors in field arrays (e.g., program, price_includes)
                  return fieldError.map((errorItem, index) =>
                    errorItem && errorItem.message ? (
                      <li
                        key={`${fieldName}.${index}`}
                      >{`${fieldName}[${index}]: ${errorItem.message}`}</li>
                    ) : null,
                  );
                } else if (typeof fieldError === "object" && fieldError !== null) {
                  // Handle cases where fieldError is an object but not an array (e.g. for price_includes root error)
                  // This might be a root error for the array itself if not using FieldArray specific errors
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

      <DashboardFooter
        title={isEditMode ? "Edytuj wydarzenie" : "Utwórz nowe wydarzenie"}
        onUpdate={handleSubmit(onSubmit)} // Pass the internal onSubmit to handleSubmit
        updateLabel={
          isSubmitting
            ? isEditMode
              ? "Zapisywanie..."
              : "Tworzenie..."
            : isEditMode
              ? "Zapisz zmiany"
              : "Utwórz wydarzenie"
        }
        // Pass the href for the public page link if in edit mode
        viewPublicHref={isEditMode && eventId ? `/events/${eventId}` : undefined}
        viewPublicLabel="Zobacz stronę publiczną" // Customize label
      />

      {/* === Render Instructor Modal === */}
      <InstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => {
          setIsInstructorModalOpen(false);
          setEditingInstructor(null); // Clear editing state on close
        }}
        onInstructorSaved={handleInstructorSaved}
        // Pass editingInstructor data or null for create mode
        initialInstructor={editingInstructor}
      />

      {/* LocationModal */}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => {
            setIsLocationModalOpen(false);
            setEditingLocation(null); // Clear editing state on close
          }}
          onLocationSaved={handleLocationSaved}
          initialData={editingLocation}
          mode={locationModalMode}
        />
      )}
    </div>
  );
}
