import { Control, Controller, FieldErrors, UseFormRegister, useWatch } from "react-hook-form";

import { TagsSelect } from "@/components/custom/TagsSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/schemas/event";

import { DynamicArrayInput } from "../../DynamicArrayInput";

const SKILL_LEVELS = [
  { value: "beginner", label: "Początkujący" },
  { value: "intermediate", label: "Średniozaawansowany" },
  { value: "advanced", label: "Zaawansowany" },
  { value: "all_levels", label: "Wszystkie poziomy" },
] as const;

const CERT_DESIGNATIONS = [
  { value: "RYT_200", label: "RYT-200" },
  { value: "RYT_300", label: "RYT-300" },
  { value: "RYT_500", label: "RYT-500" },
  { value: "RYS", label: "RYS" },
  { value: "YACEP", label: "YACEP" },
] as const;

interface CourseMetaSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const CourseMetaSection = ({ control, register, errors }: CourseMetaSectionProps) => {
  const certType = useWatch({ control, name: "certification" })?.type;

  return (
    <>
      {/* Format */}
      <div className="space-y-2 event-form-section-padding">
        <Label htmlFor="is_online" size="event">
          Format kursu
        </Label>
        <Label htmlFor="is_online" size="event-description">
          Czy kurs będzie online, stacjonarny czy hybrydowy?
        </Label>
        <Separator className="my-4 md:my-8" />
        <div className="flex flex-col gap-4">
          <Controller
            name="is_online"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch checked={!!field.value} onCheckedChange={field.onChange} id="is_online" />
                <Label htmlFor="is_online">Online</Label>
              </div>
            )}
          />
          <Controller
            name="is_onsite"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <div className="flex items-center gap-3">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} id="is_onsite" />
                  <Label htmlFor="is_onsite">Stacjonarne</Label>
                </div>
                <div
                  ref={field.ref}
                  tabIndex={-1}
                  className="absolute w-0 h-0 opacity-0 pointer-events-none"
                />
                {fieldState.error?.message && (
                  <p className="text-xs text-red-500">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* Teacher training toggle */}
      <div className="space-y-2 event-form-section-padding">
        <Label size="event">Szkolenie dla nauczycieli</Label>
        <Label size="event-description">
          Zaznacz jeśli kurs jest szkoleniem dla nauczycieli jogi (teacher training).
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="is_teacher_training"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
                id="is_teacher_training"
              />
              <Label htmlFor="is_teacher_training">To jest Teacher Training (TT)</Label>
            </div>
          )}
        />
      </div>

      {/* Skill level */}
      <div className="space-y-2 event-form-section-padding">
        <Label size="event">Poziom zaawansowania</Label>
        <Label size="event-description">
          Dla kogo jest ten kurs? Wybierz poziom zaawansowania uczestników.
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="skill_level"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-wrap gap-3">
              {SKILL_LEVELS.map(({ value, label }) => {
                const selected = (field.value ?? []).includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      const current = field.value ?? [];
                      if (selected) {
                        field.onChange(current.filter((v) => v !== value));
                      } else {
                        field.onChange([...current, value]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selected
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              {fieldState.error && (
                <p className="text-sm text-destructive w-full">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Goals */}
      <div className="space-y-2 event-form-section-padding">
        <Label size="event">Cele kursu</Label>
        <Label size="event-description">Co uczestnicy osiągną po ukończeniu tego kursu?</Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="goals"
          control={control}
          render={({ field, fieldState }) => (
            <DynamicArrayInput
              initialValues={field.value}
              onChange={field.onChange}
              placeholder="Np. Samodzielne prowadzenie zajęć jogi"
              ariaLabel="Cele kursu"
              error={fieldState.error}
              control={control}
              name="goals"
            />
          )}
        />
      </div>

      {/* Enrollment closes */}
      <div className="space-y-2 event-form-section-padding">
        <Label htmlFor="enrollment_closes" size="event">
          Termin zapisów
        </Label>
        <Label htmlFor="enrollment_closes" size="event-description">
          Do kiedy można się zapisać na kurs?
        </Label>
        <Separator className="my-4 md:my-8" />
        <Input
          id="enrollment_closes"
          type="datetime-local"
          {...register("enrollment_closes")}
          className="max-w-xs"
        />
        {errors.enrollment_closes && (
          <p className="text-sm text-destructive">{errors.enrollment_closes.message}</p>
        )}
      </div>

      {/* Prerequisites */}
      <div className="space-y-2 event-form-section-padding">
        <Label htmlFor="prerequisites" size="event">
          Wymagania wstępne
        </Label>
        <Label htmlFor="prerequisites" size="event-description">
          Jakie doświadczenie lub umiejętności są wymagane od uczestników?
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="prerequisites"
          {...register("prerequisites")}
          rows={3}
          placeholder="Np. Co najmniej 1 rok regularnej praktyki jogi"
        />
        {errors.prerequisites && (
          <p className="text-sm text-destructive">{errors.prerequisites.message}</p>
        )}
      </div>

      {/* Harmonogram */}
      <div className="space-y-2 event-form-section-padding">
        <Label htmlFor="harmonogram" size="event">
          Harmonogram
        </Label>
        <Label htmlFor="harmonogram" size="event-description">
          Opisz tygodniowy lub dzienny rozkład zajęć.
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="harmonogram"
          {...register("harmonogram")}
          rows={4}
          placeholder="Np. Poniedziałek–Piątek 8:00–18:00, Sobota 9:00–16:00"
        />
        {errors.harmonogram && (
          <p className="text-sm text-destructive">{errors.harmonogram.message}</p>
        )}
      </div>

      {/* Includes */}
      <div className="space-y-2 event-form-section-padding">
        <Label size="event">Co jest wliczone w kurs</Label>
        <Label size="event-description">
          Wymień materiały, certyfikaty, posiłki i inne elementy wliczone w cenę kursu.
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="includes"
          control={control}
          render={({ field, fieldState }) => (
            <DynamicArrayInput
              initialValues={field.value}
              onChange={field.onChange}
              placeholder="Np. Materiały szkoleniowe, Certyfikat ukończenia"
              ariaLabel="Co jest wliczone w kurs"
              error={fieldState.error}
              control={control}
              name="includes"
            />
          )}
        />
      </div>

      {/* Certification */}
      <div className="space-y-2 event-form-section-padding">
        <Label size="event">Certyfikacja</Label>
        <Label size="event-description">
          Czy kurs kończy się certyfikatem? Wybierz typ i szczegóły.
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="certification"
          control={control}
          render={({ field }) => {
            const hasCert = field.value != null;
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="has_certification"
                    checked={hasCert}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange({
                          type: "other",
                          designation: null,
                          issuing_body: null,
                          hours: null,
                          name: null,
                        });
                      } else {
                        field.onChange(null);
                      }
                    }}
                  />
                  <Label htmlFor="has_certification" className="font-normal cursor-pointer">
                    Kurs kończy się certyfikatem
                  </Label>
                </div>

                {hasCert && (
                  <div className="space-y-4 pl-2 border-l-2 border-gray-200 ml-2">
                    <div className="space-y-1">
                      <Label className="text-sm">Typ certyfikatu</Label>
                      <Select
                        value={field.value?.type ?? "other"}
                        onValueChange={(val) =>
                          field.onChange({ ...field.value, type: val, designation: null })
                        }
                      >
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recognized">Uznany (Yoga Alliance)</SelectItem>
                          <SelectItem value="school">Szkoła jogi</SelectItem>
                          <SelectItem value="other">Inny</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {certType === "recognized" && (
                      <div className="space-y-1">
                        <Label className="text-sm">Tytuł/Oznaczenie</Label>
                        <Select
                          value={field.value?.designation ?? ""}
                          onValueChange={(val) =>
                            field.onChange({ ...field.value, designation: val || null })
                          }
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue placeholder="Wybierz oznaczenie" />
                          </SelectTrigger>
                          <SelectContent>
                            {CERT_DESIGNATIONS.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Nazwa certyfikatu</Label>
                        <Input
                          placeholder="Np. Certyfikat instruktora jogi"
                          value={field.value?.name ?? ""}
                          onChange={(e) =>
                            field.onChange({ ...field.value, name: e.target.value || null })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Liczba godzin</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Np. 200"
                          value={field.value?.hours ?? ""}
                          onChange={(e) =>
                            field.onChange({
                              ...field.value,
                              hours: e.target.value ? parseFloat(e.target.value) : null,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm">Wydający organ</Label>
                      <Input
                        placeholder="Np. Yoga Alliance International"
                        value={field.value?.issuing_body ?? ""}
                        onChange={(e) =>
                          field.onChange({ ...field.value, issuing_body: e.target.value || null })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2 event-form-section-padding">
        <Label size="event">Tagi</Label>
        <Label size="event-description">Tagi pomagają uczestnikom znaleźć kurs.</Label>
        <Separator className="my-4 md:my-8" />
        <TagsSelect control={control} />
      </div>
    </>
  );
};
