"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

// Define Location type (matching EventForm.tsx and backend)
export interface Location {
  id: string;
  title: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null; // Will be populated by backend via google_place_id
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
}

// Define the structure of an autocomplete suggestion from Google
interface AutocompleteSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Schema for location form validation
const locationFormSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany."),
  addressQuery: z.string().optional().nullable(), // For the autocomplete input
  google_place_id: z.string().optional().nullable(), // To store selected place ID
});

type LocationFormData = z.infer<typeof locationFormSchema>;

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved: (location: Location) => void;
  initialData?: Location | null;
  mode: "create" | "edit";
}

export function LocationModal({
  isOpen,
  onClose,
  onLocationSaved,
  initialData,
  mode,
}: LocationModalProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      title: "",
      addressQuery: "",
      google_place_id: null,
    },
  });

  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const addressQueryValue = useWatch({ control, name: "addressQuery" });

  // Debounce function
  const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
      new Promise((resolve) => {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => resolve(func(...args)), waitFor);
      });
  };

  const fetchSuggestions = useCallback(async (inputValue: string) => {
    if (!inputValue || inputValue.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsFetchingSuggestions(true);
    try {
      const response = await axiosInstance.get<AutocompleteSuggestion[]>(
        "/locations/autocomplete",
        {
          params: { input_text: inputValue },
        },
      );
      setSuggestions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch address suggestions:", error);
      setSuggestions([]); // Clear suggestions on error
      // Optionally, show a small toast or error message here
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []); // Empty dependency array as axiosInstance should be stable

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [
    fetchSuggestions,
  ]);

  useEffect(() => {
    if (addressQueryValue !== undefined && addressQueryValue !== null) {
      debouncedFetchSuggestions(addressQueryValue);
    }
  }, [addressQueryValue, debouncedFetchSuggestions]);

  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    setValue("addressQuery", suggestion.description);
    setValue("google_place_id", suggestion.place_id);
    setSuggestions([]); // Clear suggestions after selection
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === "edit") {
        reset({
          title: initialData.title,
          addressQuery: initialData.address_line1 || "",
          google_place_id: initialData.google_place_id || null,
        });
      } else if (mode === "create") {
        reset({ title: "", addressQuery: "", google_place_id: null });
      }
    }
  }, [isOpen, initialData, mode, reset]);

  const onSubmit = async (formData: LocationFormData) => {
    try {
      let savedLocation: Location;
      // Prepare payload for the backend
      const payload: { title: string; google_place_id?: string | null } = {
        title: formData.title,
        google_place_id: formData.google_place_id,
      };

      if (mode === "create") {
        const response = await axiosInstance.post<Location>("/locations", payload);
        savedLocation = response.data;
        toast({ description: "Lokalizacja utworzona pomyślnie." });
      } else if (mode === "edit" && initialData?.id) {
        const response = await axiosInstance.put<Location>(`/locations/${initialData.id}`, payload);
        savedLocation = response.data;
        toast({ description: "Lokalizacja zaktualizowana pomyślnie." });
      } else {
        throw new Error("Invalid mode or missing ID for edit.");
      }
      onLocationSaved(savedLocation);
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error("Failed to save location:", error);
      toast({
        title: "Błąd zapisu lokalizacji",
        description:
          error.response?.data?.detail || "Nie udało się zapisać lokalizacji. Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Dodaj nową lokalizację" : "Edytuj lokalizację"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Wprowadź szczegóły nowej lokalizacji."
              : "Zaktualizuj szczegóły istniejącej lokalizacji."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tytuł</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="addressQuery">Adres</Label>
            <Input
              id="addressQuery"
              {...register("addressQuery")}
              placeholder="Wpisz adres, aby wyszukać..."
              onChange={(e) => {
                // Also manually update form state if not using useWatch everywhere for this
                setValue("addressQuery", e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                // If user clears input, also clear google_place_id
                if (!e.target.value) {
                  setValue("google_place_id", null);
                }
              }}
            />
            <p className="text-sm text-muted-foreground h-[20px]">
              {isFetchingSuggestions && "Szukanie..."}
            </p>
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-background border border-border shadow-lg rounded-md mt-1 min-h-[62px] max-h-[200px] overflow-y-auto top-[68px]">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="p-2 hover:bg-accent cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <p className="font-medium">{suggestion.structured_formatting.main_text}</p>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {errors.addressQuery && (
              <p className="text-sm text-destructive">{errors.addressQuery.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Tworzenie..."
                  : "Zapisywanie..."
                : mode === "create"
                  ? "Utwórz lokalizację"
                  : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
