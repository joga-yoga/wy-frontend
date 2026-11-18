"use client";

import { SessionContextCard } from "@/components/b2b/SessionContextCard";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { TimePicker } from "@/components/common/TimePicker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { addCalendarMonthClamped } from "@/lib/formatDateRange";
import { cn } from "@/lib/utils";

import {
  InstructorPicker,
  type PickableInstructor,
} from "../../schedule/components/InstructorPicker";
import { ScheduleRoomField, type ScheduleRoomFieldProps } from "./ScheduleRoomField";

export type EndDateMode = "endless" | "1month" | "custom";

const QUICK_TIMES = [
  "09:00",
  "09:30",
  "17:00",
  "18:00",
  "18:15",
  "19:00",
  "19:15",
  "19:30",
  "20:00",
];

const DAYS = [
  { key: "MO", label: "Pn" },
  { key: "TU", label: "Wt" },
  { key: "WE", label: "Śr" },
  { key: "TH", label: "Cz" },
  { key: "FR", label: "Pt" },
  { key: "SA", label: "So" },
  { key: "SU", label: "Nd" },
] as const;

interface ScheduleRecurrenceFormProps extends ScheduleRoomFieldProps {
  solo?: boolean;
  quickTimeSelection?: boolean;
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
  onChangeTemplate?: () => void; // When omitted, the context card is static.

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
  solo = false,
  quickTimeSelection = false,
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
  roomsLoading,
  roomsError,
  retryRooms,
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
  const labelClassName = quickTimeSelection
    ? "mb-1.5 block text-sm font-light text-gray-400"
    : undefined;
  const roomField = (
    <ScheduleRoomField
      labelClassName={labelClassName}
      solo={solo}
      rooms={rooms}
      roomId={roomId}
      onRoomChange={onRoomChange}
      roomsLoading={roomsLoading}
      roomsError={roomsError}
      retryRooms={retryRooms}
    />
  );
  const content = (
    <>
      {/* Which session/series this form is acting on (S3/S4) */}
      {onChangeTemplate ? (
        <button
          type="button"
          onClick={onChangeTemplate}
          aria-label={`Zmień szablon: ${templateTitle}`}
          className="block w-full text-left rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <SessionContextCard
            title={templateTitle}
            date={templateDate}
            time={templateTime}
            durationMinutes={templateDurationMinutes}
            color={templateColor}
            subtitle={templateSubtitle}
            instructor={templateInstructor}
          />
        </button>
      ) : (
        <SessionContextCard
          title={templateTitle}
          date={templateDate}
          time={templateTime}
          durationMinutes={templateDurationMinutes}
          color={templateColor}
          subtitle={templateSubtitle}
          instructor={templateInstructor}
        />
      )}

      {quickTimeSelection && <Separator className="my-2" />}

      {/* Recurrence. Hidden for a single-session edit — frequency/days/date-range do not
       * apply to one occurrence, and offering them invites the costly mistake of rewriting a
       * series while believing you changed one session. */}
      {showRecurrence && (
        <div>
          <Label className={labelClassName}>Częstotliwość</Label>
          <SegmentedToggle
            className={cn("mt-1 mb-0", quickTimeSelection && "mt-0 gap-x-3 [&_button]:font-medium")}
            value={frequency}
            onChange={onFrequencyChange}
            options={
              quickTimeSelection
                ? [
                    { label: "CO TYDZIEŃ", value: "weekly" },
                    { label: "RAZ", value: "once" },
                  ]
                : [
                    { label: "Raz", value: "once" },
                    { label: "Co tydzień", value: "weekly" },
                  ]
            }
          />
        </div>
      )}

      {/* Od dnia → Dni → Do dnia. The weekday row sits *between* the two dates because
       * picking a start date is what suggests the weekday, so the two belong adjacent.
       * That also rules out the old side-by-side `grid-cols-2` for the date pair — they
       * are no longer neighbours — so everything below is a single stacked column. */}
      {showRecurrence && (
        <div className={quickTimeSelection ? "space-y-4" : "space-y-3"}>
          <div>
            <Label className={labelClassName}>{frequency === "once" ? "Data" : "Od dnia"}</Label>
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
          {frequency === "weekly" && (
            <div>
              {/* Green *fill* here, not just a border — S4 draws it that way, and the circles are
               * too small for a border alone to register. Grid, not flex, so the row fills the
               * full width edge-to-edge rather than clumping left with dead space on the right. */}
              <div className={cn("grid grid-cols-7 gap-1.5", !quickTimeSelection && "mt-1")}>
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
          {frequency === "weekly" && onEndDateModeChange && (
            <div>
              <Label className={labelClassName}>Do dnia</Label>
              <SegmentedToggle
                className={cn(
                  "mt-1",
                  quickTimeSelection &&
                    "mt-0 mb-0 flex flex-wrap gap-x-3 [&_button]:flex-1 [&_button]:whitespace-nowrap [&_button]:font-medium",
                )}
                columns={3}
                value={endDateMode}
                onChange={onEndDateModeChange}
                options={[
                  { label: "BEZTERMINOWO", value: "endless" },
                  { label: "1 MIES.", value: "1month" },
                  { label: "WYBIERZ DATĘ", value: "custom" },
                ]}
              />
              {endDateMode === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="action"
                      variant="outline"
                      className={cn(
                        "w-full justify-start font-normal",
                        quickTimeSelection && "mt-2",
                      )}
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
                <p className={cn("text-xs text-gray-500", quickTimeSelection && "mt-2")}>
                  do {addCalendarMonthClamped(fromDate).toLocaleDateString("pl-PL")}
                </p>
              )}
            </div>
          )}
          {frequency === "weekly" && !onEndDateModeChange && (
            <div>
              <Label className={labelClassName}>Do dnia</Label>
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

      {/* Creation offers quick times; edits keep their saved-time field layout. */}
      <div className={quickTimeSelection ? undefined : "grid grid-cols-2 gap-3"}>
        <div>
          <Label htmlFor="schedule-start-time" className={labelClassName}>
            Godzina
          </Label>
          <div className={cn(quickTimeSelection && "flex flex-wrap items-start gap-2")}>
            {quickTimeSelection &&
              QUICK_TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  aria-pressed={startTime === time}
                  onClick={() => onStartTimeChange(time)}
                  className={cn(
                    "h-10 shrink-0 rounded-full border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    startTime === time
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {time}
                </button>
              ))}
            <div
              className={cn(
                quickTimeSelection &&
                  "min-w-28 flex-1 [&_input]:h-10 [&_input]:rounded-full [&_input]:border-brand-green-700 [&_input[aria-invalid=true]]:border-destructive",
              )}
            >
              <TimePicker id="schedule-start-time" value={startTime} onChange={onStartTimeChange} />
            </div>
          </div>
        </div>
        {!quickTimeSelection && roomField}
      </div>

      {quickTimeSelection && <Separator className="my-2" />}

      {!solo && (
        <div>
          <Label className={labelClassName}>
            Prowadzący
            {defaultInstructorId && instructorId === defaultInstructorId && (
              <span className="ml-1 text-xs text-gray-400">· z szablonu</span>
            )}
          </Label>
          <div className={quickTimeSelection ? undefined : "mt-1"}>
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
      )}

      {quickTimeSelection && !solo && <Separator className="my-2" />}

      {quickTimeSelection && roomField}

      <div>
        <Label className={labelClassName}>
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

  // The create flow owns its field rhythm; callers of the edit form retain their layout.
  return quickTimeSelection ? <div className="flex flex-col gap-4">{content}</div> : content;
}
