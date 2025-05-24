"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

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
  onLocationDeleted?: (locationId: string) => void;
}

export function LocationModal({
  isOpen,
  onClose,
  onLocationSaved,
  initialData,
  mode,
  onLocationDeleted,
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
      addressQuery: "",
      google_place_id: null,
    },
  });

  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const suggestionsContainerRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    if (addressQueryValue !== undefined && addressQueryValue !== null && isSearching) {
      debouncedFetchSuggestions(addressQueryValue);
    }
  }, [addressQueryValue, debouncedFetchSuggestions, isSearching]);

  useEffect(() => {
    // Reset highlighted index when suggestions change
    setHighlightedIndex(-1);
    // Initialize suggestion refs array when suggestions change
    suggestionRefs.current = suggestions.map(() => null);
  }, [suggestions]);

  // Effect to scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightedIndex > -1 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    setIsSearching(false);
    setValue("addressQuery", suggestion.description);
    setValue("google_place_id", suggestion.place_id);
    setSuggestions([]); // Clear suggestions after selection
    setHighlightedIndex(-1); // Reset highlight
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === "edit") {
        reset({
          addressQuery: initialData.address_line1 || "",
          google_place_id: initialData.google_place_id || null,
        });
      } else if (mode === "create") {
        reset({ addressQuery: "", google_place_id: null });
      }
    }
  }, [isOpen, initialData, mode, reset]);

  const onSubmit = async (formData: LocationFormData) => {
    try {
      let savedLocation: Location;
      // Prepare payload for the backend
      const payload: { google_place_id?: string | null } = {
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

  const handleConfirmDelete = async () => {
    if (!initialData?.id || !onLocationDeleted) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/locations/${initialData.id}`);
      toast({ description: "Lokalizacja usunięta pomyślnie." });
      onLocationDeleted(initialData.id);
      setIsDeleteConfirmOpen(false); // Close confirmation dialog
      onClose(); // Close the main modal
    } catch (error: any) {
      console.error("Failed to delete location:", error);
      toast({
        title: "Błąd usuwania lokalizacji",
        description:
          error.response?.data?.detail || "Nie udało się usunąć lokalizacji. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
          <div className="space-y-2 relative">
            <Label htmlFor="addressQuery">Adres</Label>
            <Input
              id="addressQuery"
              {...register("addressQuery")}
              placeholder="Wpisz adres, aby wyszukać..."
              autoComplete="off"
              onChange={(e) => {
                setIsSearching(true);
                // Also manually update form state if not using useWatch everywhere for this
                setValue("addressQuery", e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                // If user clears input, also clear google_place_id
                if (!e.target.value) {
                  setValue("google_place_id", null);
                  setSuggestions([]); // Clear suggestions
                }
              }}
              onKeyDown={(e) => {
                if (suggestions.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIndex((prevIndex) =>
                      prevIndex === suggestions.length - 1 ? 0 : prevIndex + 1,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIndex((prevIndex) =>
                      prevIndex <= 0 ? suggestions.length - 1 : prevIndex - 1,
                    );
                  } else if (e.key === "Enter" && highlightedIndex > -1) {
                    e.preventDefault();
                    handleSuggestionClick(suggestions[highlightedIndex]);
                  }
                }
              }}
            />
            <p className="text-sm text-muted-foreground h-[20px]">
              {isFetchingSuggestions && "Szukanie..."}
            </p>
            {suggestions.length > 0 && (
              <div
                ref={suggestionsContainerRef}
                className="absolute z-10 w-full bg-background border border-border shadow-lg rounded-md mt-1 min-h-[62px] max-h-[200px] overflow-y-auto top-[68px]"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.place_id}
                    ref={(el) => {
                      if (suggestionRefs.current) {
                        suggestionRefs.current[index] = el;
                      }
                    }}
                    className={`p-2 hover:bg-accent cursor-pointer ${
                      index === highlightedIndex ? "bg-accent" : ""
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)} // Optional: highlight on mouse enter
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
            {mode === "edit" && initialData?.id && onLocationDeleted && (
              <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-100 hover:text-red-700 mr-2"
                  >
                    Usuń
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Na pewno usunąć lokalizację?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie lokalizacji{" "}
                      <strong>{initialData.title}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isDeleting}
                      onClick={handleConfirmDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "Usuwanie..." : "Tak, usuń"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
