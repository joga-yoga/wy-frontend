"use client";

import { useEffect, useState } from "react";
import { Control, FieldErrors, UseFormSetValue } from "react-hook-form";

import { LocationModal } from "@/components/locations/LocationModal";
import { LocationSelector } from "@/components/locations/LocationSelector";
import { axiosInstance } from "@/lib/axiosInstance";

import type { CourseFormValues, CourseLocation } from "./types";

interface CourseLocationFieldProps {
  control: Control<CourseFormValues>;
  errors: FieldErrors<CourseFormValues>;
  setValue: UseFormSetValue<CourseFormValues>;
}

export function CourseLocationField({ control, errors, setValue }: CourseLocationFieldProps) {
  const [locations, setLocations] = useState<CourseLocation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CourseLocation | null>(null);

  useEffect(() => {
    axiosInstance
      .get<CourseLocation[]>("/locations")
      .then((response) => setLocations(response.data))
      .catch(() => setLocations([]));
  }, []);

  function handleSaved(location: CourseLocation) {
    setLocations((prev) => {
      const exists = prev.some((item) => item.id === location.id);
      return exists
        ? prev.map((item) => (item.id === location.id ? location : item))
        : [...prev, location];
    });
    setValue("location_id", location.id, { shouldDirty: true, shouldValidate: true });
    setValue("location", location, { shouldDirty: true });
  }

  return (
    <div className="space-y-2" data-error-field="location_id">
      <label className="text-base font-semibold" htmlFor="course-location">
        Adres zajęć stacjonarnych
      </label>
      <LocationSelector
        control={control as any}
        errors={errors as any}
        fieldName="location_id"
        label="Lokalizacja"
        locations={locations}
        onEditClick={(location) => {
          setEditingLocation(location as CourseLocation);
          setIsModalOpen(true);
        }}
        onAddClick={() => {
          setEditingLocation(null);
          setIsModalOpen(true);
        }}
      />
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
        }}
        onLocationSaved={(location) => handleSaved(location as CourseLocation)}
        initialData={editingLocation as any}
        mode={editingLocation ? "edit" : "create"}
      />
    </div>
  );
}
