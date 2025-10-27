"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";

export const DeleteAccountPageContent = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const emailValid = email.trim().length > 0 && email.includes("@");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !emailValid) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      await axiosInstance.post("/utils/account-deletion", { email, message });
      setMessage("");
      setEmail("");
      setSubmitResult("Dziękujemy! Twoja prośba o usunięcie konta została wysłana.");
    } catch (err) {
      setSubmitResult("Nie udało się wysłać prośby. Spróbuj ponownie później.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Usuń konto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-left text-gray-600 dark:text-gray-400 mb-6">
            Jeśli chcesz usunąć swoje konto i powiązane dane, wyślij nam wiadomość. Twoja prośba
            zostanie przesłana przez bezpieczne połączenie (SSL) i trafi bezpośrednio do zespołu
            wyjazdy.yoga. Zostaw preferowany sposób kontaktu – e-mail, telefon (WhatsApp) lub social
            media, abyśmy mogli potwierdzić prośbę.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Twój e-mail (wymagane)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {!emailValid && email.trim().length > 0 && (
              <p className="text-sm text-red-500">Podaj prawidłowy adres e-mail.</p>
            )}
            <Textarea
              placeholder="Opisz swoją prośbę o usunięcie konta. Podaj dane kontaktowe (opcjonalnie)."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            {submitResult && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">{submitResult}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={
                submitting || !message.trim() || !(email.trim().length > 0 && email.includes("@"))
              }
            >
              Wyślij prośbę o usunięcie konta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
