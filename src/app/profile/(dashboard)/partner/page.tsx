"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { LocationModal } from "@/components/locations/LocationModal";
import { LocationSelector } from "@/components/locations/LocationSelector";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface GooglePlaceLocation {
  id: string;
  title: string;
  country?: string | null;
  address_line1?: string | null;
  google_place_id?: string | null;
}

interface PartnerData {
  name?: string;
  description?: string;
  image_id?: string | null;
  google_place_id?: string | null;
}

const schema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  image: z.any().optional(),
  selected_location_id: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export default function PartnerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [newlyUploadedImageId, setNewlyUploadedImageId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [locations, setLocations] = useState<GooglePlaceLocation[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<GooglePlaceLocation | null>(null);
  const [savedPartnerGooglePlaceId, setSavedPartnerGooglePlaceId] = useState<
    string | null | undefined
  >(undefined);
  const [hasInitializedLocationSelection, setHasInitializedLocationSelection] = useState(false);

  // Reviews management state
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [isLoadingReviewsCount, setIsLoadingReviewsCount] = useState(false);
  const [isCollectingReviews, setIsCollectingReviews] = useState(false);
  const [collectReviewsError, setCollectReviewsError] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const reviewCountRequestIdRef = useRef(0);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      image: undefined,
      selected_location_id: null,
    },
  });

  const {
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    control,
    formState: { isSubmitting },
  } = form;

  const imageFile = watch("image");
  const selectedLocationId = watch("selected_location_id");
  const selectedLocation = useMemo(() => {
    return locations.find((loc) => loc.id === selectedLocationId) ?? null;
  }, [locations, selectedLocationId]);
  const selectedGooglePlaceId = selectedLocation?.google_place_id ?? null;
  const hasUnsavedLocationChange =
    savedPartnerGooglePlaceId !== undefined &&
    (selectedGooglePlaceId ?? null) !== (savedPartnerGooglePlaceId ?? null);

  const setSelectedLocationId = useCallback(
    (
      nextLocationId: string | null,
      source: string,
      mode: "setValue" | "reset" = "setValue",
      options?: Parameters<typeof setValue>[2],
    ) => {
      if (mode === "reset") {
        reset({ ...getValues(), selected_location_id: nextLocationId });
      } else {
        setValue("selected_location_id", nextLocationId, options);
      }
    },
    [getValues, reset, setValue],
  );

  // Fetch reviews count
  const fetchReviewsCount = useCallback(async (placeId: string | null) => {
    const requestId = reviewCountRequestIdRef.current + 1;
    reviewCountRequestIdRef.current = requestId;

    if (!placeId) {
      setReviewsCount(0);
      setIsLoadingReviewsCount(false);
      return;
    }

    try {
      setIsLoadingReviewsCount(true);
      setCollectReviewsError(null);
      const response = await axiosInstance.get("/partner/reviews-count", {
        params: { place_id: placeId },
      });
      if (reviewCountRequestIdRef.current !== requestId) return;
      setReviewsCount(response.data.total_count);
    } catch (error: any) {
      if (reviewCountRequestIdRef.current !== requestId) return;
      console.error("Failed to fetch reviews count:", error);
      setReviewsCount(0);
    } finally {
      if (reviewCountRequestIdRef.current === requestId) {
        setIsLoadingReviewsCount(false);
      }
    }
  }, []);

  // Collect reviews from Google Maps
  const handleCollectReviews = async () => {
    if (!selectedLocation) {
      setCollectReviewsError("Wybierz lokalizację, aby pobrać recenzje.");
      return;
    }
    if (!selectedGooglePlaceId) {
      setCollectReviewsError("Wybrana lokalizacja nie ma Google Place ID.");
      return;
    }

    setIsCollectingReviews(true);
    setCollectReviewsError(null);

    try {
      const response = await axiosInstance.post("/partner/collect-reviews", {
        location_id: selectedLocation.id,
      });

      toast({
        description: `Pomyślnie pobrano recenzje! Zapisano ${response.data.saved_count} nowych recenzji (znaleziono ${response.data.total_found} razem).`,
      });

      await fetchReviewsCount(selectedGooglePlaceId);
    } catch (error: any) {
      console.error("Failed to collect reviews:", error);
      const errorMessage =
        error.response?.data?.detail?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Nie udało się pobrać recenzji.";
      setCollectReviewsError(errorMessage);
      toast({
        title: "Błąd podczas pobierania recenzji",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCollectingReviews(false);
    }
  };

  // Fetch locations
  useEffect(() => {
    axiosInstance
      .get<GooglePlaceLocation[]>("/locations")
      .then((response) => {
        setLocations(response.data);
        setLocationsLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to fetch locations:", error);
        setLocationsLoaded(true);
        toast({
          description: "Nie udało się załadować listy lokalizacji.",
          variant: "destructive",
        });
      });
  }, [toast]);

  // Fetch partner data
  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get<PartnerData>("/partner/me")
      .then((res) => {
        setValue("name", res.data.name || "");
        setValue("description", res.data.description || "");
        setCurrentImageId(res.data.image_id || null);
        setRemoveCurrentImage(false);

        setSavedPartnerGooglePlaceId(res.data.google_place_id || null);

        if (res.data.google_place_id) {
          fetchReviewsCount(res.data.google_place_id);
        } else {
          setReviewsCount(0);
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          toast({
            title: "Nie jesteś Organizatorem",
            description: "Najpierw utwórz profil organizatora.",
            variant: "destructive",
          });
          router.push("/profile/become-partner");
        } else {
          toast({
            description: "Nie udało się wczytać profilu organizatora.",
            variant: "destructive",
          });
          router.push("/profile");
        }
      })
      .finally(() => setLoading(false));
  }, [setValue, toast, router]);

  useEffect(() => {
    if (
      hasInitializedLocationSelection ||
      savedPartnerGooglePlaceId === undefined ||
      !locationsLoaded
    ) {
      return;
    }

    if (!savedPartnerGooglePlaceId) {
      setSelectedLocationId(null, "init:no saved partner google_place_id", "reset");
      setHasInitializedLocationSelection(true);
      return;
    }

    const matchingLocation = locations.find(
      (loc) =>
        loc.google_place_id === savedPartnerGooglePlaceId || loc.id === savedPartnerGooglePlaceId,
    );

    if (matchingLocation) {
      setSelectedLocationId(matchingLocation.id, "init:matched saved partner location", "reset");
    }
    setHasInitializedLocationSelection(true);
  }, [
    hasInitializedLocationSelection,
    getValues,
    locations,
    locationsLoaded,
    reset,
    savedPartnerGooglePlaceId,
    setSelectedLocationId,
  ]);

  useEffect(() => {
    fetchReviewsCount(selectedGooglePlaceId);
  }, [fetchReviewsCount, selectedGooglePlaceId]);

  useEffect(() => {
    const file = imageFile?.[0];
    if (file instanceof File) {
      const currentPreview = imagePreviewUrl;
      const newPreview = URL.createObjectURL(file);
      setImagePreviewUrl(newPreview);
      setNewlyUploadedImageId(null);
      setRemoveCurrentImage(false);
      handleImageUpload(file);
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
    } else if (!file && imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setNewlyUploadedImageId(null);
    }
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  async function handleImageUpload(file: File) {
    setIsUploadingImage(true);
    const imageFormData = new FormData();
    imageFormData.append("image", file);
    try {
      const response = await axiosInstance.post("/partner/image-upload", imageFormData);
      setNewlyUploadedImageId(response.data.image_id);
      toast({ description: "Nowe zdjęcie przesłano pomyślnie. Zapisz zmiany, aby zastosować." });
    } catch (err: any) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setNewlyUploadedImageId(null);
      setValue("image", null);
      toast({
        title: "Przesyłanie obrazu nie powiodło się",
        description: err.response?.data?.detail || "Nie można przesłać obrazu.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleRemoveImageClick() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setValue("image", null);
    setNewlyUploadedImageId(null);
    setRemoveCurrentImage(true);
    toast({ description: "Zdjęcie usunięte. Zapisz zmiany, aby potwierdzić." });
  }

  async function onSubmit(data: FormData) {
    const payload: {
      name?: string;
      description?: string;
      image_id?: string | null;
      google_place_id?: string | null;
    } = {};

    payload.name = data.name;
    payload.description = data.description;

    payload.google_place_id = selectedLocation?.google_place_id || null;

    if (newlyUploadedImageId) {
      payload.image_id = newlyUploadedImageId;
    } else if (removeCurrentImage) {
      payload.image_id = null;
    }

    try {
      const response = await axiosInstance.put("/partner", payload);
      toast({ description: "Profil zaktualizowany pomyślnie!" });
      setCurrentImageId(response.data.image_id || null);
      setSavedPartnerGooglePlaceId(response.data.google_place_id || null);
      await fetchReviewsCount(response.data.google_place_id || null);

      setNewlyUploadedImageId(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setValue("image", null);
      setRemoveCurrentImage(false);
    } catch (error: any) {
      toast({
        description: `Aktualizacja nie powiodła się: ${error?.response?.data?.detail || error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  }

  function handleLocationSaved(savedLocation: GooglePlaceLocation) {
    setLocations((prevLocations) => {
      const existingLocationIndex = prevLocations.findIndex((loc) => loc.id === savedLocation.id);

      if (existingLocationIndex === -1) {
        return [...prevLocations, savedLocation];
      }

      return prevLocations.map((loc) => (loc.id === savedLocation.id ? savedLocation : loc));
    });
    setSelectedLocationId(savedLocation.id, "location modal saved", "setValue", {
      shouldDirty: true,
      shouldValidate: true,
    });
    setHasInitializedLocationSelection(true);
    fetchReviewsCount(savedLocation.google_place_id || null);

    axiosInstance
      .get<GooglePlaceLocation[]>("/locations")
      .then((response) => {
        const reloadedLocations = response.data;
        const savedLocationExists = reloadedLocations.some((loc) => loc.id === savedLocation.id);

        setLocations(
          savedLocationExists
            ? reloadedLocations.map((loc) => (loc.id === savedLocation.id ? savedLocation : loc))
            : [...reloadedLocations, savedLocation],
        );
      })
      .catch((error) => {
        console.error("Failed to reload locations:", error);
      });

    setIsLocationModalOpen(false);
    setEditingLocation(null);
    toast({ description: "Lokalizacja zapisana pomyślnie." });
  }

  if (loading) return <p className="text-center mt-20">Ładowanie...</p>;

  return (
    <div className="">
      <DashboardHeader
        title="Profil Organizatora"
        onUpdate={handleSubmit(onSubmit)}
        updateLabel={isSubmitting || isUploadingImage ? "Zapisywanie..." : "Zapisz Zmiany"}
        isSubmitting={isSubmitting || isUploadingImage}
      />
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mx-auto max-w-xl mt-6 px-6">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa *</FormLabel>
                <FormControl>
                  <Input placeholder="Nazwa Organizatora" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opis</FormLabel>
                <FormControl>
                  <Textarea placeholder="Opowiedz nam o swojej organizacji" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="image"
            render={() => (
              <FormItem>
                <FormLabel>Zdjęcie Profilowe</FormLabel>
                <SingleImageUpload
                  name="image"
                  control={control}
                  existingImageId={currentImageId}
                  imagePreviewUrl={imagePreviewUrl}
                  isUploading={isUploadingImage}
                  onRemove={handleRemoveImageClick}
                  disabled={isSubmitting}
                  isRemoved={removeCurrentImage}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reviews Management Section */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Zarządzanie Lokalizacją i Recenzjami
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Wybierz lokalizację swojej organizacji i zarządzaj recenzjami z Google Maps.
                </p>
              </div>

              {/* Location Selector */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <LocationSelector
                  control={control}
                  errors={{}}
                  fieldName="selected_location_id"
                  label="Lokalizacja Google Place"
                  locations={locations}
                  onEditClick={(location) => {
                    setEditingLocation(location as any);
                    setIsLocationModalOpen(true);
                  }}
                  onAddClick={() => {
                    setEditingLocation(null);
                    setIsLocationModalOpen(true);
                  }}
                />
              </div>

              {hasUnsavedLocationChange && selectedLocation && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-sm">
                    Zapisz profil, aby używać tej lokalizacji na publicznej stronie organizatora.
                  </p>
                </div>
              )}

              {!selectedLocation && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    📍 Wybierz lokalizację powyżej, aby móc pobierać recenzje z Google Maps.
                  </p>
                </div>
              )}

              {selectedLocation && !selectedGooglePlaceId && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Wybrana lokalizacja nie ma Google Place ID. Edytuj lokalizację i wybierz wynik z
                    Google Maps.
                  </p>
                </div>
              )}

              {selectedLocation && selectedGooglePlaceId && (
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pobrane recenzje</p>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedLocation.title || selectedLocation.address_line1}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {isLoadingReviewsCount ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            <span className="text-gray-400 text-sm">Ładowanie...</span>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-gray-800">{reviewsCount}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {collectReviewsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {collectReviewsError}
                </div>
              )}

              {selectedLocation && selectedGooglePlaceId && (
                <>
                  <Button
                    type="button"
                    onClick={handleCollectReviews}
                    disabled={isCollectingReviews || isSubmitting || !selectedGooglePlaceId}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isCollectingReviews ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Pobieranie recenzji...
                      </>
                    ) : (
                      "Pobierz recenzje z Google Maps"
                    )}
                  </Button>

                  <p className="text-xs text-gray-500">
                    Kliknij przycisk, aby pobrać nowe recenzje ze swojej lokalizacji na Google Maps.
                    Ten proces może chwilę potrwać.
                  </p>
                </>
              )}
            </div>
          </div>
        </form>
      </Form>

      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => {
            setIsLocationModalOpen(false);
            setEditingLocation(null);
          }}
          onLocationSaved={handleLocationSaved}
          initialData={editingLocation}
          mode={editingLocation ? "edit" : "create"}
        />
      )}
    </div>
  );
}
