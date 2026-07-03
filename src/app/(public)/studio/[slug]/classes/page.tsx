import { ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getStudio } from "@/lib/api/getStudio";
import { getStudioClassTemplates } from "@/lib/api/getStudioClassTemplates";

import { ClassCard } from "./components/ClassCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) return {};
  return { title: `Zajęcia · ${studio.name} | joga.yoga` };
}

export default async function StudioClassesPage({ params }: Props) {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) notFound();

  const { items } = await getStudioClassTemplates(slug);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white px-4 py-4">
        <Link
          href={`/studio/${studio.slug}`}
          className="mb-3 flex items-center gap-1.5 text-sm text-gray-500"
        >
          <ChevronLeft className="h-4 w-4" />
          Wróć
        </Link>
        <p className="text-sm text-gray-500">{studio.name}</p>
        <h1 className="text-xl font-bold text-gray-900">Zajęcia</h1>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-8 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4efe8]">
              <Sparkles className="h-6 w-6 text-[#b9a488]" />
            </div>
            <p className="text-sm text-gray-500">To studio nie ma jeszcze zaplanowanych zajęć.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <ClassCard key={item.id} studioSlug={slug} item={item} variant="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
