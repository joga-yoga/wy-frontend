"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EventForm, EventFormData, EventInitialData } from "@/components/features/events/EventForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Correct path assumed
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

export default function EditEventPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<EventInitialData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);

    axiosInstance
      .get(`/events/${eventId}`)
      .then((res) => {
        // TODO: Adjust data mapping if API response structure differs from EventInitialData
        setInitialData(res.data as EventInitialData);
      })
      .catch((err) => {
        console.error("Failed to fetch event data:", err);
        setError("Nie udało się załadować danych wydarzenia. Spróbuj ponownie.");
        toast({
          title: "Błąd",
          description: "Nie udało się załadować danych wydarzenia.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [eventId, toast]);

  // Define the onSubmit handler for updating an event
  async function handleUpdateSubmit(_data: EventFormData, formData: FormData) {
    if (!eventId) return;
    setIsSubmitting(true);
    try {
      // Send FormData for PUT request as backend now supports it
      await axiosInstance.put(`/events/${eventId}`, formData, {
        headers: {
          // Content-Type will be set automatically by axios for FormData
          // 'Content-Type': 'multipart/form-data'
        },
      });

      toast({ description: "Wydarzenie zaktualizowane pomyślnie!" });
      router.push("/dashboard/events");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to update event:", error.response?.data || error.message);
      toast({
        title: "Błąd aktualizacji",
        description: `Nie udało się zaktualizować wydarzenia: ${error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || error.message || "Spróbuj ponownie."}`, // Improved error message parsing
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        {/* Skeleton loaders for form sections */}
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/events")}>
          Powrót do wydarzeń
        </Button>
      </div>
    );
  }

  if (!initialData) {
    // Should not happen if loading is finished and no error, but added as a safeguard
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-gray-500 mb-4">Nie znaleziono danych wydarzenia.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/events")}>
          Powrót do wydarzeń
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edytuj wydarzenie</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/events")}>
          Powrót do wydarzeń
        </Button>
      </div>
      <EventForm
        initialData={initialData}
        onSubmit={handleUpdateSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Zapisz zmiany"
        cancelHref={`/dashboard/events/${eventId}/edit`} // Or just /dashboard/events
      />
    </div>
  );
}
