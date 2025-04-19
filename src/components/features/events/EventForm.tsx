"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // Import useEffect
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance"; // Add axios instance import

// Define Instructor interface
interface Instructor {
  id: string;
  name: string;
  // Add other relevant instructor fields if needed, e.g., image_id
}

// Define the schema within the component or import from a shared location
const eventFormSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().min(1, "Data rozpoczęcia jest wymagana"),
  end_date: z.string().min(1, "Data zakończenia jest wymagana"),
  price: z.coerce.number().min(0, "Cena musi być liczbą dodatnią").optional(),
  currency: z.string().max(3).optional(),
  main_attractions: z.string().optional(),
  language: z.string().optional(),
  skill_level: z.string().optional(),
  country: z.string().optional(),
  accommodation_description: z.string().optional(),
  guest_welcome_description: z.string().optional(),
  food_description: z.string().optional(),
  price_includes: z.string().optional(),
  price_excludes: z.string().optional(),
  activity_days: z.coerce.number().int().positive().optional(),
  itinerary: z.string().optional(),
  included_trips: z.string().optional(),
  paid_attractions: z.string().optional(),
  spa_description: z.string().optional(),
  cancellation_policy: z.string().optional(),
  important_info: z.string().optional(),
  image: z.any().optional(), // Keep as any for FileList
  is_public: z.boolean(),
  instructor_ids: z.array(z.string().uuid()).optional(), // Assuming UUID strings for IDs
});

export type EventFormData = z.infer<typeof eventFormSchema>;

// Define a type for the initial data that might include fields not in the form schema (like IDs)
// We are mainly interested in image_id here for displaying the current image.
// Ideally, this should match the structure returned by your GET /events/{id} endpoint.
interface EventInitialDataBase extends Partial<EventFormData> {
  // Renamed to avoid conflict
  id?: string; // Assuming event ID might be useful
  image_id?: string | null;
  // Add other fields returned by the API but not directly in the form schema if needed
}

// Export the interface
export type EventInitialData = EventInitialDataBase;

interface EventFormProps {
  initialData?: EventInitialData;
  onSubmit: (data: EventFormData, formData: FormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  cancelHref: string;
}

// Base default values matching the schema
const baseDefaultValues: EventFormData = {
  title: "",
  description: undefined,
  location: undefined,
  start_date: "",
  end_date: "",
  price: undefined,
  currency: undefined,
  main_attractions: undefined,
  language: undefined,
  skill_level: undefined,
  country: undefined,
  accommodation_description: undefined,
  guest_welcome_description: undefined,
  food_description: undefined,
  price_includes: undefined,
  price_excludes: undefined,
  activity_days: undefined,
  itinerary: undefined,
  included_trips: undefined,
  paid_attractions: undefined,
  spa_description: undefined,
  cancellation_policy: undefined,
  important_info: undefined,
  image: undefined,
  is_public: false, // Ensure boolean default
  instructor_ids: undefined,
};

export function EventForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = "Submit",
  cancelHref,
}: EventFormProps) {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]); // Add state for instructors

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: baseDefaultValues,
  });

  // Effect to reset form when initialData is provided
  useEffect(() => {
    console.log("🚀 ~ useEffect ~ initialData:", initialData);
    if (initialData) {
      // Map initialData to form data, ensuring correct types and defaults
      const dataForReset: Partial<EventFormData> = {};
      for (const key in eventFormSchema.shape) {
        const fieldKey = key as keyof EventFormData;
        const initialValue = initialData[fieldKey as keyof EventInitialData];

        if (fieldKey === "start_date" || fieldKey === "end_date") {
          dataForReset[fieldKey] =
            typeof initialValue === "string"
              ? initialValue.split("T")[0]
              : baseDefaultValues[fieldKey];
        } else if (fieldKey === "image") {
          dataForReset[fieldKey] = undefined; // Don't reset file input
        } else if (fieldKey === "is_public") {
          console.log("🚀 ~ useEffect ~ initialValue:", initialValue);
          // Ensure is_public is always boolean
          dataForReset[fieldKey] =
            typeof initialValue === "boolean" ? initialValue : baseDefaultValues.is_public;
        } else if (initialValue !== undefined && initialValue !== null) {
          // @ts-ignore - Allow assignment if key exists, refine if possible
          dataForReset[fieldKey] = initialValue;
        }
      }
      // Use spread to ensure all fields from baseDefaults are present if not in initialData
      reset({ ...baseDefaultValues, ...dataForReset });
    } else {
      // If no initialData (create mode), ensure form uses base defaults
      reset(baseDefaultValues);
    }
  }, [initialData, reset]);

  // Effect to fetch instructors
  useEffect(() => {
    axiosInstance
      .get<Instructor[]>("/instructors")
      .then((response) => {
        setInstructors(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch instructors:", error);
        // Handle error appropriately, e.g., show a notification
      });
  }, []); // Empty dependency array ensures this runs once on mount

  // Correctly typed submit handler
  const handleFormSubmit: SubmitHandler<EventFormData> = (data) => {
    console.log("🚀 ~ data:", data);
    const formData = new FormData();

    // Helper function to append if value exists and is not empty
    const appendIfExists = (key: string, value: any) => {
      // Explicitly check for boolean false
      if (typeof value === "boolean") {
        formData.append(key, value.toString());
      } else if (value !== undefined && value !== null && value !== "") {
        // Ensure numbers are converted to strings if needed by backend
        formData.append(key, typeof value === "number" ? value.toString() : value);
      }
    };

    // Append all fields from validated data
    Object.keys(data).forEach((key) => {
      const fieldKey = key as keyof EventFormData;
      if (fieldKey === "image") {
        // Handle image file
        if (data.image && data.image.length > 0 && data.image[0] instanceof File) {
          formData.append("image", data.image[0]);
        }
      } else if (fieldKey === "instructor_ids") {
        // Handle instructor IDs
        if (data.instructor_ids && data.instructor_ids.length > 0) {
          data.instructor_ids.forEach((id) => formData.append("instructor_ids", id));
        }
      } else {
        // Append other fields using the helper
        appendIfExists(fieldKey, data[fieldKey]);
      }
    });

    onSubmit(data, formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Section 1: Title, Description */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Tytuł</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Przyciągnij klientów tytułem, który podkreśla czas trwania, miejsce docelowe i atrakcje programu"
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Opis</Label>
          <Textarea
            id="description"
            {...register("description")}
            rows={4}
            placeholder="Przedstaw swoją ofertę w krótkim podsumowaniu, aby przyciągnąć uwagę klientów"
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Section 2: Price, Included/Excluded */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Cena i świadczenia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Cena</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              {...register("price")}
              placeholder="Podaj pełną cenę za udział w wydarzeniu za jedną osobę"
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
            />
            {errors.currency && <p className="text-sm text-red-500">{errors.currency.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_includes">Co jest wliczone w cenę</Label>
          <Textarea
            id="price_includes"
            {...register("price_includes")}
            rows={3}
            placeholder="Wymień wszystkie aktywności, udogodnienia i usługi, które są zawarte w cenie pakietu"
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
            placeholder="Wymień wszystkie elementy, ważne dla uczestników, które nie są zawarte w cenie pakietu"
          />
          {errors.price_excludes && (
            <p className="text-sm text-red-500">{errors.price_excludes.message}</p>
          )}
        </div>
      </div>

      {/* Section 3: Details - Attractions, Conditions (Language, Skill Level) */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Szczegóły wydarzenia</h2>

        <div className="space-y-2">
          <Label htmlFor="main_attractions">Najważniejsze atrakcje</Label>
          <Textarea
            id="main_attractions"
            {...register("main_attractions")}
            rows={3}
            placeholder="Wymień tu, co jest wyjątkowe w tej podróży, w 6-8 punktach"
          />
          {errors.main_attractions && (
            <p className="text-sm text-red-500">{errors.main_attractions.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language">Język na zajęciach</Label>
            <Input id="language" {...register("language")} placeholder="np. Polski, Angielski" />
            {errors.language && <p className="text-sm text-red-500">{errors.language.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill_level">Poziom</Label>
            <Input id="skill_level" {...register("skill_level")} placeholder="np. Początkujący" />
            {errors.skill_level && (
              <p className="text-sm text-red-500">{errors.skill_level.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Instructors */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Instruktorzy</h2>
        <Controller
          name="instructor_ids"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Wybierz instruktorów</Label>
                <Link
                  href="/dashboard/instructors"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Zarządzaj instruktorami
                </Link>
              </div>
              {instructors.length > 0 ? (
                <ScrollArea className="h-40 w-full rounded-sm border p-4">
                  <div className="space-y-2">
                    {instructors.map((instructor) => {
                      const isChecked = field.value?.includes(instructor.id) ?? false;
                      return (
                        <div key={instructor.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`instructor-${instructor.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentIds = field.value ?? [];
                              const newIds =
                                checked === true
                                  ? [...currentIds, instructor.id]
                                  : currentIds.filter((id) => id !== instructor.id);
                              field.onChange(newIds); // Update form state
                            }}
                          />
                          <Label
                            htmlFor={`instructor-${instructor.id}`}
                            className="font-normal cursor-pointer"
                          >
                            {instructor.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-gray-500">
                  {instructors.length === 0
                    ? "Ładowanie instruktorów..."
                    : "Brak dostępnych instruktorów. Dodaj ich najpierw."}
                </p>
              )}
            </div>
          )}
        />
        {errors.instructor_ids && (
          <p className="text-sm text-red-500">{errors.instructor_ids.message}</p>
        )}
      </div>

      {/* Section 5: Location, Country, Dates, Duration */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Lokalizacja i czas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Kraj</Label>
            <Input
              id="country"
              {...register("country")}
              placeholder="Wybierz kraj, w którym odbędzie się podróż"
            />
            {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Lokalizacja</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="Podaj adres lub nazwę miejsca"
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Data rozpoczęcia</Label>
            <Input id="start_date" type="date" {...register("start_date")} />
            {errors.start_date && (
              <p className="text-sm text-red-500">{errors.start_date.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Data zakończenia</Label>
            <Input id="end_date" type="date" {...register("end_date")} />
            {errors.end_date && <p className="text-sm text-red-500">{errors.end_date.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity_days">Czas trwania (dni)</Label>
          <Input
            id="activity_days"
            type="number"
            min="1"
            step="1"
            {...register("activity_days")}
            placeholder="Ile dni będzie trwał program/wydarzenie?"
          />
          {errors.activity_days && (
            <p className="text-sm text-red-500">{errors.activity_days.message}</p>
          )}
        </div>
      </div>

      {/* Section 6: Accommodation, Guests, Food */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Zakwaterowanie, goście i wyżywienie</h2>
        <div className="space-y-2">
          <Label htmlFor="accommodation_description">Nocleg</Label>
          <Textarea
            id="accommodation_description"
            {...register("accommodation_description")}
            rows={3}
            placeholder="Opisz miejsce lub miejsca, w których będą nocować uczestnicy"
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
            placeholder="Opisz, kto będzie gościł uczestników oraz o czym powinni przewodnik po zameldowaniu i wymeldowaniu"
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
            placeholder="Wymień wszystkie rodzaje posiłków, które są serwowane, oraz wszelkie wymagania dietetyczne, które są uwzględniane"
          />
          {errors.food_description && (
            <p className="text-sm text-red-500">{errors.food_description.message}</p>
          )}
        </div>
      </div>

      {/* Section 7: Itinerary, Trips, Extra Attractions, Spa */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Program i atrakcje</h2>
        <div className="space-y-2">
          <Label htmlFor="itinerary">Plan podróży (Harmonogram)</Label>
          <Textarea
            id="itinerary"
            {...register("itinerary")}
            rows={5}
            placeholder="Opisz pełny program dla uczestników i podziel się z nimi, jak będą wyglądały ich dni"
          />
          {errors.itinerary && <p className="text-sm text-red-500">{errors.itinerary.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="included_trips">Wliczone wycieczki</Label>
          <Textarea
            id="included_trips"
            {...register("included_trips")}
            rows={3}
            placeholder="Podaj więcej szczegółów na temat wycieczek, które są zawarte w pakiecie"
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
            placeholder="Podaj opis dodatkowych atrakcji i aktywności, np. wycieczki, które uczestnicy mogą zrobić w okolicy za dodatkową opłatą"
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
            placeholder="Podaj dostępne zabiegi i zaznacz, czy są wliczone w cenę"
          />
          {errors.spa_description && (
            <p className="text-sm text-red-500">{errors.spa_description.message}</p>
          )}
        </div>
      </div>

      {/* Section 8: Policies and Important Info */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Zasady i ważne informacje</h2>
        <div className="space-y-2">
          <Label htmlFor="cancellation_policy">Zasady anulowania rezerwacji</Label>
          <Textarea
            id="cancellation_policy"
            {...register("cancellation_policy")}
            rows={3}
            placeholder="Tutaj należy opisać, na jakich warunkach uczestnik może odwołać swój udział w wydarzeniu"
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
            placeholder="Podziel się dodatkowymi informacjami, które mogą być istotne dla uczestników. Ta sekcja nie będzie publikowana w ofercie, a jedynie widoczna w powiadomieniach e-mail dla klientów"
          />
          {errors.important_info && (
            <p className="text-sm text-red-500">{errors.important_info.message}</p>
          )}
        </div>
      </div>

      {/* Section 9: Images */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Zdjęcia wydarzenia</h2>
        {initialData?.image_id && (
          <div className="mb-4">
            <Label>Aktualne zdjęcie</Label>
            <img
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/${initialData.image_id}`}
              alt="Current event image"
              className="mt-2 max-w-xs rounded border"
              onError={(e) => {
                e.currentTarget.style.display = "none"; /* Hide if error */
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Przesłanie nowego zdjęcia zastąpi aktualne.
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="image">
            {initialData?.image_id ? "Zmień zdjęcie wydarzenia" : "Główne zdjęcie wydarzenia"}
          </Label>
          <Input id="image" type="file" {...register("image")} accept="image/*" />
          {errors.image && <p className="text-sm text-red-500">{(errors.image as any)?.message}</p>}
        </div>
      </div>

      {/* Section 10: Visibility */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Widoczność</h2>
        <div className="flex items-center space-x-2">
          <Controller
            name="is_public"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="is_public"
                checked={field.value}
                onCheckedChange={field.onChange}
                ref={field.ref}
              />
            )}
          />
          <Label htmlFor="is_public" className="cursor-pointer">
            Upublicznij to wydarzenie
          </Label>
        </div>
        <p className="text-sm text-gray-500">
          Publiczne wydarzenia pojawią się w wynikach wyszukiwania i listach wydarzeń
        </p>
        {errors.is_public && <p className="text-sm text-red-500">{errors.is_public.message}</p>}
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting} variant="default" className="flex-1">
          {isSubmitting ? "Przetwarzanie..." : submitButtonText}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
          className="flex-1"
          disabled={isSubmitting}
        >
          Anuluj
        </Button>
      </div>
    </form>
  );
}
