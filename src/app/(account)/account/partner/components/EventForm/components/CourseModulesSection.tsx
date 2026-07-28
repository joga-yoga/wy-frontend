"use client";

import { Plus, Trash2 } from "lucide-react";
import { Control, FieldErrors, useFieldArray, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/schemas/event";

interface CourseModulesSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const CourseModulesSection = ({ control, register, errors }: CourseModulesSectionProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "modules",
  });

  return (
    <div className="space-y-2 event-form-section-padding">
      <Label size="event">Moduły kursu</Label>
      <Label size="event-description">
        Podziel kurs na moduły tematyczne. Każdy moduł może mieć tytuł, opis i liczbę godzin.
      </Label>
      <Separator className="my-4 md:my-8" />

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Moduł {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="h-7 w-7 text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor={`modules.${index}.title`} className="text-xs text-gray-600">
                  Tytuł *
                </Label>
                <Input
                  id={`modules.${index}.title`}
                  {...register(`modules.${index}.title`)}
                  placeholder="Np. Podstawy anatomii"
                />
                {(errors.modules as any)?.[index]?.title && (
                  <p className="text-xs text-destructive">
                    {(errors.modules as any)[index].title.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`modules.${index}.hours`} className="text-xs text-gray-600">
                  Godziny
                </Label>
                <Input
                  id={`modules.${index}.hours`}
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Np. 8"
                  {...register(`modules.${index}.hours`, {
                    setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                  })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`modules.${index}.description`} className="text-xs text-gray-600">
                Opis
              </Label>
              <Textarea
                id={`modules.${index}.description`}
                {...register(`modules.${index}.description`)}
                rows={2}
                placeholder="Krótki opis zawartości modułu"
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ title: "", description: null, hours: null, topics: [] })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj moduł
        </Button>
      </div>
    </div>
  );
};
