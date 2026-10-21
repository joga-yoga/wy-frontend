"use client";

import { isAxiosError } from "axios";
import React, { useRef, useState } from "react";

import { useContactProof } from "@/components/contact/useContactProof";
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

  const pageTitle = isTakeoverFlow ? `Przejęcie i edycja wyjazdu lub wydarzenia` : "Kontakt";
  const pageDescription = isTakeoverFlow
    ? `Wyjazd lub Wydarzenie zostało opublikowany na naszej platformie i chcesz przejąć nad nim kontrolę? Wypełnij formularz. Po weryfikacji skontaktujemy się z Tobą i pomożemy przypisać do Twojego konta.`
    : `Twoja wiadomość zostanie przesłana przez bezpieczne połączenie (SSL) i trafi bezpośrednio do zespołu joga.yoga. Zostaw w wiadomości preferowany sposób kontaktu - e-mail, telefon (WhatsApp) lub social media itd.`;
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const { hostRef, prepare, resetProof, resetSubmission } = useContactProof();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !email.trim() || !message.trim()) return;
    const website = new FormData(e.currentTarget as HTMLFormElement).get("website") || "";
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const formattedMessage = [
        isTakeoverFlow
          ? `Typ zgłoszenia: Przejęcie i edycja wyjazdu lub wydarzenia`
          : "Typ zgłoszenia: Kontakt",
        eventId ? `ID: ${eventId}` : null,
        "",
        "Wiadomość:",
        message.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      const proof = website ? undefined : await prepare();
      await axiosInstance.post(
        "/utils/contact",
        {
          email: email.trim(),
          contact_info: phone.trim() || undefined,
          message: formattedMessage,
          website,
          altcha: proof?.altcha,
          submission_id: proof?.submission_id,
        },
        { timeout: 15_000 },
      );
      setEmail("");
      setPhone("");
      setMessage("");
      resetSubmission();
      setSubmitResult("Dziękujemy! Wiadomość została wysłana.");
    } catch (err) {
      // Refreshing a proof must keep the original message identity after a lost response.
      if (isAxiosError(err) && err.response?.status === 400) resetProof();
      if (isAxiosError(err) && err.response?.status === 409) resetSubmission();
      setSubmitResult("Nie udało się wysłać wiadomości. Spróbuj ponownie później.");
    } finally {
      submittingRef.current = false;
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
          <div ref={hostRef} hidden aria-hidden="true" inert />
          <form
            onSubmit={handleSubmit}
            onFocus={() => {
              void prepare().catch(() => undefined);
            }}
            className="space-y-4"
          >
            <div hidden aria-hidden="true" inert>
              <input type="text" name="website" autoComplete="off" tabIndex={-1} />
            </div>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              placeholder="Adres e-mail*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={submitting}
            />
            <Input
              type="tel"
              name="phone"
              autoComplete="tel"
              maxLength={300}
              placeholder="Telefon (opcjonalnie)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              readOnly={submitting}
            />
            <Textarea
              name="message"
              maxLength={9500}
              placeholder="Opisz swoją sprawę*"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              readOnly={submitting}
            />
            {submitResult && (
              <p role="status" className="text-sm text-center text-gray-600 dark:text-gray-400">
                {submitResult}
              </p>
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
