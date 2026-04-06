"use client";

import { Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getImageUrl } from "@/app/retreats/retreats/[slug]/helpers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { formatDateRange } from "@/lib/formatDateRange";

interface ClassItem {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  image_ids?: string[];
  image_id?: string;
  is_public: boolean;
}

const getClassStatus = (item: ClassItem): { text: string; className: string } => {
  if (!item.is_public) {
    return {
      text: "Prywatne",
      className: "bg-gray-100 text-gray-700 border border-gray-300",
    };
  }

  return {
    text: "Publiczne",
    className: "bg-green-100 text-green-800",
  };
};

export default function DashboardClassesPage() {
  const [items, setItems] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    axiosInstance
      .get<ClassItem[]>("/classes")
      .then((response) => {
        setItems(response.data ?? []);
      })
      .catch((error) => {
        console.error("Failed to fetch classes", error);
        toast({
          description: "Nie udało się załadować zajęć.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [toast]);

  return (
    <div className="p-6 mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Zajęcia</h1>
          <p className="text-sm text-gray-500 mt-1">Podgląd istniejących zajęć w panelu.</p>
        </div>
        <Link href={`${process.env.NEXT_PUBLIC_PROFILE_HOST}/classes/create`}>
          <Button>Dodaj zajęcia</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500">Ładowanie zajęć...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">Nie masz jeszcze żadnych zajęć.</p>
          <Link href={`${process.env.NEXT_PUBLIC_PROFILE_HOST}/classes/create`}>
            <Button>Utwórz pierwsze zajęcia</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const status = getClassStatus(item);

            return (
              <Link
                key={item.id}
                href={`${process.env.NEXT_PUBLIC_PROFILE_HOST}/classes/${item.id}/edit`}
                className="border rounded-lg shadow-sm bg-white flex flex-col md:flex-row overflow-hidden min-h-[184px] cursor-pointer hover:shadow-md transition-shadow"
              >
                <Image
                  src={getImageUrl(item.image_ids?.[0] || item.image_id)}
                  alt={item.title}
                  width={200}
                  height={200}
                  className="object-cover min-w-[200px] w-full md:w-[200px] h-[200px]"
                />
                <div className="p-4 flex flex-col justify-between w-full">
                  <div>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md w-fit ${status.className}`}
                    >
                      {status.text}
                    </span>

                    <h2 className="text-lg font-semibold text-gray-800 mt-2">{item.title}</h2>

                    {item.start_date ? (
                      <div className="flex flex-row justify-center items-center w-min py-1 gap-2">
                        <Calendar className="w-[20px] h-[20px] text-gray-600" />
                        <span className="text-md font-medium text-gray-600 whitespace-nowrap leading-1 md:pt-[2px]">
                          {formatDateRange(item.start_date, item.end_date)}
                        </span>
                      </div>
                    ) : null}

                    {item.description ? (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-3">{item.description}</p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex justify-end items-center">
                    <span className="text-xl">🧘</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
