import { DateRange } from "react-day-picker";
import {
  Control,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import { EventFormData } from "@/lib/schemas/event";

export interface EventProgramSectionProps {
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
  occurrenceFields: {
    id: string;
    start_time?: string;
    end_time?: string;
    label?: string | null;
  }[];
  appendOccurrence: (value: {
    start_time: string;
    end_time: string;
    label?: string | null;
  }) => void;
  removeOccurrence: UseFieldArrayRemove;
}
