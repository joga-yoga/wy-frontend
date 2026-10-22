"use client";

import { X } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { RoomOption } from "../types";

export interface ScheduleRoomFieldProps {
  solo?: boolean;
  rooms: RoomOption[];
  roomId: string;
  onRoomChange: (id: string) => void;
  roomsLoading?: boolean;
  roomsError?: boolean;
  retryRooms?: () => void;
}
export function ScheduleRoomField({
  solo,
  rooms,
  roomId,
  onRoomChange,
  roomsLoading,
  roomsError,
  retryRooms,
}: ScheduleRoomFieldProps) {
  const id = useId();
  if (solo) return null;
  if (roomsLoading)
    return (
      <p role="status" className="text-sm text-gray-500">
        Ładowanie sal…
      </p>
    );
  if (roomsError)
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm text-destructive">
          Nie udało się załadować sal.
        </p>
        <Button type="button" variant="outline" onClick={retryRooms}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  if (!rooms.length) return null;
  const selected = rooms.some((room) => room.id === roomId) ? roomId : "";
  return (
    <div>
      <Label htmlFor={id}>
        Sala <span className="text-xs text-gray-500">· wymagana</span>
      </Label>
      <div className="flex gap-1.5">
        <Select value={selected} onValueChange={onRoomChange}>
          <SelectTrigger
            id={id}
            className="min-w-0 flex-1"
            aria-required="true"
            aria-invalid={!selected}
            aria-describedby={!selected ? `${id}-error` : undefined}
          >
            <SelectValue placeholder="Wybierz salę" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <button
            type="button"
            aria-label="Wyczyść salę"
            onClick={() => onRoomChange("")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-input text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {!selected && (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          Wybierz salę dla tych zajęć.
        </p>
      )}
    </div>
  );
}
