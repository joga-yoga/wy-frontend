"use client";

import { zodResolver } from "@hookform/resolvers/zod"; // Import zodResolver
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns"; // Import date-fns functions
import { Edit2, PlusCircle, Trash2 } from "lucide-react"; // Import icons
import { Calendar as CalendarIcon } from "lucide-react"; // Use Calendar icon
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Controller,
  SubmitHandler, // Keep if onSubmit stays here, remove if passed in
  useFieldArray,
  useForm, // Import useForm
} from "react-hook-form";

import { Instructor, InstructorModal } from "@/components/instructors/InstructorModal";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { EventFormData, eventFormSchema, EventInitialData } from "@/lib/schemas/event";
import { cn } from "@/lib/utils"; // For conditional classes

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
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      // Provide default values here
      title: "",
      description: "",
      location: "",
      start_date: "",
      end_date: "",
      price: undefined, // Use undefined for optional number
      currency: "PLN",
      main_attractions: "",
      language: "",
      skill_level: "",
      country: "",
      accommodation_description: "",
      guest_welcome_description: "",
      food_description: "",
      price_includes: "",
      price_excludes: "",
      itinerary: "",
      included_trips: "",
      paid_attractions: "",
      spa_description: "",
      cancellation_policy: "",
      important_info: "",
      program: [], // Ensure this matches schema default
      image: undefined,
      instructor_ids: [], // Ensure this matches schema default
      is_public: false, // Default for create mode
    },
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
  const { fields: programFields, append, remove } = useFieldArray({ control, name: "program" });

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

  // Keep useEffect for fetching instructors on mount
  useEffect(() => {
    fetchInstructors();
  }, []); // Removed toast from dependency

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
        // Prepare and reset form using internal `reset`
        const dataForReset: Partial<EventFormData> = {};
        // Access shape from the underlying schema definition
        // Use ._def.schema.shape for refined schemas
        Object.keys((eventFormSchema._def as any).schema.shape).forEach((key) => {
          const fieldKey = key as keyof EventFormData;
          const initialValue = fetchedData[fieldKey as keyof EventInitialData];

          // Skip fields that shouldn't be reset directly from fetched data
          if (fieldKey === "image") {
            return;
          }

          // Handle is_public separately if needed (already handled by setCurrentIsPublic)
          if (fieldKey === "is_public") {
            // Set the form's is_public based on fetched data for the visibility toggle logic
            dataForReset[fieldKey] = fetchedData.is_public ?? false;
            return;
          }

          if (fieldKey === "start_date" || fieldKey === "end_date") {
            dataForReset[fieldKey] =
              typeof initialValue === "string" ? initialValue.split("T")[0] : undefined;
          } else if (fieldKey === "program") {
            // Simplify program handling assuming backend sends string[] or null/undefined
            dataForReset[fieldKey] = Array.isArray(initialValue) ? initialValue : [];
          } else if (fieldKey === "instructor_ids") {
            // Simplify instructor_ids handling
            dataForReset[fieldKey] = Array.isArray(initialValue) ? initialValue : [];
          } else if (initialValue !== undefined && initialValue !== null) {
            // Use type assertion as workaround for complex Zod types (e.g., price/currency with .or(""))
            (dataForReset as any)[fieldKey] = initialValue;
          }
        });
        // Store the image_id separately if needed, e.g., for display
        if (fetchedData.image_id) {
          dataForReset.image_id = fetchedData.image_id;
        }
        reset(dataForReset); // Use internal reset
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
    console.log("Internal onSubmit triggered", data);
    // ... (submission logic will go here, using internal state/router)
    const formData = new FormData();
    const appendIfExists = (key: string, value: any) => {
      if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null && value !== "") {
        formData.append(key, typeof value === "number" ? value.toString() : value);
      }
    };

    Object.keys(data).forEach((key) => {
      const fieldKey = key as keyof EventFormData;
      if (fieldKey === "image") {
        if (data.image && data.image.length > 0 && data.image[0] instanceof File) {
          formData.append("image", data.image[0]);
        }
      } else if (fieldKey === "instructor_ids") {
        // Always send instructor_ids, even if empty array, to potentially clear selection
        (data.instructor_ids ?? []).forEach((id) => formData.append("instructor_ids", id));
      } else if (fieldKey === "program") {
        // Always send program, even if empty array
        (data.program ?? []).forEach((dayDesc) => {
          if (dayDesc !== null && dayDesc !== undefined) {
            // Filter out potential null/undefined in array
            formData.append("program", dayDesc);
          }
        });
      } else if (fieldKey === "is_public") {
        // Always append is_public for create/update, backend should handle it
        appendIfExists(fieldKey, data[fieldKey]);
      } else if (fieldKey === "image_id") {
        // Do not send image_id back in the form data
        return;
      } else {
        appendIfExists(fieldKey, data[fieldKey]);
      }
    });

    try {
      if (isEditMode) {
        await axiosInstance.put(`/events/${eventId}`, formData);
        toast({ description: "Wydarzenie zaktualizowane pomyślnie!" });
      } else {
        await axiosInstance.post("/events", formData);
        toast({ description: "Wydarzenie utworzone pomyślnie!" });
      }
      // router.push("/dashboard/events"); // Redirect on success?
      router.refresh(); // Refresh data on the current page
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

  // === Handler to initiate editing an instructor ===
  const handleEditInstructor = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsInstructorModalOpen(true);
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
    <div className="space-y-8 pb-10" id="event-form">
      {/* DashboardHeader now uses internal state/handlers */}
      <DashboardHeader
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
        } // Use internal isSubmitting
      />
      {/* Remove intermediate div, apply max-width and spacing to this outer div */}
      <div className="space-y-10 max-w-3xl mx-auto">
        {/* Form fields use internal register, errors, control */}
        {/* Section 1: Title, Description & Section 3: Details merged */}
        <div className="space-y-6" id="event-details">
          <div className="space-y-2">
            <Label htmlFor="title">Tytuł *</Label>
            <Input id="title" {...register("title")} placeholder="..." />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea id="description" {...register("description")} rows={4} placeholder="..." />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Section 2: Price, Included/Excluded */}
        <div className="space-y-6" id="event-pricing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Cena</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                {...register("price", {
                  setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                })} // Convert empty string or value to number/undefined
                placeholder="..."
              />
              {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Waluta</Label>
              <Input
                id="currency"
                {...register("currency")}
                maxLength={3}
                placeholder="np. PLN, EUR, USD"
                defaultValue={"PLN"}
              />
              {errors.currency && <p className="text-sm text-red-500">{errors.currency.message}</p>}
            </div>
          </div>
          {/* ... price_includes, price_excludes ... */}
          <div className="space-y-2">
            <Label htmlFor="price_includes">Co jest wliczone w cenę</Label>
            <Textarea
              id="price_includes"
              {...register("price_includes")}
              rows={3}
              placeholder="..."
            />
            {errors.price_includes && (
              <p className="text-sm text-red-500">{errors.price_includes.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_excludes">Co nie jest wliczone w cenę</Label>
            <Textarea
              id="price_excludes"
              {...register("price_excludes")}
              rows={3}
              placeholder="..."
            />
            {errors.price_excludes && (
              <p className="text-sm text-red-500">{errors.price_excludes.message}</p>
            )}
          </div>
        </div>

        {/* Section 4: Location & Dates */}
        <div className="space-y-6" id="event-location-dates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Lokalizacja (miasto)</Label>
              <Input id="location" {...register("location")} placeholder="np. Warszawa" />
              {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Kraj</Label>
              <Input id="country" {...register("country")} placeholder="np. Polska" />
              {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="space-y-2">
            <Label>Termin wydarzenia *</Label>
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
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
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
            {errors.end_date && (
              <p className="text-sm text-red-500">
                Błąd daty zakończenia: {errors.end_date.message}
              </p>
            )}
          </div>
        </div>

        {/* Section 5: Accommodation, Guests, Food */}
        <div className="space-y-6" id="event-hospitality">
          <div className="space-y-2">
            <Label htmlFor="accommodation_description">Nocleg</Label>
            <Textarea
              id="accommodation_description"
              {...register("accommodation_description")}
              rows={3}
              placeholder="..."
            />
            {errors.accommodation_description && (
              <p className="text-sm text-red-500">{errors.accommodation_description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest_welcome_description">Powitanie gości</Label>
            <Textarea
              id="guest_welcome_description"
              {...register("guest_welcome_description")}
              rows={3}
              placeholder="..."
            />
            {errors.guest_welcome_description && (
              <p className="text-sm text-red-500">{errors.guest_welcome_description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="food_description">Wyżywienie</Label>
            <Textarea
              id="food_description"
              {...register("food_description")}
              rows={3}
              placeholder="..."
            />
            {errors.food_description && (
              <p className="text-sm text-red-500">{errors.food_description.message}</p>
            )}
          </div>
        </div>

        {/* Section 6: Itinerary, Trips, Extra Attractions, Spa */}
        <div className="space-y-6" id="event-activities">
          <div className="space-y-2">
            <Label htmlFor="itinerary">Plan podróży (Harmonogram)</Label>
            <Textarea id="itinerary" {...register("itinerary")} rows={5} placeholder="..." />
            {errors.itinerary && <p className="text-sm text-red-500">{errors.itinerary.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="included_trips">Wliczone wycieczki</Label>
            <Textarea
              id="included_trips"
              {...register("included_trips")}
              rows={3}
              placeholder="..."
            />
            {errors.included_trips && (
              <p className="text-sm text-red-500">{errors.included_trips.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="paid_attractions">Dodatkowe atrakcje za dopłatą</Label>
            <Textarea
              id="paid_attractions"
              {...register("paid_attractions")}
              rows={3}
              placeholder="..."
            />
            {errors.paid_attractions && (
              <p className="text-sm text-red-500">{errors.paid_attractions.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="spa_description">Zabiegi spa</Label>
            <Textarea
              id="spa_description"
              {...register("spa_description")}
              rows={3}
              placeholder="..."
            />
            {errors.spa_description && (
              <p className="text-sm text-red-500">{errors.spa_description.message}</p>
            )}
          </div>
        </div>

        {/* Section: Program (dynamic) */}
        <div className="space-y-6" id="event-program">
          <h2 className="text-lg font-semibold border-b pb-2">
            Program wydarzenia (dzień po dniu)
          </h2>
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
            <Label htmlFor="cancellation_policy">Zasady anulowania rezerwacji</Label>
            <Textarea
              id="cancellation_policy"
              {...register("cancellation_policy")}
              rows={3}
              placeholder="..."
            />
            {errors.cancellation_policy && (
              <p className="text-sm text-red-500">{errors.cancellation_policy.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="important_info">Warto wiedzieć przed wyjazdem</Label>
            <Textarea
              id="important_info"
              {...register("important_info")}
              rows={3}
              placeholder="..."
            />
            {errors.important_info && (
              <p className="text-sm text-red-500">{errors.important_info.message}</p>
            )}
          </div>
        </div>

        {/* Section 8: Images */}
        <div className="space-y-6" id="event-images-section">
          {isEditMode && getValues("image_id") && (
            <div className="mb-4">
              <Label>Aktualne zdjęcie</Label>
              <img
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/${getValues("image_id")}`}
                alt="Current event image"
                className="mt-2 max-w-xs rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Przesłanie nowego zdjęcia zastąpi aktualne.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="image">
              {isEditMode && getValues("image_id")
                ? "Zmień zdjęcie wydarzenia"
                : "Główne zdjęcie wydarzenia"}
            </Label>
            <Input id="image" type="file" {...register("image")} accept="image/*" />
            {errors.image && (
              <p className="text-sm text-red-500">{(errors.image as any)?.message}</p>
            )}
          </div>
        </div>

        {/* Section: Instructors */}
        <div className="space-y-6" id="event-instructors">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold">Instruktorzy</h2>
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
              <ScrollArea className="h-48 w-full rounded-md border p-4">
                <div className="space-y-2">
                  {instructors.length > 0 ? (
                    instructors.map((instructor) => (
                      <div
                        key={instructor.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-muted/50"
                      >
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditInstructor(instructor)}
                          className="flex-shrink-0 h-7 px-2"
                          aria-label={`Edit ${instructor.name}`}
                        >
                          <Edit2 size={14} className="text-muted-foreground" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nie znaleziono instruktorów.{" "}
                      <Link
                        href="/dashboard/instructors/create"
                        className="text-blue-600 hover:underline"
                      >
                        Dodaj pierwszego
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          />
          {errors.instructor_ids && (
            <p className="text-sm text-red-500">{errors.instructor_ids.message}</p>
          )}
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
            <h2 className="text-lg font-semibold border-b pb-2">Widoczność początkowa</h2>
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
      </div>

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
    </div>
  );
}
