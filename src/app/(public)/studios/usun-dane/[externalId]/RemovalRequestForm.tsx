"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import type { DirectoryStudioDetail } from "@/types/studio";

/**
 * A message form, the same shape as the account deletion request — with the studio's
 * identity attached rather than typed.
 *
 * Unauthenticated on purpose: the person asking is by definition somebody with no account
 * here, and requiring one in order to leave would be absurd.
 */
export function RemovalRequestForm({ listing }: { listing: DirectoryStudioDetail }) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await axiosInstance.post(`/directory/listings/${listing.external_id}/removal-request`, {
        message,
        email: email || null,
      });
      setSent(true);
    } catch {
      setError("Nie udało się wysłać prośby. Spróbuj ponownie.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-3 p-4 pb-10">
        <h1 className="text-h-middle text-gray-900">Prośba wysłana</h1>
        <p className="text-m-descript text-gray-700">
          Zespół joga.yoga odezwie się po sprawdzeniu zgłoszenia.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-2xl flex-col gap-5 p-4 pb-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-h-middle text-gray-900">Poproś o usunięcie danych</h1>
        <p className="text-m-descript text-gray-700">{listing.name}</p>
        {listing.address && (
          <p className="text-m-sunscript-font text-gray-500">{listing.address}</p>
        )}
      </header>

      <p className="text-m-descript text-gray-700">
        Wyślemy Twoją prośbę do zespołu joga.yoga. Napisz, czego dotyczy — usunięcia całego wpisu
        czy poprawienia danych.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-m-sunscript-font text-gray-500">Wiadomość</span>
        <Textarea
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Prowadzę to studio i proszę o usunięcie wpisu."
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-m-sunscript-font text-gray-500">E-mail do kontaktu</span>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="kontakt@studio.pl"
        />
      </label>

      {error && <p className="text-m-descript text-red-600">{error}</p>}

      <Button type="submit" disabled={pending || message.trim().length === 0}>
        {pending ? "Wysyłam…" : "Wyślij prośbę"}
      </Button>
    </form>
  );
}
