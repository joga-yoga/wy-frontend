"use client";

import { CalendarPlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { TemplateEditor } from "../../components/TemplateEditor";
import type { ClassTemplate, ClassTemplateCreate } from "../../types";

export default function EditTemplatePage() {
  const params = useParams<{ templateId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [template, setTemplate] = useState<ClassTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const deleteTitleId = useId();
  const deletingRef = useRef(false);

  useEffect(() => {
    axiosInstance
      .get<ClassTemplate>(`/class-templates/${params.templateId}`)
      .then((r) => setTemplate(r.data))
      .catch(() => {
        toast({
          description: "Nie udało się załadować szablonu.",
          variant: "destructive",
        });
        router.push("/account/partner/class-templates");
      })
      .finally(() => setIsLoading(false));
  }, [params.templateId, router, toast]);

  const handleSubmit = async (data: ClassTemplateCreate) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/class-templates/${params.templateId}`, data);
      toast({ description: "Szablon zaktualizowany." });
      router.push("/account/partner/class-templates");
    } catch {
      toast({
        description: "Nie udało się zapisać zmian.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/class-templates/${params.templateId}`);
      setDeleteConfirmationOpen(false);
      toast({ description: "Szablon usunięty." });
      router.push("/account/partner/class-templates");
    } catch {
      toast({
        description: "Nie udało się usunąć szablonu.",
        variant: "destructive",
      });
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 mx-auto max-w-lg">
        <p className="text-center text-gray-400 py-8">Ładowanie...</p>
      </div>
    );
  }

  if (!template) return null;

  return (
    <div className="p-4 pb-32 mx-auto max-w-lg">
      <TemplateEditor
        initial={template}
        onSubmit={handleSubmit}
        submitLabel="Zapisz zmiany"
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/account/partner/class-templates")}
        pinFooter
      />

      {/* The user's "add Class to Schedule from Class details". A template exists to be
          scheduled, and until now the only route into the wizard was Grafik's "+", which
          then asked you to pick the template you were already looking at. */}
      <div className="mt-6 border-t pt-4">
        <Button size="action" variant="outline" className="w-full" asChild>
          <Link href={`/account/partner/class-schedules/create?templateId=${params.templateId}`}>
            <CalendarPlus size={15} className="mr-1.5" />
            Dodaj do grafiku
          </Link>
        </Button>
      </div>

      <div className="mt-3">
        <Popover open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-b2b-red-solid hover:bg-b2b-red-bg hover:text-b2b-red-solid"
              disabled={isDeleting}
            >
              <Trash2 size={14} className="mr-1" />
              {isDeleting ? "Usuwanie..." : "Usuń szablon"}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-64 space-y-3" aria-labelledby={deleteTitleId}>
            <p id={deleteTitleId} className="text-sm font-semibold">
              Usunąć szablon?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmationOpen(false)}
              >
                Anuluj
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-11"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "Usuwanie..." : "Tak, usuń"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
