"use client";

import axios from "axios";
import { Loader2, PenLine, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { EventDashboardSidebar } from "../components/EventForm/components/EventDashboardSidebar";
import { EventForm } from "../components/EventForm/EventForm";

export default function CreateEventPage() {
  const [selectedOption, setSelectedOption] = useState<"manual" | "autofill" | null>(null);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const { toast } = useToast();

  const handleManualCreate = () => {
    setSelectedOption("manual");
  };

  const handleAutofill = async () => {
    setIsAutofilling(true);
    try {
      // Mock API call - replace with actual API endpoint when ready
      const response = await axios.get("/api/events/generate");
      setGeneratedData(response.data);
      setSelectedOption("autofill");
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wygenerować danych wyjazdu. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  if (selectedOption === null) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4 md:px-10">
        <h1 className="text-3xl font-bold mb-8">Utwórz nowy wyjazd</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                Ręczne tworzenie
              </CardTitle>
              <CardDescription>
                Utwórz wyjazd od podstaw, wypełniając wszystkie pola formularza ręcznie.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleManualCreate} className="w-full">
                Wybierz
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Automatyczne wypełnienie
              </CardTitle>
              <CardDescription>
                Pozwól nam wygenerować podstawowe dane wyjazdu, które później możesz dostosować.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAutofill} className="w-full" disabled={isAutofilling}>
                {isAutofilling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  "Wybierz"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <EventDashboardSidebar isLoading={isFormLoading} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1">
          <EventForm initialData={generatedData} onLoadingChange={setIsFormLoading} />
        </main>
      </div>
    </>
  );
}
