import { Edit2, PlusCircle, X } from "lucide-react";
import Link from "next/link";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { WyImage } from "@/components/custom/WyImage";
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
import { EventFormData } from "@/lib/schemas/event";

import { useEventHelpBar } from "../contexts/EventHelpBarContext";
import { EventHelpBarTipButton } from "./EventHelpBar";

interface EventInstructorsSectionProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
  instructors: Instructor[];
  setIsInstructorModalOpen: (isOpen: boolean) => void;
  instructorToDelete: Instructor | null;
  setInstructorToDelete: (instructor: Instructor | null) => void;
  isDeletingInstructor: boolean;
  handleDeleteInstructor: () => void;
}

export const EventInstructorsSection = ({
  control,
  errors,
  instructors,
  setIsInstructorModalOpen,
  instructorToDelete,
  setInstructorToDelete,
  isDeletingInstructor,
  handleDeleteInstructor,
}: EventInstructorsSectionProps) => {
  const { focusTip } = useEventHelpBar();
  return (
    <>
      <div className="space-y-2 event-form-section-padding" id="event-instructors-section">
        <div className="flex items-center gap-2">
          <Label htmlFor="instructors" size="event">
            Instruktorzy
          </Label>
          <EventHelpBarTipButton tipId="instructors" />
        </div>
        <Label htmlFor="instructors" size="event-description">
          Wybierz instruktorów
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
          render={({ field }) => {
            const selectedInstructors = instructors.filter((instructor) =>
              field.value?.includes(instructor.id),
            );

            return (
              <AlertDialog onOpenChange={(open) => !open && setInstructorToDelete(null)}>
                <div className="w-full rounded-md p-1" onClick={() => focusTip("instructors")}>
                  <div className="space-y-3">
                    {selectedInstructors.length > 0 ? (
                      selectedInstructors.map((instructor) => {
                        const canEdit = instructor.is_owned === true || !instructor.is_foreign;

                        return (
                          <div
                            key={instructor.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-center gap-3 flex-grow">
                              <WyImage
                                src={
                                  instructor.image_id ||
                                  `https://avatar.vercel.sh/${instructor.name.replace(/\s+/g, "_")}.png?size=40`
                                }
                                alt={instructor.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover border min-h-[40px]"
                              />
                              <p className="font-medium text-sm">{instructor.name}</p>
                            </div>

                            <div className="flex items-center flex-shrink-0 gap-2">
                              {!canEdit && (
                                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border">
                                  Zewnętrzny
                                </span>
                              )}
                              {canEdit && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  aria-label={`Edytuj ${instructor.name}`}
                                  asChild
                                >
                                  <Link
                                    href={`/profile/instructors/${instructor.id}/edit`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Edit2 size={16} className="text-muted-foreground" />
                                  </Link>
                                </Button>
                              )}
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setInstructorToDelete(instructor)}
                                  className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  aria-label={`Usuń ${instructor.name} z tego wydarzenia`}
                                >
                                  <X size={16} />
                                </Button>
                              </AlertDialogTrigger>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-center py-4 text-gray-500">
                        Nie dodano jeszcze instruktorów do tego wydarzenia.
                      </p>
                    )}
                  </div>
                  {instructorToDelete && (
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć instruktora z tego wydarzenia?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Instruktor &quot;<strong>{instructorToDelete.name}</strong>&quot; zniknie
                          z tego wydarzenia. Profil instruktora i lista zapisanych instruktorów
                          pozostaną bez zmian.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingInstructor}>
                          Anuluj
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isDeletingInstructor}
                          onClick={handleDeleteInstructor}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeletingInstructor ? "Usuwanie..." : "Usuń z wydarzenia"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  )}
                  <div
                    ref={field.ref}
                    tabIndex={-1}
                    className="absolute w-0 h-0 opacity-0 pointer-events-none"
                  />
                </div>
              </AlertDialog>
            );
          }}
        />
        {errors.instructor_ids && (
          <p className="text-sm text-destructive">{errors.instructor_ids.message}</p>
        )}
      </div>
    </>
  );
};
