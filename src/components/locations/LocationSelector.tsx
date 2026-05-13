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
  address_line1?: string | null;
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

  const getPrimaryLabel = (location: LocationSelectorItem) =>
    location.title || location.address_line1 || "Lokalizacja";

  const getSelectedLabel = (location: LocationSelectorItem) =>
    `${location.address_line1 || getPrimaryLabel(location)}${location.title ? ` (${location.title})` : ""}`;

  const renderLocationLabel = (location: LocationSelectorItem) => {
    const primaryLabel = getPrimaryLabel(location);
    const secondaryLabel =
      location.address_line1 && location.address_line1 !== primaryLabel
        ? location.address_line1
        : null;

    return (
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        <span className="max-w-full truncate font-medium">{primaryLabel}</span>
        {secondaryLabel && (
          <span className="max-w-full truncate text-xs text-muted-foreground">
            {secondaryLabel}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => {
          const selectedLocation = locations.find((loc) => loc.id === field.value);

          return (
            <div className="flex w-full min-w-0 items-center space-x-2">
              {locations.length > 0 ? (
                <>
                  <div className="min-w-0 flex-1">
                    <Select
                      onValueChange={(nextValue) => {
                        if (nextValue === "") {
                          return;
                        }

                        field.onChange(nextValue);
                      }}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="h-auto min-h-[60px] w-full min-w-0 py-2 [&>span]:min-w-0">
                        <SelectValue placeholder={`Wybierz ${label.toLowerCase()}`}>
                          {selectedLocation ? renderLocationLabel(selectedLocation) : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => {
                          return (
                            <SelectItem
                              key={loc.id}
                              value={loc.id}
                              textValue={getSelectedLabel(loc)}
                              className="py-2"
                            >
                              {renderLocationLabel(loc)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-12 self-center rounded-lg"
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
                    className="size-12 self-center rounded-lg"
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
            </div>
          );
        }}
      />
      {errors[fieldName] && (
        <p className="text-sm text-destructive">{errors[fieldName]?.message as string}</p>
      )}
    </>
  );
};
