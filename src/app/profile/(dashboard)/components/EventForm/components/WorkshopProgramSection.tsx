import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getRandomDefaultImageId } from "@/lib/getRandomDefaultImageId";
import { cn } from "@/lib/utils";

import { useEventHelpBar } from "../contexts/EventHelpBarContext";
import { EventHelpBarTipButton } from "./EventHelpBar";
import { EventProgramSectionProps } from "./EventProgramSection.types";

const parseDateTime = (isoString: string | null | undefined) => {
  if (!isoString) return { date: "", time: "" };

  try {
    const dateObj = new Date(isoString);
    const utcYear = dateObj.getUTCFullYear();
    const utcMonth = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const utcDate = String(dateObj.getUTCDate()).padStart(2, "0");
    const utcHours = String(dateObj.getUTCHours()).padStart(2, "0");
    const utcMinutes = String(dateObj.getUTCMinutes()).padStart(2, "0");

    return {
      date: `${utcYear}-${utcMonth}-${utcDate}`,
      time: `${utcHours}:${utcMinutes}`,
    };
  } catch {
    return { date: "", time: "" };
  }
};

const buildDateTime = (date: string, time: string) => {
  if (!date) return "";

  const timeStr = time || "00:00";
  return `${date}T${timeStr}:00Z`;
};

export const WorkshopProgramSection = ({
  control,
  register,
  errors,
  programFields,
  append,
  remove,
  uploadingProgramImages,
  onRemoveProgramImage,
  onProgramImageChange,
  occurrenceFields,
  appendOccurrence,
  removeOccurrence,
}: EventProgramSectionProps) => {
  const { focusTip } = useEventHelpBar();
  const watchedProgram = useWatch({ control, name: "program" });
  const watchedOccurrences = useWatch({ control, name: "occurrences" });
  const rowCount = Math.max(occurrenceFields.length, programFields.length);

  const handleAddRow = () => {
    appendOccurrence({ start_time: "", end_time: "", label: null });
    append({ description: "", imageId: getRandomDefaultImageId() });
  };

  const handleRemoveRow = (index: number) => {
    if (occurrenceFields[index]) {
      removeOccurrence(index);
    }
    if (programFields[index]) {
      remove(index);
    }
  };

  return (
    <div className="space-y-2 event-form-section-padding" id="event-program-section">
      <div className="flex items-center gap-2">
        <Label htmlFor="program" size="event">
          Plan wydarzenia
        </Label>
        <EventHelpBarTipButton tipId="program" />
        <EventHelpBarTipButton tipId="date" />
      </div>
      <Label htmlFor="program" size="event-description">
        Wybierz datę i godziny każdego dnia, dodaj zdjęcie oraz krótko opisz, co wydarzy się w
        programie.
      </Label>
      <Separator className="my-4 md:my-8" />

      <div className="space-y-4">
        {Array.from({ length: rowCount }).map((_, index) => {
          const occurrenceField = occurrenceFields[index];
          const programField = programFields[index];
          const rowKey = occurrenceField?.id ?? programField?.id ?? `workshop-program-${index}`;
          const watchedOccurrence = watchedOccurrences?.[index];
          const { date: watchedStartDate } = parseDateTime(watchedOccurrence?.start_time);
          const { date: watchedEndDate } = parseDateTime(watchedOccurrence?.end_time);
          const watchedOccurrenceDate = watchedStartDate || watchedEndDate;
          const programDayTitle = watchedOccurrenceDate
            ? format(new Date(`${watchedOccurrenceDate}T00:00:00`), "dd.MM.yyyy (EEEE)", {
                locale: pl,
              })
            : `Dzień ${index + 1}`;

          return (
            <div key={rowKey} className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-base font-semibold">Dzień {index + 1}</Label>
                {rowCount > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRow(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Controller
                name={`occurrences.${index}.start_time`}
                control={control}
                render={({ field: startField }) => (
                  <Controller
                    name={`occurrences.${index}.end_time`}
                    control={control}
                    render={({ field: endField }) => {
                      const { date: startDate, time: startTime } = parseDateTime(startField.value);
                      const { date: endDate, time: endTime } = parseDateTime(endField.value);
                      const occurrenceDate = startDate || endDate;

                      return (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm">Data</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn("w-full justify-start text-left font-normal")}
                                  onClick={() => focusTip("date")}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {occurrenceDate
                                    ? format(new Date(`${occurrenceDate}T00:00:00`), "PPP", {
                                        locale: pl,
                                      })
                                    : "Wybierz datę"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  initialFocus
                                  mode="single"
                                  selected={
                                    occurrenceDate
                                      ? new Date(`${occurrenceDate}T00:00:00`)
                                      : undefined
                                  }
                                  onSelect={(selectedDate) => {
                                    if (!selectedDate) return;

                                    const selectedDay = format(selectedDate, "yyyy-MM-dd");
                                    startField.onChange(
                                      buildDateTime(selectedDay, startTime || "12:00"),
                                    );
                                    endField.onChange(
                                      buildDateTime(selectedDay, endTime || "13:00"),
                                    );
                                  }}
                                  showOutsideDays={false}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Godzina rozpoczęcia</Label>
                              <Input
                                type="time"
                                disabled={!occurrenceDate}
                                value={startTime}
                                onChange={(event) => {
                                  startField.onChange(
                                    buildDateTime(occurrenceDate, event.target.value),
                                  );
                                }}
                                className="bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              {errors.occurrences?.[index]?.start_time && (
                                <p className="text-sm text-destructive">
                                  {errors.occurrences[index]?.start_time?.message}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Godzina zakończenia</Label>
                              <Input
                                type="time"
                                disabled={!occurrenceDate}
                                value={endTime}
                                onChange={(event) => {
                                  endField.onChange(
                                    buildDateTime(occurrenceDate, event.target.value),
                                  );
                                }}
                                className="bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              {errors.occurrences?.[index]?.end_time && (
                                <p className="text-sm text-destructive">
                                  {errors.occurrences[index]?.end_time?.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    }}
                  />
                )}
              />

              <div className="flex items-start flex-col md:flex-row gap-2 md:gap-6">
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
                  <Label
                    htmlFor={`program.${index}.description`}
                    className="block text-md font-semibold text-gray-800 mt-[-2px]"
                  >
                    {programDayTitle}
                  </Label>
                  <Textarea
                    id={`program.${index}.description`}
                    {...register(`program.${index}.description` as const)}
                    placeholder="Opisz, co wydarzy się tego dnia. Nie wpisuj daty ani dnia tygodnia - pokażemy je automatycznie."
                    rows={4}
                    className="bg-background min-h-[102px]"
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
          );
        })}

        <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
          <PlusCircle className="mr-2 h-4 w-4" /> Dodaj dzień
        </Button>

        {typeof errors.occurrences?.message === "string" && (
          <p className="text-sm text-destructive">{errors.occurrences.message}</p>
        )}
        {errors.start_date && (
          <p className="text-sm text-destructive">{errors.start_date.message}</p>
        )}
        {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
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
      </div>
    </div>
  );
};
