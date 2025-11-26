import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Control,
  Controller,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormRegister,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getRandomDefaultImageId } from "@/lib/getRandomDefaultImageId";
import { EventFormData } from "@/lib/schemas/event";
import { cn } from "@/lib/utils";

import { useEventHelpBar } from "../contexts/EventHelpBarContext";
import { EventHelpBarTipButton } from "./EventHelpBar";

interface EventProgramSectionProps {
  project: "retreats" | "workshops";
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
  programFields: { id: string; description?: string; imageId?: string | null }[];
  append: (value: { description: string; imageId: string | null }) => void;
  remove: UseFieldArrayRemove;
  calculatedDuration: number;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  setValue: UseFormSetValue<EventFormData>;
  uploadingProgramImages: Record<number, boolean>;
  onRemoveProgramImage: (index: number) => void;
  onProgramImageChange: (file: File, index: number) => void;
}

export const EventProgramSection = ({
  project,
  control,
  register,
  errors,
  programFields,
  append,
  remove,
  calculatedDuration,
  dateRange,
  setDateRange,
  setValue,
  uploadingProgramImages,
  onRemoveProgramImage,
  onProgramImageChange,
}: EventProgramSectionProps) => {
  const { focusTip } = useEventHelpBar();
  const watchedProgram = useWatch({ control, name: "program" });

  const handleAddDay = () => {
    const randomImageId = getRandomDefaultImageId();
    append({ description: "", imageId: randomImageId });
  };

  // Helper functions to parse/format datetime in UTC
  const parseDateTime = (isoString: string | null | undefined) => {
    if (!isoString) return { date: "", time: "" };
    try {
      // Parse ISO string and handle timezone offset
      const dateObj = new Date(isoString);
      // Format in UTC timezone by manually constructing the date/time strings
      const utcYear = dateObj.getUTCFullYear();
      const utcMonth = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const utcDate = String(dateObj.getUTCDate()).padStart(2, "0");
      const utcHours = String(dateObj.getUTCHours()).padStart(2, "0");
      const utcMinutes = String(dateObj.getUTCMinutes()).padStart(2, "0");

      const date = `${utcYear}-${utcMonth}-${utcDate}`;
      const time = `${utcHours}:${utcMinutes}`;
      return { date, time };
    } catch {
      return { date: "", time: "" };
    }
  };

  const buildDateTime = (date: string, time: string) => {
    if (!date) return "";
    // If no time provided, use 00:00
    const timeStr = time || "00:00";
    // Build ISO string with UTC timezone
    return `${date}T${timeStr}:00Z`;
  };

  return (
    <>
      <div className="space-y-2 event-form-section-padding" id="event-program-section">
        <div className="flex items-center gap-2">
          <Label htmlFor="start_date" size="event">
            Termin
          </Label>
          <EventHelpBarTipButton tipId="date" />
        </div>
        <Label htmlFor="start_date" size="event-description">
          {project === "workshops"
            ? "Podaj dokładne czasy rozpoczęcia i zakończenia, aby uczestnicy wiedzieli, kiedy się pojawić."
            : "Podaj datę początkową i końcową wydarzenia. Upewnij się, że są zgodne z harmonogramem."}
        </Label>
        <Separator className="my-4 md:my-8" />

        {project === "workshops" ? (
          // Workshop: Separate date + time pickers
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date & Time */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Data i godzina początkowa</Label>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field: startField }) => {
                    const { date: startDate, time: startTime } = parseDateTime(startField.value);
                    console.log("🚀 ~ EventProgramSection ~ startField.value:", startField.value);
                    return (
                      <Controller
                        name="end_date"
                        control={control}
                        render={({ field: endField }) => {
                          const { date: endDate } = parseDateTime(endField.value);
                          return (
                            <div className="space-y-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn("w-full justify-start text-left font-normal")}
                                    onClick={() => focusTip("date")}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate
                                      ? format(new Date(startDate), "PPP", { locale: pl })
                                      : "Wybierz datę"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    initialFocus
                                    mode="single"
                                    selected={startDate ? new Date(startDate) : undefined}
                                    onSelect={(selectedDate) => {
                                      if (selectedDate) {
                                        const newDate = format(selectedDate, "yyyy-MM-dd");
                                        // If start_date is being set for the first time, default to 12:00
                                        const timeToUse = startTime || "12:00";
                                        startField.onChange(buildDateTime(newDate, timeToUse));
                                        // Auto-fill end date if both are empty
                                        if (!startDate && !endDate) {
                                          endField.onChange(buildDateTime(newDate, "13:00"));
                                        }
                                      }
                                    }}
                                    showOutsideDays={false}
                                  />
                                </PopoverContent>
                              </Popover>
                              <div className="flex flex-col gap-1">
                                <Label htmlFor="start_time" className="text-sm">
                                  Godzina
                                </Label>
                                <Input
                                  id="start_time"
                                  type="time"
                                  disabled={!startDate}
                                  value={startTime}
                                  onChange={(e) => {
                                    startField.onChange(buildDateTime(startDate, e.target.value));
                                  }}
                                  className="bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>
                            </div>
                          );
                        }}
                      />
                    );
                  }}
                />
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date.message}</p>
                )}
              </div>

              {/* End Date & Time */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Data i godzina końcowa</Label>
                <Controller
                  name="end_date"
                  control={control}
                  render={({ field: endField }) => {
                    const { date: endDate, time: endTime } = parseDateTime(endField.value);
                    return (
                      <Controller
                        name="start_date"
                        control={control}
                        render={({ field: startField }) => {
                          const { date: startDate } = parseDateTime(startField.value);
                          return (
                            <div className="space-y-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn("w-full justify-start text-left font-normal")}
                                    onClick={() => focusTip("date")}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate
                                      ? format(new Date(endDate), "PPP", { locale: pl })
                                      : "Wybierz datę"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    initialFocus
                                    mode="single"
                                    selected={endDate ? new Date(endDate) : undefined}
                                    onSelect={(selectedDate) => {
                                      if (selectedDate) {
                                        const newDate = format(selectedDate, "yyyy-MM-dd");
                                        // If end_date is being set for the first time, default to 13:00
                                        const timeToUse = endTime || "13:00";
                                        endField.onChange(buildDateTime(newDate, timeToUse));
                                        // Auto-fill start date if both are empty
                                        if (!startDate && !endDate) {
                                          startField.onChange(buildDateTime(newDate, "12:00"));
                                        }
                                      }
                                    }}
                                    showOutsideDays={false}
                                  />
                                </PopoverContent>
                              </Popover>
                              <div className="flex flex-col gap-1">
                                <Label htmlFor="end_time" className="text-sm">
                                  Godzina
                                </Label>
                                <Input
                                  id="end_time"
                                  type="time"
                                  disabled={!endDate}
                                  value={endTime}
                                  onChange={(e) => {
                                    endField.onChange(buildDateTime(endDate, e.target.value));
                                  }}
                                  className="bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div
                                ref={endField.ref}
                                tabIndex={-1}
                                className="absolute w-0 h-0 opacity-0 pointer-events-none"
                              />
                            </div>
                          );
                        }}
                      />
                    );
                  }}
                />
                {errors.end_date && (
                  <p className="text-sm text-destructive">{errors.end_date.message}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          // Retreat: Keep existing range picker
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal")}
                onClick={() => focusTip("date")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y", { locale: pl })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: pl })}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y", { locale: pl })
                  )
                ) : (
                  <span className="text-placeholder">Wybierz zakres dat</span>
                )}
              </Button>
            </PopoverTrigger>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <div
                  ref={field.ref}
                  tabIndex={-1}
                  className="absolute w-0 h-0 opacity-0 pointer-events-none"
                />
              )}
            />
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <div
                  ref={field.ref}
                  tabIndex={-1}
                  className="absolute w-0 h-0 opacity-0 pointer-events-none"
                />
              )}
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                showOutsideDays={false}
                onSelect={(selectedRange: DateRange | undefined) => {
                  setDateRange(selectedRange);
                  if (selectedRange?.from) {
                    setValue("start_date", format(selectedRange.from, "yyyy-MM-dd"), {
                      shouldValidate: true,
                    });
                  } else {
                    setValue("start_date", "", { shouldValidate: true });
                  }
                  if (selectedRange?.to) {
                    setValue("end_date", format(selectedRange.to, "yyyy-MM-dd"), {
                      shouldValidate: true,
                    });
                  } else {
                    setValue("end_date", "", { shouldValidate: true });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}
        {!project.includes("workshops") && (
          <>
            {errors.start_date && (
              <p className="text-sm text-destructive">
                Błąd daty rozpoczęcia: {errors.start_date.message}
              </p>
            )}
            {!errors.start_date && errors.end_date && (
              <p className="text-sm text-destructive">
                Błąd daty zakończenia: {errors.end_date.message}
              </p>
            )}
          </>
        )}
      </div>
      <div className="space-y-2 event-form-section-padding">
        <div className="flex items-center gap-2">
          <Label htmlFor="program" size="event">
            Program
          </Label>
          <EventHelpBarTipButton tipId="program" />
        </div>
        <Label htmlFor="program" size="event-description">
          Opisz pełny program dla uczestników i podziel się z nimi, jak będą wyglądały ich dni
        </Label>
        <Separator className="my-4 md:my-8" />
        {programFields.map((field, index) => (
          <div key={field.id} className="border-b pb-6 last:border-b-0">
            <Label className="text-lg font-semibold">Dzień {index + 1}</Label>
            <div className="flex items-start flex-col md:flex-row gap-2 md:gap-6 mt-2">
              <div className="flex-shrink-0 w-full md:w-auto">
                <SingleImageUpload
                  name={`program.${index}.imageFile`}
                  control={control}
                  existingImageId={watchedProgram?.[index]?.imageId}
                  isUploading={!!uploadingProgramImages[index]}
                  onRemove={() => onRemoveProgramImage(index)}
                  onFileSelect={(file) => onProgramImageChange(file, index)}
                />
                {errors.program?.[index]?.imageId && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.program[index]?.imageId?.message}
                  </p>
                )}
              </div>

              <div className="flex-grow space-y-1 w-full md:w-auto">
                <Textarea
                  id={`program.${index}.description`}
                  {...register(`program.${index}.description` as const)}
                  placeholder={`Opis programu na dzień ${index + 1}`}
                  rows={5}
                  className="bg-background min-h-[126px]"
                  onFocus={() => focusTip("program")}
                />
                {errors.program?.[index]?.description && (
                  <p className="text-sm text-destructive">
                    {errors.program[index]?.description?.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {calculatedDuration > 0 && programFields.length < calculatedDuration && (
          <Button type="button" variant="outline" size="sm" onClick={handleAddDay}>
            <PlusCircle className="mr-2 h-4 w-4" /> Dodaj dzień {programFields.length + 1}
          </Button>
        )}
        {calculatedDuration > 0 && programFields.length > calculatedDuration && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => remove(programFields.length - 1)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Usuń ostatni dzień
          </Button>
        )}
        {calculatedDuration === 0 && (
          <p className="text-sm text-gray-500 italic">
            Wybierz datę rozpoczęcia i zakończenia, aby dodać program dnia.
          </p>
        )}
      </div>
    </>
  );
};
