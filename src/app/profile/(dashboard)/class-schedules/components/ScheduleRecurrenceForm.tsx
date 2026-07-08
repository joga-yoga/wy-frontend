"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { RoomOption, StudioOption } from "../types";

const DAYS = [
  { key: "MO", label: "Pn" },
  { key: "TU", label: "Wt" },
  { key: "WE", label: "Śr" },
  { key: "TH", label: "Cz" },
  { key: "FR", label: "Pt" },
  { key: "SA", label: "So" },
  { key: "SU", label: "Nd" },
] as const;

interface ScheduleRecurrenceFormProps {
  // Template info (pinned card)
  templateTitle: string;
  templateSubtitle: string;
  onChangeTemplate?: () => void; // if undefined → hide the "Zmień" button

  // Studio (shown only when studios.length > 1)
  studios: StudioOption[];
  studioId: string;
  onStudioChange: (id: string) => void;

  // Rooms (shown when rooms.length > 0)
  rooms: RoomOption[];
  roomId: string;
  onRoomChange: (id: string) => void;

  // Instructors
  instructors: { id: string; name: string }[];
  instructorId: string;
  onInstructorChange: (id: string) => void;
  defaultInstructorId?: string | null; // for "· z szablonu" label

  // Capacity
  capacity: string;
  onCapacityChange: (v: string) => void;
  defaultCapacity?: number | null; // for "· z szablonu" label

  // Frequency + days
  frequency: "once" | "weekly";
  onFrequencyChange: (f: "once" | "weekly") => void;
  selectedDays: string[];
  onToggleDay: (day: string) => void;

  // Dates
  fromDate: Date | undefined;
  onFromDateChange: (d: Date | undefined) => void;
  disableFromDate?: boolean; // true in edit mode → show greyed-out, non-interactive
  toDate: Date | undefined;
  onToDateChange: (d: Date | undefined) => void;

  // Time
  startTime: string;
  onStartTimeChange: (t: string) => void;
}

export function ScheduleRecurrenceForm({
  templateTitle,
  templateSubtitle,
  onChangeTemplate,
  studios,
  studioId,
  onStudioChange,
  rooms,
  roomId,
  onRoomChange,
  instructors,
  instructorId,
  onInstructorChange,
  defaultInstructorId,
  capacity,
  onCapacityChange,
  defaultCapacity,
  frequency,
  onFrequencyChange,
  selectedDays,
  onToggleDay,
  fromDate,
  onFromDateChange,
  disableFromDate,
  toDate,
  onToDateChange,
  startTime,
  onStartTimeChange,
}: ScheduleRecurrenceFormProps) {
  return (
    <>
      {/* Pinned template */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{templateTitle}</p>
          <p className="text-xs text-gray-500">{templateSubtitle}</p>
        </div>
        {onChangeTemplate && (
          <button onClick={onChangeTemplate} className="text-xs text-blue-600 font-medium">
            Zmień
          </button>
        )}
      </div>

      {/* Studio */}
      {studios.length > 1 && (
        <div>
          <Label>Studio</Label>
          <Select value={studioId} onValueChange={onStudioChange}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz studio" />
            </SelectTrigger>
            <SelectContent>
              {studios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Instructor */}
      <div>
        <Label>
          Prowadzący
          {defaultInstructorId && instructorId === defaultInstructorId && (
            <span className="text-xs text-gray-400 ml-1">· z szablonu</span>
          )}
        </Label>
        <div className="flex gap-1.5">
          <Select value={instructorId || undefined} onValueChange={onInstructorChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Wybierz prowadzącego" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {instructorId && (
            <button
              type="button"
              onClick={() => onInstructorChange("")}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Room */}
      {rooms.length > 0 && (
        <div>
          <Label>Sala</Label>
          <div className="flex gap-1.5">
            <Select value={roomId || undefined} onValueChange={onRoomChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Wybierz salę" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roomId && (
              <button
                type="button"
                onClick={() => onRoomChange("")}
                className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Capacity */}
      <div>
        <Label>
          Limit
          {defaultCapacity != null && capacity === String(defaultCapacity) && (
            <span className="text-xs text-gray-400 ml-1">· z szablonu</span>
          )}
        </Label>
        <Input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => onCapacityChange(e.target.value)}
          placeholder="Bez limitu"
        />
      </div>

      {/* Frequency toggle */}
      <div>
        <Label>Częstotliwość</Label>
        <div className="flex gap-0 mt-1 rounded-lg border overflow-hidden">
          {(["once", "weekly"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFrequencyChange(f)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                frequency === f
                  ? "bg-white border border-gray-900 rounded-lg text-gray-900 -m-px z-10"
                  : "text-gray-500"
              }`}
            >
              {f === "once" ? "Raz" : "Co tydzień"}
            </button>
          ))}
        </div>
      </div>

      {/* Days (weekly only) */}
      {frequency === "weekly" && (
        <div>
          <Label>Dni</Label>
          <div className="flex gap-1.5 mt-1">
            {DAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => onToggleDay(d.key)}
                className={`w-10 h-10 rounded-full text-xs font-medium transition-colors ${
                  selectedDays.includes(d.key)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date pickers */}
      <div className={frequency === "once" ? "" : "grid grid-cols-2 gap-3"}>
        <div>
          <Label>{frequency === "once" ? "Data" : "Od dnia"}</Label>
          {disableFromDate ? (
            <Button variant="outline" className="w-full justify-start font-normal" disabled>
              {fromDate ? fromDate.toLocaleDateString("pl-PL") : "Wybierz datę"}
            </Button>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {fromDate ? fromDate.toLocaleDateString("pl-PL") : "Wybierz datę"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={fromDate} onSelect={onFromDateChange} />
              </PopoverContent>
            </Popover>
          )}
        </div>
        {frequency === "weekly" && (
          <div>
            <Label>Do dnia</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {toDate ? toDate.toLocaleDateString("pl-PL") : "Wybierz datę"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={toDate} onSelect={onToDateChange} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Time */}
      <div>
        <Label>Godzina</Label>
        <Input type="time" value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} />
      </div>
    </>
  );
}
