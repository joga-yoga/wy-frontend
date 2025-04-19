"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EventForm, EventFormData } from "@/components/features/events/EventForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

export default function CreateEventPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateSubmit(_data: EventFormData, formData: FormData) {
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/events", formData, {
        headers: {
          // Content-Type is automatically set by browser for FormData
          // "Content-Type": "multipart/form-data",
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
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Utwórz nowe wydarzenie</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/events")}>
          Powrót do wydarzeń
        </Button>
      </div>
      <EventForm
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Utwórz wydarzenie"
        cancelHref="/dashboard/events"
      />
    </div>
  );
}
