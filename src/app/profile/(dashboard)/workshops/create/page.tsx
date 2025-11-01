"use client";

import { ArrowLeft, Loader2, PencilIcon } from "lucide-react";
import { useState } from "react";
import { AiOutlineLink } from "react-icons/ai";
import { IoSparkles } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { getRandomDefaultImageId } from "@/lib/getRandomDefaultImageId";

import { EventForm } from "../../components/EventForm";
import { EventDashboardSidebar } from "../../components/EventForm/components/EventDashboardSidebar";
import { WorkshopMetaSection } from "../../components/EventForm/components/WorkshopMetaSection";

type View = "options" | "url-input" | "prompt-input" | "form";

export default function CreateWorkshopPage() {
  const [view, setView] = useState<View>("options");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();

  // Validate URL format
  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerateFromPrompt = async (promptText: string) => {
    if (!promptText.trim()) {
      toast({
        title: "Błąd",
        description: "Pole nie może być puste.",
        variant: "destructive",
      });
      return;
    }
    setIsAutofilling(true);
    try {
      const formData = new FormData();
      formData.append("prompt", promptText);
      const response = await axiosInstance.post("/events/generate/prompt", formData);
      const data = response.data;
      if (data.program) {
        data.program = data.program.map((day: any) => ({
          ...day,
          imageId: getRandomDefaultImageId(),
        }));
      }
      setGeneratedData(data);
      setView("form");
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

  const handleGenerateFromUrl = async (urlString: string) => {
    if (!urlString.trim()) {
      toast({
        title: "Błąd",
        description: "Pole nie może być puste.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(urlString)) {
      toast({
        title: "Błąd",
        description: "Wpisz prawidłowy adres URL (np. https://example.com)",
        variant: "destructive",
      });
      return;
    }

    setIsAutofilling(true);
    try {
      const formData = new FormData();
      formData.append("url", urlString);
      const response = await axiosInstance.post("/events/generate/url", formData);
      const data = response.data;
      if (data.program) {
        data.program = data.program.map((day: any) => ({
          ...day,
          imageId: getRandomDefaultImageId(),
        }));
      }
      setGeneratedData(data);
      setView("form");
    } catch (error) {
      toast({
        title: "Błąd",
        description:
          "Nie udało się wygenerować danych wyjazdu z tego linku. Spróbuj z innym linkiem.",
        variant: "destructive",
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  if (view === "form") {
    return (
      <div className="flex flex-col md:flex-row">
        <EventDashboardSidebar isLoading={isFormLoading} />
        <div className="flex-1">
          <EventForm
            initialData={generatedData}
            onLoadingChange={setIsFormLoading}
            mode="workshop"
          />
          {/* Additional workshop-specific fields section */}
          {/* This is a temporary inclusion point; ideally EventForm would accept slots/props to render extra sections. */}
        </div>
      </div>
    );
  }

  const handleBack = () => setView("options");

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4 md:px-10">
      {view === "options" && (
        <>
          <h1 className="text-3xl font-bold mb-8 text-center">Utwórz nowe wydarzenie</h1>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
            {/* <Card className="hover:shadow-lg transition-shadow flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-4 text-gray-600 font-semibold">
                  <IoSparkles className="h-5 w-5" />
                  PROMPT
                </CardTitle>
                <CardDescription>
                  Napisz parę słów o swoim wyjeździe – AI przygotuje całą resztę
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setView("prompt-input")} className="w-full">
                  Wybierz
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-4 text-gray-600 font-semibold">
                  <AiOutlineLink className="h-5 w-5" />
                  LINK
                </CardTitle>
                <CardDescription>
                  Wklej link do strony, a wszystkie dane zostaną pobrane automatycznie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setView("url-input")} className="w-full">
                  Wybierz
                </Button>
              </CardContent>
            </Card> */}

            <Card className="hover:shadow-lg transition-shadow flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-4 text-gray-600 font-semibold">
                  <PencilIcon className="h-5 w-5" />
                  RĘCZNIE
                </CardTitle>
                <CardDescription>
                  Utwórz wydarzenie od podstaw, wypełniając wszystkie pola formularza ręcznie.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    setGeneratedData(null);
                    setView("form");
                  }}
                  className="w-full"
                >
                  Wybierz
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {view === "url-input" && (
        <div>
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
          <h1 className="text-3xl font-bold mb-2">Generuj z linku</h1>
          <p className="text-muted-foreground mb-8">
            Wklej adres URL strony z Twoim wyjazdem, a my zajmiemy się resztą.
          </p>
          <div className="space-y-4">
            <Label htmlFor="event-url">URL wydarzenia</Label>
            <Input
              id="event-url"
              placeholder="https://przykladowa-strona.com/wyjazd"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAutofilling}
            />
            <Button
              onClick={() => handleGenerateFromUrl(url)}
              className="w-full"
              disabled={isAutofilling}
            >
              {isAutofilling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generowanie...
                </>
              ) : (
                "Generuj dane wyjazdu"
              )}
            </Button>
          </div>
        </div>
      )}

      {view === "prompt-input" && (
        <div>
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
          <h1 className="text-3xl font-bold mb-2">Generuj z opisu</h1>
          <p className="text-muted-foreground mb-8">
            Opisz swój wyjazd, a my pomożemy go uzupełnić.
          </p>
          <div className="space-y-4">
            <Label htmlFor="event-prompt">Opis wyjazdu</Label>
            <Textarea
              id="event-prompt"
              placeholder="Np. 'Wyjazd narciarski w Alpy dla zaawansowanych, 7 dni w hotelu z pełnym wyżywieniem...'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              disabled={isAutofilling}
            />
            <Button
              onClick={() => handleGenerateFromPrompt(prompt)}
              className="w-full"
              disabled={isAutofilling}
            >
              {isAutofilling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generowanie...
                </>
              ) : (
                "Generuj dane wyjazdu"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
