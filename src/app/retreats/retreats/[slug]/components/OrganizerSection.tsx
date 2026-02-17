"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

import { getImageUrl } from "@/app/retreats/retreats/[slug]/helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";

import { EventDetail } from "../types";

interface OrganizerSectionProps {
  event: EventDetail;
  project: "retreats" | "workshops";
}

export const OrganizerSection: React.FC<OrganizerSectionProps> = ({ event, project }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState<"default" | "error" | "success">("default");
  const eventEntity = project === "workshops" ? "wydarzenia" : "wyjazdu";

  if (!event.organizer) {
    return null;
  }

  const resetModalState = () => {
    setModalState("default");
    setIsSubmitting(false);
    setEmail("");
    setPhone("");
    setMessage("");
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      resetModalState();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setModalState("default");

    try {
      const formattedMessage = [
        `Typ zgłoszenia: Kontakt do organizatora ${eventEntity}`,
        `ID ${eventEntity}: ${event.id}`,
        `Organizator: ${event.organizer?.name}`,
        "",
        "Wiadomość:",
        message.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      await axiosInstance.post("/utils/contact", {
        email: email.trim(),
        contact_info: phone.trim() || undefined,
        message: formattedMessage,
      });
      setModalState("success");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      setModalState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="md:px-5">
      <Link
        href={`/organizer/${event.organizer.id}`}
        className="flex items-center gap-5 hover:opacity-80 transition"
      >
        <div className="relative h-[80px] w-[80px] flex-shrink-0">
          <Image
            src={getImageUrl(event.organizer.image_id, 1)}
            alt={event.organizer.name}
            fill
            className="rounded-full object-cover border"
          />
        </div>
        <div>
          <p className="text-subheader">Organizator</p>
          <p className="text-sub-descript-18 text-gray-500">{event.organizer.name}</p>
        </div>
      </Link>

      <div className="mt-4 pt-4 md:pt-7">
        <Button
          type="button"
          variant="secondary"
          className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300"
          onClick={() => setIsModalOpen(true)}
        >
          Napisz do: {event.organizer.name}
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          {modalState === "default" && (
            <>
              <DialogHeader>
                <DialogTitle>Napisz do: {event.organizer.name}</DialogTitle>
                <DialogDescription>
                  Wyślij wiadomość, aby dowiedzieć się więcej na temat tego {eventEntity}.
                </DialogDescription>
              </DialogHeader>

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
                  placeholder="Twoja wiadomość*"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !email.trim() || !message.trim()}
                >
                  {isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}
                </Button>
              </form>
            </>
          )}

          {modalState === "error" && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Nie udało się wysłać wiadomości</DialogTitle>
                <DialogDescription>Spróbuj ponownie za chwilę.</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setModalState("default")}>
                  Spróbuj ponownie
                </Button>
                <Button type="button" onClick={() => setIsModalOpen(false)}>
                  Zamknij
                </Button>
              </div>
            </div>
          )}

          {modalState === "success" && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Wiadomość została wysłana</DialogTitle>
                <DialogDescription>
                  Dziękujemy! Organizator otrzyma Twoje zgłoszenie.
                </DialogDescription>
              </DialogHeader>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setIsModalOpen(false)}>
                  Zamknij
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
