"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const ContactPage = () => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Message submitted:", message);
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
            <Button type="submit" className="w-full">
              Wyślij wiadomość
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactPage;
