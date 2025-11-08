"use client";

import { Edit2, PlusCircle } from "lucide-react";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export interface LocationSelectorItem {
  id: string;
  title: string;
  country?: string | null;
}

interface LocationSelectorProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldName: string;
  label: string;
  locations: LocationSelectorItem[];
  onEditClick: (location: LocationSelectorItem) => void;
  onAddClick: () => void;
}

export const LocationSelector = ({
  control,
  errors,
  fieldName,
  label,
  locations,
  onEditClick,
  onAddClick,
}: LocationSelectorProps) => {
  const { toast } = useToast();

  return (
    <>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            {locations.length > 0 ? (
              <>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Wybierz ${label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.title}
                        {loc.country ? ` (${loc.country})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const selectedLoc = locations.find((l) => l.id === field.value);
                    if (selectedLoc) {
                      onEditClick(selectedLoc);
                    } else {
                      toast({
                        description: `Wybierz ${label.toLowerCase()} do edycji.`,
                        variant: "default",
                      });
                    }
                  }}
                  disabled={!field.value}
                  aria-label={`Edytuj wybraną ${label.toLowerCase()}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onAddClick}
                  aria-label={`Dodaj nową ${label.toLowerCase()}`}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onAddClick}
                aria-label={`Dodaj pierwszą ${label.toLowerCase()}`}
                className="w-full justify-start"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Dodaj pierwszą {label.toLowerCase()}
              </Button>
            )}
            <Controller
              name={fieldName}
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
        )}
      />
      {errors[fieldName] && (
        <p className="text-sm text-destructive">{errors[fieldName]?.message as string}</p>
      )}
    </>
  );
};
