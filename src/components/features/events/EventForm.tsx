"use client";

import { PlusCircle, Trash2 } from "lucide-react"; // Import icons
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Control, // Import Control type
  Controller,
  FieldErrors, // Import FieldErrors type
  useFieldArray, // Import useFieldArray
  useForm, // Keep useForm import temporarily if needed for types, but remove its usage
  UseFormGetValues, // Import UseFormGetValues type
  UseFormRegister, // Import UseFormRegister type
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { axiosInstance } from "@/lib/axiosInstance";
import { EventFormData, eventFormSchema, EventInitialData } from "@/lib/schemas/event"; // Import from new location

// Define Instructor interface
interface Instructor {
  id: string;
  name: string;
}

// Updated Props for the controlled form component
interface EventFormProps {
  initialData?: EventInitialData;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
  control: Control<EventFormData>; // Add control prop back
  currentDurationDays?: number | string | null; // Prop for watched value (can be string initially)
  getValues: UseFormGetValues<EventFormData>; // Add getValues prop
  eventId?: string; // Add eventId prop for edit mode actions
}

// Remove schema definition and type exports from here

export function EventForm({
  initialData,
  register,
  errors,
  control, // Add control prop back
  currentDurationDays, // Receive duration value prop
  getValues, // Receive getValues prop
  eventId, // Receive eventId
}: EventFormProps) {
  const { toast } = useToast(); // Use toast hook
  const router = useRouter(); // Can keep if used for internal links like "Manage Instructors"
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [currentImageId, setCurrentImageId] = useState<string | null>(
    initialData?.image_id ?? null,
  );
  // State for visibility toggle
  const [currentIsPublic, setCurrentIsPublic] = useState<boolean>(initialData?.is_public ?? false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  // Setup useFieldArray for the program
  const {
    fields: programFields,
    append,
    remove,
    replace,
  } = useFieldArray({
    control,
    name: "program",
  });

  // Keep useEffect for fetching instructors as it's internal to the form display
  useEffect(() => {
    axiosInstance
      .get<Instructor[]>("/instructors")
      .then((response) => {
        setInstructors(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch instructors:", error);
      });
  }, []);

  // Update image and visibility state when initialData changes
  useEffect(() => {
    setCurrentImageId(initialData?.image_id ?? null);
    setCurrentIsPublic(initialData?.is_public ?? false);
  }, [initialData?.image_id, initialData?.is_public]);

  // Effect to sync program array length using replace
  useEffect(() => {
    console.log("Sync Effect Triggered. Duration:", currentDurationDays);
    const currentProgramValue = getValues("program") || []; // Get current array value
    const currentLength = currentProgramValue.length;
    let targetLength = parseInt(currentDurationDays as any, 10);

    if (isNaN(targetLength) || targetLength < 0) {
      targetLength = 0;
    }

    console.log(`Current Length: ${currentLength}, Target Length: ${targetLength}`);

    if (currentLength !== targetLength) {
      const newProgramArray = Array.from({ length: targetLength }, (_, index) => {
        // Keep existing value if available, otherwise use empty string
        return index < currentLength ? currentProgramValue[index] : "";
      });
      console.log("Replacing program with:", newProgramArray);
      replace(newProgramArray); // Replace the entire array
    }
  }, [currentDurationDays, getValues, replace]); // Update dependencies

  // Handler for toggling public status
  const handleToggleVisibility = async () => {
    if (!eventId) return;

    setIsTogglingVisibility(true);
    const newStatus = !currentIsPublic;

    try {
      await axiosInstance.patch(`/events/${eventId}`, { is_public: newStatus });
      setCurrentIsPublic(newStatus);
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

  return (
    // Remove onSubmit from form tag - parent handles submit trigger via header button
    <form className="space-y-8">
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
        <Controller // Restore Controller for instructors
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
                              field.onChange(newIds);
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
                  {/* Simplified loading/empty message */}
                  Brak dostępnych instruktorów.
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
            <Label htmlFor="duration_days">Czas trwania (dni)</Label>
            <Input
              id="duration_days"
              type="number"
              min="0"
              step="1"
              {...register("duration_days")}
              placeholder="Ile dni będzie trwał program/wydarzenie?"
            />
            {errors.duration_days && (
              <p className="text-sm text-red-500">{errors.duration_days.message}</p>
            )}
          </div>
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

      {/* NEW Section for Program (dynamically sized) */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Program wydarzenia (dzień po dniu)</h2>
        {programFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-2 border p-3 rounded-md bg-muted/30 relative group"
          >
            <Label htmlFor={`program.${index}`} className="pt-2 font-semibold whitespace-nowrap">
              Dzień {index + 1}:
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
        {(!currentDurationDays || parseInt(currentDurationDays as any, 10) <= 0) && (
          <p className="text-sm text-gray-500 italic">
            Wpisz liczbę dni trwania wydarzenia, aby dodać program dnia.
          </p>
        )}
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

      {/* Section 10: Visibility - Conditional based on eventId (edit mode) */}
      {eventId && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Widoczność</h2>
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
          {/* Removed Controller/Checkbox for is_public */}
        </div>
      )}
    </form>
  );
}
