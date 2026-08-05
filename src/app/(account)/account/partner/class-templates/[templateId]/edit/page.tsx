"use client";

import { CalendarPlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    axiosInstance
      .get<ClassTemplate>(`/class-templates/${params.templateId}`)
      .then((r) => setTemplate(r.data))
      .catch(() => {
        toast({
          description: "Nie udało się załadować szablonu.",
          variant: "destructive",
        });
        router.push("/konto/partner/szablony-zajec");
      })
      .finally(() => setIsLoading(false));
  }, [params.templateId, router, toast]);

  const handleSubmit = async (data: ClassTemplateCreate) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/class-templates/${params.templateId}`, data);
      toast({ description: "Szablon zaktualizowany." });
      router.push("/konto/partner/szablony-zajec");
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
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/class-templates/${params.templateId}`);
      toast({ description: "Szablon usunięty." });
      router.push("/konto/partner/szablony-zajec");
    } catch {
      toast({
        description: "Nie udało się usunąć szablonu.",
        variant: "destructive",
      });
    } finally {
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
        onCancel={() => router.push("/konto/partner/szablony-zajec")}
        pinFooter
      />

      {/* The user's "add Class to Schedule from Class details". A template exists to be
          scheduled, and until now the only route into the wizard was Grafik's "+", which
          then asked you to pick the template you were already looking at. */}
      <div className="mt-6 border-t pt-4">
        <Button size="action" variant="outline" className="w-full" asChild>
          <Link href={`/konto/partner/grafiki-zajec/create?templateId=${params.templateId}`}>
            <CalendarPlus size={15} className="mr-1.5" />
            Dodaj do grafiku
          </Link>
        </Button>
      </div>

      <div className="mt-3">
        <Button
          variant="ghost"
          className="w-full text-b2b-red-solid hover:bg-b2b-red-bg hover:text-b2b-red-solid"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 size={14} className="mr-1" />
          {isDeleting ? "Usuwanie..." : "Usuń szablon"}
        </Button>
      </div>
    </div>
  );
}
