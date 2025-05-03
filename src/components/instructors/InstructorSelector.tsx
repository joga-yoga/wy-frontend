import { Edit2, PlusCircle } from "lucide-react"; // Icons
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { axiosInstance } from "@/lib/axiosInstance";

import { InstructorModal } from "./InstructorModal";

interface Instructor {
  id: string;
  name: string;
  bio: string;
  image_id: string;
}

interface InstructorSelectorProps {
  selectedInstructorId: string | undefined;
  onInstructorSelect: (id: string | undefined) => void;
  // Add any other props needed, like label, error handling, etc.
  label?: string;
  error?: string;
}

export function InstructorSelector({
  selectedInstructorId,
  onInstructorSelect,
  label = "Instructor",
  error,
}: InstructorSelectorProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  const fetchInstructors = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/instructors");
      setInstructors(res.data);
    } catch (err) {
      console.error("Failed to fetch instructors", err);
      // Handle error state appropriately, maybe show a toast
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleInstructorSaved = (savedInstructor: Instructor) => {
    // Refresh the list or update/add the instructor in the state
    setInstructors((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === savedInstructor.id);
      if (existingIndex > -1) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = savedInstructor;
        return updated;
      } else {
        // Add new
        return [...prev, savedInstructor];
      }
    });
    // Automatically select the newly saved instructor
    onInstructorSelect(savedInstructor.id);
    setIsModalOpen(false); // Close modal
    setEditingInstructor(null); // Reset editing state
  };

  const handleAddNew = () => {
    setEditingInstructor(null); // Ensure we are in create mode
    setIsModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from opening
    const instructorToEdit = instructors.find((i) => i.id === selectedInstructorId);
    if (instructorToEdit) {
      setEditingInstructor(instructorToEdit);
      setIsModalOpen(true);
    }
  };

  const handleSelectChange = (value: string) => {
    // The value "add-new" is a special case to trigger the modal
    if (value === "add-new") {
      handleAddNew();
    } else {
      onInstructorSelect(value || undefined); // Pass undefined if empty
    }
  };

  const selectedInstructor = instructors.find((i) => i.id === selectedInstructorId);

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <Select
          value={selectedInstructorId || ""}
          onValueChange={handleSelectChange}
          disabled={isLoading}
        >
          <SelectTrigger className="flex-grow">
            <SelectValue placeholder={isLoading ? "Loading..." : "Select an instructor..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add-new" className="text-blue-600 italic">
              <div className="flex items-center gap-2">
                <PlusCircle size={16} /> Add New Instructor...
              </div>
            </SelectItem>
            {instructors.map((instructor) => (
              <SelectItem key={instructor.id} value={instructor.id}>
                {instructor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedInstructor && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleEdit}
            title="Edit selected instructor"
          >
            <Edit2 size={16} />
          </Button>
        )}
        {/* Fallback Add button if select isn't sufficient */}
        {!selectedInstructorId && instructors.length === 0 && !isLoading && (
          <Button variant="outline" onClick={handleAddNew} className="flex-shrink-0">
            <PlusCircle size={16} className="mr-1" /> Add Instructor
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      <InstructorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInstructor(null); // Clear editing state on close
        }}
        onInstructorSaved={handleInstructorSaved}
        initialInstructor={editingInstructor}
      />
    </div>
  );
}
