"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { TemplateEditor } from "../components/TemplateEditor";
import type { ClassTemplateCreate } from "../types";

export default function CreateTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ClassTemplateCreate) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/class-templates", data);
      toast({ description: "Szablon utworzony." });
      router.push("/konto/partner/szablony-zajec");
    } catch {
      toast({
        description: "Nie udało się utworzyć szablonu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto max-w-lg">
      <TemplateEditor
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/konto/partner/szablony-zajec")}
      />
    </div>
  );
}
