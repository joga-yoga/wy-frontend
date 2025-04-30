"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { EventForm } from "@/components/features/events/EventForm";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { EventFormData, eventFormSchema, EventInitialData } from "@/lib/schemas/event";

export default function EditEventPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    reset,
    watch,
    getValues,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
  });

  const watchedDuration = watch("duration_days");

  const [fetchedInitialData, setFetchedInitialData] = useState<EventInitialData | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);

    axiosInstance
      .get<EventInitialData>(`/events/${eventId}`)
      .then((res) => {
        const fetchedData = res.data;
        setFetchedInitialData(fetchedData);

        const dataForReset: Partial<EventFormData> = {};
        Object.keys(eventFormSchema.shape).forEach((key) => {
          const fieldKey = key as keyof EventFormData;
          const initialValue = fetchedData[fieldKey as keyof EventInitialData];

          if (fieldKey === "start_date") {
            dataForReset[fieldKey] =
              typeof initialValue === "string" ? initialValue.split("T")[0] : undefined;
          } else if (fieldKey === "image") {
            dataForReset[fieldKey] = undefined;
          } else if (fieldKey === "program") {
            let programArray: string[] = [];
            if (Array.isArray(initialValue)) {
              programArray = initialValue.map((item) => String(item));
            } else if (typeof initialValue === "string") {
              try {
                const parsed = JSON.parse(initialValue);
                if (Array.isArray(parsed)) {
                  programArray = parsed.map((item) => String(item));
                }
              } catch (e) {
                console.error("Failed to parse program string:", e);
              }
            }
            dataForReset[fieldKey] = programArray;
          } else if (initialValue !== undefined && initialValue !== null) {
            dataForReset[fieldKey] = initialValue;
          }
        });
        reset(dataForReset);
        setCurrentImageId(fetchedData.image_id || null);
      })
      .catch((err) => {
        console.error("Failed to fetch event data:", err);
        setError("Nie udało się załadować danych wydarzenia. Spróbuj ponownie.");
        toast({
          description: "Nie udało się załadować danych wydarzenia.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [eventId, toast, reset]);

  const onSubmit: SubmitHandler<EventFormData> = async (data) => {
    if (!eventId) return;

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
        if (data.instructor_ids && data.instructor_ids.length > 0) {
          data.instructor_ids.forEach((id) => formData.append("instructor_ids", id));
        }
      } else if (fieldKey === "program") {
        if (data.program) {
          formData.append("program", JSON.stringify(data.program));
        } else {
          formData.append("program", JSON.stringify([]));
        }
      } else {
        appendIfExists(fieldKey, data[fieldKey]);
      }
    });

    try {
      await axiosInstance.put(`/events/${eventId}`, formData, {
        headers: {
          /* Content-Type set automatically */
        },
      });
      toast({ description: "Wydarzenie zaktualizowane pomyślnie!" });
      router.push("/dashboard/events");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to update event:", error.response?.data || error.message);
      toast({
        title: "Błąd aktualizacji",
        description: `Nie udało się zaktualizować wydarzenia: ${error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || error.message || "Spróbuj ponownie."}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
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

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-red-600 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DashboardHeader
        title="Edytuj wydarzenie"
        onUpdate={handleSubmit(onSubmit)}
        updateLabel={isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
      />
      <EventForm
        register={register}
        errors={errors}
        control={control}
        currentDurationDays={watchedDuration}
        getValues={getValues}
        eventId={eventId}
        initialData={fetchedInitialData}
      />
    </div>
  );
}
