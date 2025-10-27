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

import { useEventHelpBar } from "../contexts/EventHelpBarContext";
import { Location } from "../EventForm";
import { EventHelpBarTipButton } from "./EventHelpBar";

interface EventLocationSectionProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
  locations: Location[];
  setIsLocationModalOpen: (isOpen: boolean) => void;
  setEditingLocation: (location: Location | null) => void;
  setLocationModalMode: (mode: "create" | "edit") => void;
}

export const EventLocationSection = ({
  control,
  errors,
  locations,
  setIsLocationModalOpen,
  setEditingLocation,
  setLocationModalMode,
}: EventLocationSectionProps) => {
  const { focusTip } = useEventHelpBar();
  const { toast } = useToast();
  return (
    <div className="space-y-2 event-form-section-padding" id="event-location-section">
      <div className="flex items-center gap-2">
        <Label htmlFor="location_id" size="event">
          Lokalizacja
        </Label>
        <EventHelpBarTipButton tipId="location_id" />
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
                  onOpenChange={(isOpen) => isOpen && focusTip("location_id")}
                >
                  <SelectTrigger onFocus={() => focusTip("location_id")}>
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
            <Controller
              name="location_id"
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
      {errors.location_id && (
        <p className="text-sm text-destructive">{errors.location_id.message}</p>
      )}
    </div>
  );
};
