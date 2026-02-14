"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";

interface ContactPageContentProps {
  eventId?: string;
}

export const ContactPageContent: React.FC<ContactPageContentProps> = ({ eventId }) => {
  const isTakeoverFlow = Boolean(eventId);
  const pageTitle = isTakeoverFlow ? "Przejęcie i edycja wyjazdu" : "Kontakt";
  const pageDescription = isTakeoverFlow
    ? "Wyjazd został opublikowany na naszej platformie i chcesz przejąć nad nim kontrolę? Wypełnij formularz. Po weryfikacji skontaktujemy się z Tobą i pomożemy przypisać wyjazd do Twojego konta."
    : "Twoja wiadomość zostanie przesłana przez bezpieczne połączenie (SSL) i trafi bezpośrednio do zespołu wyjazdy.yoga. Zostaw w wiadomości preferowany sposób kontaktu - e-mail, telefon (WhatsApp) lub social media itd.";
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const formattedMessage = [
        isTakeoverFlow ? "Typ zgłoszenia: Przejęcie i edycja wyjazdu" : "Typ zgłoszenia: Kontakt",
        eventId ? `ID wyjazdu: ${eventId}` : null,
        `Email: ${email.trim()}`,
        phone.trim() ? `Telefon: ${phone.trim()}` : null,
        "",
        "Wiadomość:",
        message.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      await axiosInstance.post("/utils/contact", { message: formattedMessage });
      setEmail("");
      setPhone("");
      setMessage("");
      setSubmitResult("Dziękujemy! Wiadomość została wysłana.");
    } catch (err) {
      setSubmitResult("Nie udało się wysłać wiadomości. Spróbuj ponownie później.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-left text-gray-600 dark:text-gray-400 mb-6">{pageDescription}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Adres e-mail*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="tel"
              placeholder="Telefon (opcjonalnie)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Textarea
              placeholder="Opisz swoją sprawę*"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
            />
            {submitResult && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">{submitResult}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !email.trim() || !message.trim()}
            >
              Wyślij wiadomość
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
