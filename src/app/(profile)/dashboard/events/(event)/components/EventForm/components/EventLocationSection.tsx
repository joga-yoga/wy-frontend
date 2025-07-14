import { Edit2, HelpCircle, PlusCircle } from "lucide-react";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { EventFormData } from "@/lib/schemas/event";

import { Location } from "../EventForm";

interface EventLocationSectionProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
  locations: Location[];
  handleFocusField: (tipId: string) => void;
  setIsHelpBarOpen: (isOpen: boolean) => void;
  setIsLocationModalOpen: (isOpen: boolean) => void;
  setEditingLocation: (location: Location | null) => void;
  setLocationModalMode: (mode: "create" | "edit") => void;
  toast: ReturnType<typeof useToast>["toast"];
}

export const EventLocationSection = ({
  control,
  errors,
  locations,
  handleFocusField,
  setIsHelpBarOpen,
  setIsLocationModalOpen,
  setEditingLocation,
  setLocationModalMode,
  toast,
}: EventLocationSectionProps) => {
  return (
    <div className="space-y-2" id="event-location-section">
      <div className="flex items-center gap-2">
        <Label htmlFor="location_id" size="event">
          Lokalizacja
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
          onClick={() => {
            setIsHelpBarOpen(true);
            handleFocusField("location_id");
          }}
          aria-label="Pomoc dla sekcji lokalizacja"
        >
          <HelpCircle size={16} />
        </Button>
      </div>
      <Separator className="my-4 md:my-8" />
      <Controller
        name="location_id"
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            {locations.length > 0 ? (
              <>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  onOpenChange={(isOpen) => isOpen && handleFocusField("location_id")}
                >
                  <SelectTrigger onFocus={() => handleFocusField("location_id")}>
                    <SelectValue placeholder="Wybierz lokalizację" />
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
                      setEditingLocation(selectedLoc);
                      setLocationModalMode("edit");
                      setIsLocationModalOpen(true);
                    } else {
                      toast({
                        description: "Wybierz lokalizację do edycji.",
                        variant: "default",
                      });
                    }
                  }}
                  disabled={!field.value}
                  aria-label="Edytuj wybraną lokalizację"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingLocation(null);
                    setLocationModalMode("create");
                    setIsLocationModalOpen(true);
                  }}
                  aria-label="Dodaj nową lokalizację"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingLocation(null);
                  setLocationModalMode("create");
                  setIsLocationModalOpen(true);
                }}
                aria-label="Dodaj pierwszą lokalizację"
                className="w-full justify-start"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Dodaj pierwszą lokalizację
              </Button>
            )}
          </div>
        )}
      />
      {errors.location_id && (
        <p className="text-sm text-destructive">{errors.location_id.message}</p>
      )}
    </div>
  );
};
