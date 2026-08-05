import { Control, FieldErrors } from "react-hook-form";

import { LocationSelector } from "@/components/locations/LocationSelector";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

  return (
    <div className="event-form-section-padding" id="event-location-section">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="location_id" size="event">
            Lokalizacja
          </Label>
          <EventHelpBarTipButton tipId="location_id" />
        </div>
        <Label htmlFor="location_id" size="event-description">
          Wybierz lokalizację wydarzenia.
        </Label>
        <Separator className="my-4 md:my-8" />

        <LocationSelector
          control={control}
          errors={errors}
          fieldName="location_id"
          label="Lokalizacja"
          locations={locations}
          onEditClick={(location) => {
            setEditingLocation(location);
            setLocationModalMode("edit");
            setIsLocationModalOpen(true);
          }}
          onAddClick={() => {
            setEditingLocation(null);
            setLocationModalMode("create");
            setIsLocationModalOpen(true);
          }}
        />
      </div>
    </div>
  );
};
