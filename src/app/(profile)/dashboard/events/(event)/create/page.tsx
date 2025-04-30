"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";

import { EventForm } from "@/components/features/events/EventForm";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { EventFormData, eventFormSchema } from "@/lib/schemas/event";

export default function CreateEventPage() {
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    getValues,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      start_date: "",
      price: undefined,
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
      duration_days: undefined,
      itinerary: "",
      included_trips: "",
      paid_attractions: "",
      spa_description: "",
      cancellation_policy: "",
      important_info: "",
      program: [],
      image: undefined,
      instructor_ids: [],
    },
  });

  const watchedDuration = watch("duration_days");

  const onSubmit: SubmitHandler<EventFormData> = async (data) => {
    console.log("Form Data Submitted:", data);
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
        if (data.program && data.program.length > 0) {
          formData.append("program", JSON.stringify(data.program));
        }
      } else {
        appendIfExists(fieldKey, data[fieldKey]);
      }
    });

    try {
      await axiosInstance.post("/events", formData, {
        headers: {
          /* Content-Type set automatically */
        },
      });
      toast({ description: "Wydarzenie utworzone pomyślnie!" });
      router.push("/dashboard/events");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to create event:", error.response?.data || error.message);
      toast({
        description: `Nie udało się utworzyć wydarzenia: ${error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || error.message || "Spróbuj ponownie."}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <DashboardHeader
        title="Utwórz nowe wydarzenie"
        onUpdate={handleSubmit(onSubmit)}
        updateLabel={isSubmitting ? "Tworzenie..." : "Utwórz wydarzenie"}
      />
      <EventForm
        register={register}
        errors={errors}
        control={control}
        currentDurationDays={watchedDuration}
        getValues={getValues}
      />
    </div>
  );
}
