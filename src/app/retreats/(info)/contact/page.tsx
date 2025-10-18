"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";

const ContactPage = () => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      await axiosInstance.post("/utils/contact", { message });
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
          <CardTitle className="text-3xl font-bold">Kontakt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-left text-gray-600 dark:text-gray-400 mb-6">
            Twoja wiadomość zostanie przesłana przez bezpieczne połączenie (SSL) i trafi
            bezpośrednio do zespołu wyjazdy.yoga. Zostaw w wiadomości preferowany sposób kontaktu –
            e-mail, telefon (WhatsApp) lub social media itd.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Twoje dane nie będą nigdzie gromadzone ani wykorzystywane bez zgody"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            {submitResult && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">{submitResult}</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting || !message.trim()}>
              Wyślij wiadomość
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactPage;
