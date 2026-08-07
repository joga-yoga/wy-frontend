"use client";

import { X } from "lucide-react";

import { SessionContextCard } from "@/components/b2b/SessionContextCard";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
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
import { addCalendarMonthClamped } from "@/lib/formatDateRange";
import { cn } from "@/lib/utils";

import {
  InstructorPicker,
  type PickableInstructor,
} from "../../schedule/components/InstructorPicker";
import type { RoomOption } from "../types";

export type EndDateMode = "endless" | "1month" | "custom";

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
  /** Shown as the card's date eyebrow line — only the edit flow has a real date to show
   * here (a session being created has no date until the form below is filled in). */
  templateDate?: string | null;
  /** "HH:MM" for the card's time column — like `templateDate`, only the edit flow has a real
   * session time to show; the create flow doesn't know one until this form is filled in. */
  templateTime?: string | null;
  templateDurationMinutes?: number | null;
  templateColor?: string | null;
  templateInstructor?: { id?: string | null; name: string; imageId?: string | null } | null;
  onChangeTemplate?: () => void; // if undefined → hide the "Zmień" button

  // Rooms (shown when rooms.length > 0)
  rooms: RoomOption[];
  roomId: string;
  onRoomChange: (id: string) => void;

  // Instructors
  instructors: PickableInstructor[];
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
  /** Endless / 1 Month / Custom date. When omitted, "Do dnia" falls back to the
   * original single required-date picker (used by the edit flow, which isn't part
   * of this polish round). */
  endDateMode?: EndDateMode;
  onEndDateModeChange?: (mode: EndDateMode) => void;

  // Time
  startTime: string;
  onStartTimeChange: (t: string) => void;

  /** False for a single-session edit (S3): frequency, days and the date range are hidden
   * because they do not apply to one session — showing them invites the costly mistake of
   * rewriting a series while believing you changed one occurrence. */
  showRecurrence?: boolean;
}

export function ScheduleRecurrenceForm({
  templateTitle,
  templateSubtitle,
  templateDate,
  templateTime,
  templateDurationMinutes,
  templateColor,
  templateInstructor,
  onChangeTemplate,
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
  endDateMode,
  onEndDateModeChange,
  startTime,
  onStartTimeChange,
  showRecurrence = true,
}: ScheduleRecurrenceFormProps) {
  return (
    <>
      {/* Which session/series this form is acting on (S3/S4) */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <SessionContextCard
            title={templateTitle}
            date={templateDate}
            time={templateTime}
            durationMinutes={templateDurationMinutes}
            color={templateColor}
            subtitle={templateSubtitle}
            instructor={templateInstructor}
          />
        </div>
        {onChangeTemplate && (
          <button
            onClick={onChangeTemplate}
            className="shrink-0 pt-3 text-xs font-medium text-b2b-green-text"
          >
            Zmień
          </button>
        )}
      </div>

      {/* Recurrence. Hidden for a single-session edit — frequency/days/date-range do not
       * apply to one occurrence, and offering them invites the costly mistake of rewriting a
       * series while believing you changed one session. */}
      {showRecurrence && (
        <div>
          <Label>Częstotliwość</Label>
          <SegmentedToggle
            className="mt-1 mb-0"
            value={frequency}
            onChange={onFrequencyChange}
            options={[
              { label: "Raz", value: "once" },
              { label: "Co tydzień", value: "weekly" },
            ]}
          />
        </div>
      )}

      {showRecurrence && frequency === "weekly" && (
        <div>
          <Label>Dni</Label>
          {/* Green *fill* here, not just a border — S4 draws it that way, and the circles are
           * too small for a border alone to register. Grid, not flex, so the row fills the
           * full width edge-to-edge rather than clumping left with dead space on the right. */}
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => onToggleDay(d.key)}
                aria-pressed={selectedDays.includes(d.key)}
                className={cn(
                  "h-10 w-10 rounded-full text-xs font-medium transition-colors mx-auto",
                  selectedDays.includes(d.key)
                    ? "bg-b2b-green-text text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showRecurrence && (
        <div
          className={
            frequency === "once" || (frequency === "weekly" && onEndDateModeChange)
              ? "space-y-3"
              : "grid grid-cols-2 gap-3"
          }
        >
          <div>
            <Label>{frequency === "once" ? "Data" : "Od dnia"}</Label>
            {disableFromDate ? (
              <Button
                size="action"
                variant="outline"
                className="w-full justify-start font-normal"
                disabled
              >
                {fromDate ? fromDate.toLocaleDateString("pl-PL") : "Wybierz datę"}
              </Button>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="action"
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    {fromDate ? fromDate.toLocaleDateString("pl-PL") : "Wybierz datę"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fromDate} onSelect={onFromDateChange} />
                </PopoverContent>
              </Popover>
            )}
          </div>
          {frequency === "weekly" && onEndDateModeChange && (
            <div>
              <Label>Do dnia</Label>
              <SegmentedToggle
                className="mt-1"
                columns={3}
                value={endDateMode}
                onChange={onEndDateModeChange}
                options={[
                  { label: "Bezterminowo", value: "endless" },
                  { label: "1 miesiąc", value: "1month" },
                  { label: "Wybierz datę", value: "custom" },
                ]}
              />
              {endDateMode === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="action"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      {toDate ? toDate.toLocaleDateString("pl-PL") : "Wybierz datę"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate} onSelect={onToDateChange} />
                  </PopoverContent>
                </Popover>
              )}
              {endDateMode === "1month" && fromDate && (
                <p className="text-xs text-gray-500">
                  do {addCalendarMonthClamped(fromDate).toLocaleDateString("pl-PL")}
                </p>
              )}
            </div>
          )}
          {frequency === "weekly" && !onEndDateModeChange && (
            <div>
              <Label>Do dnia</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="action"
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
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
      )}

      {/* Godzina + Sala side by side (S4) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Godzina</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
          />
        </div>
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
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-input text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label>
          Prowadzący
          {defaultInstructorId && instructorId === defaultInstructorId && (
            <span className="ml-1 text-xs text-gray-400">· z szablonu</span>
          )}
        </Label>
        <div className="mt-1">
          <InstructorPicker
            instructors={instructors}
            selectedId={instructorId}
            currentId={null}
            onSelect={onInstructorChange}
            allowNone
            otherLabel=""
          />
        </div>
      </div>

      <div>
        <Label>
          Limit miejsc
          {defaultCapacity != null && capacity === String(defaultCapacity) && (
            <span className="ml-1 text-xs text-gray-400">· z szablonu</span>
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
    </>
  );
}
