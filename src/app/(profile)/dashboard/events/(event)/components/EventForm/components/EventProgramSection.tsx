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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/schemas/event";
import { cn } from "@/lib/utils";

import { defaultImagesIds } from "../../default-images-ids";

interface EventProgramSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
  programFields: { id: string; description?: string; imageId?: string | null }[];
  append: (value: { description: string; imageId: string | null }) => void;
  remove: UseFieldArrayRemove;
  calculatedDuration: number;
  handleFocusField: (tipId: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  setValue: UseFormSetValue<EventFormData>;
  uploadingProgramImages: Record<number, boolean>;
  onRemoveProgramImage: (index: number) => void;
  onProgramImageChange: (file: File, index: number) => void;
}

export const EventProgramSection = ({
  control,
  register,
  errors,
  programFields,
  append,
  remove,
  calculatedDuration,
  handleFocusField,
  dateRange,
  setDateRange,
  setValue,
  uploadingProgramImages,
  onRemoveProgramImage,
  onProgramImageChange,
}: EventProgramSectionProps) => {
  const watchedProgram = useWatch({ control, name: "program" });

  const handleAddDay = () => {
    const randomIndex = Math.floor(Math.random() * defaultImagesIds.length);
    const randomImageId = defaultImagesIds[randomIndex];
    append({ description: "", imageId: randomImageId });
  };

  return (
    <div className="space-y-4 md:space-y-6" id="event-program-section">
      <div className="space-y-2">
        <Label htmlFor="start_date" size="event">
          Termin wyjazdu
        </Label>
        <Separator className="my-4 md:my-8" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange && "text-muted-foreground",
              )}
              onClick={() => handleFocusField("date")}
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
                <span>Wybierz zakres dat</span>
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
      </div>

      <Label htmlFor="program" size="event">
        Program wyjazdu (dzień po dniu)
      </Label>
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
                onFocus={() => handleFocusField("program")}
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
  );
};
