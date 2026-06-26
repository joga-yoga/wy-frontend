"use client";

import { Trash2 } from "lucide-react";
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
        router.push("/profile/class-templates");
      })
      .finally(() => setIsLoading(false));
  }, [params.templateId, router, toast]);

  const handleSubmit = async (data: ClassTemplateCreate) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/class-templates/${params.templateId}`, data);
      toast({ description: "Szablon zaktualizowany." });
      router.push("/profile/class-templates");
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
      router.push("/profile/class-templates");
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
    <div className="p-4 mx-auto max-w-lg">
      <TemplateEditor
        initial={template}
        onSubmit={handleSubmit}
        submitLabel="Zapisz zmiany"
        isSubmitting={isSubmitting}
      />
      <div className="mt-6 pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
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
