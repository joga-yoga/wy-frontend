"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface InstructorItem {
  id: string;
  name: string;
  image_id: string | null;
  short_bio: string | null;
  slug: string | null;
}

export default function InstructorsListPage() {
  const { toast } = useToast();
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<InstructorItem[]>("/instructors")
      .then(({ data }) => setInstructors(data))
      .catch(() => {
        toast({ title: "Nie udało się załadować instruktorów", variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <DashboardHeader title="Moi instruktorzy" />
      <div className="container max-w-2xl px-4 py-6">
        <div className="flex justify-end mb-5">
          <Button asChild>
            <Link href="/profile/instructors/create">
              <Plus size={16} className="mr-1.5" /> Dodaj instruktora
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-gray-50">
            <p className="text-gray-500 mb-5 text-sm">
              Nie masz jeszcze żadnych instruktorów.
              <br />
              Dodaj pierwszego, aby przypisać go do zajęć lub wyjazdu.
            </p>
            <Button asChild>
              <Link href="/profile/instructors/create">Utwórz instruktora</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y rounded-xl border overflow-hidden bg-white">
            {instructors.map((instructor) => (
              <Link
                key={instructor.id}
                href={`/profile/instructors/${instructor.id}/edit`}
                className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 hover:bg-gray-50 transition-colors"
              >
                <WyImage
                  src={
                    instructor.image_id ||
                    `https://avatar.vercel.sh/${instructor.name.replace(/\s+/g, "_")}.png?size=56`
                  }
                  alt={instructor.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 leading-snug">{instructor.name}</p>
                  {instructor.short_bio && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {instructor.short_bio}
                    </p>
                  )}
                </div>
                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
