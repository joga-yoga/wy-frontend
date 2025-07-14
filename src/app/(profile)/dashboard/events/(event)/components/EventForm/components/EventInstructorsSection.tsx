import { Edit2, HelpCircle, PlusCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { Control, Controller, FieldErrors, UseFormSetValue } from "react-hook-form";

import { Instructor } from "@/components/instructors/InstructorModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { EventFormData } from "@/lib/schemas/event";

interface EventInstructorsSectionProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
  setValue: UseFormSetValue<EventFormData>;
  handleFocusField: (tipId: string) => void;
  setIsHelpBarOpen: (isOpen: boolean) => void;
  instructors: Instructor[];
  setIsInstructorModalOpen: (isOpen: boolean) => void;
  handleEditInstructor: (instructor: Instructor) => void;
  instructorToDelete: Instructor | null;
  setInstructorToDelete: (instructor: Instructor | null) => void;
  isDeletingInstructor: boolean;
  handleDeleteInstructor: () => void;
}

export const EventInstructorsSection = ({
  control,
  errors,
  setValue,
  handleFocusField,
  setIsHelpBarOpen,
  instructors,
  setIsInstructorModalOpen,
  handleEditInstructor,
  instructorToDelete,
  setInstructorToDelete,
  isDeletingInstructor,
  handleDeleteInstructor,
}: EventInstructorsSectionProps) => {
  return (
    <div className="space-y-4 md:space-y-6" id="event-instructors-section">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="instructors" size="event">
            Instruktorzy
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={() => {
              setIsHelpBarOpen(true);
              handleFocusField("instructors");
            }}
            aria-label="Pomoc dla sekcji instruktorzy"
          >
            <HelpCircle size={16} />
          </Button>
        </div>
        <Label htmlFor="instructors" size="event-description">
          Wybierz instruktorów, którzy będą prowadzić wyjazd
        </Label>
        <Separator className="my-4 md:my-8" />
        <div className="flex justify-between items-center border-b pb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsInstructorModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Dodaj Instruktora
          </Button>
        </div>
        <Controller
          control={control}
          name="instructor_ids"
          render={({ field }) => (
            <AlertDialog onOpenChange={(open) => !open && setInstructorToDelete(null)}>
              <div
                className="w-full rounded-md p-1"
                onFocusCapture={() => handleFocusField("instructors")}
              >
                <div className="space-y-3">
                  {instructors.length > 0 ? (
                    instructors.map((instructor) => (
                      <div
                        key={instructor.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-center gap-3 flex-grow">
                          <Image
                            src={
                              instructor.image_id
                                ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_40,h_40,g_face,r_max/v1/${instructor.image_id}`
                                : `https://avatar.vercel.sh/${instructor.name.replace(/\s+/g, "_")}.png?size=40`
                            }
                            alt={instructor.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover border"
                          />
                          <Label
                            htmlFor={`instructor-switch-${instructor.id}`}
                            className="font-medium cursor-pointer text-sm"
                          >
                            {instructor.name}
                          </Label>
                        </div>

                        <div className="flex items-center flex-shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInstructor(instructor)}
                            className="h-8 px-2"
                            aria-label={`Edit ${instructor.name}`}
                          >
                            <Edit2 size={16} className="text-muted-foreground" />
                          </Button>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setInstructorToDelete(instructor)}
                              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={`Delete ${instructor.name}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <Switch
                            id={`instructor-switch-${instructor.id}`}
                            checked={field.value?.includes(instructor.id)}
                            onCheckedChange={(checked) => {
                              const currentIds = field.value || [];
                              if (checked) {
                                field.onChange([...currentIds, instructor.id]);
                              } else {
                                field.onChange(currentIds.filter((id) => id !== instructor.id));
                              }
                            }}
                            className="ml-2"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-center py-4 text-gray-500">
                      Nie znaleziono instruktorów. Kliknij &quot;Dodaj Instruktora&quot;, aby dodać
                      nowego.
                    </p>
                  )}
                </div>
                {instructorToDelete && (
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Na pewno usunąć instruktora?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie instruktora &quot;
                        <strong>{instructorToDelete.name}</strong>&quot; z Twojej listy i wszystkich
                        powiązanych wydarzeń.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeletingInstructor}>Anuluj</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isDeletingInstructor}
                        onClick={handleDeleteInstructor}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeletingInstructor ? "Usuwanie..." : "Tak, usuń"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                )}
              </div>
            </AlertDialog>
          )}
        />
        {errors.instructor_ids && (
          <p className="text-sm text-destructive">{errors.instructor_ids.message}</p>
        )}
      </div>
    </div>
  );
};
