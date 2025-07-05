"use client";

import { Phone } from "lucide-react";
import Image from "next/image";
import React from "react";

import { getImageUrl } from "@/app/(events)/events/[eventId]/helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateRange } from "@/lib/formatDateRange";

import { EventDetail } from "../types";

interface ReservationModalProps {
  event: EventDetail;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  event,
  isOpen,
  onOpenChange,
}) => {
  if (!event.organizer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Potwierdź rezerwację</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-sm text-gray-500">
              {formatDateRange(event.start_date, event.end_date)}
            </p>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image
                src={getImageUrl(event.organizer.image_id, 1)}
                alt={event.organizer.name}
                fill
                className="rounded-full object-cover border"
              />
            </div>
            <div>
              <p className="font-semibold">{event.organizer.name}</p>
              <p className="text-sm text-gray-500">Organizator</p>
            </div>
          </div>
          <div className="h-px bg-gray-200" />
          <div>
            <p className="font-semibold">Cena</p>
            <p className="text-sm text-gray-500">
              {event.price
                ? `${event.price.toFixed(2)} ${event.currency || "PLN"} za jedną osobę`
                : "Cena nie podana"}
            </p>
          </div>

          {event.organizer.phone_number && (
            <>
              <div>
                <p className="font-semibold">Telefon</p>
                <p className="text-sm text-gray-500">{event.organizer.phone_number}</p>
              </div>
              <a href={`tel:${event.organizer.phone_number}`}>
                <Button className="w-full" size="cta" variant="cta">
                  <Phone className="mr-2 h-4 w-4" /> Zadzwoń, aby zarezerwować
                </Button>
              </a>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
