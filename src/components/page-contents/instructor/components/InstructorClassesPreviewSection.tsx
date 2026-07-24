"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { InstructorClassTemplateListResponse } from "@/app/(public)/instructor/[slug]/classes/types";
import { ClassCard } from "@/app/(public)/studio/[slug]/classes/components/ClassCard";
import { classCountLabel } from "@/app/(public)/studio/[slug]/classes/types";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

export function InstructorClassesPreviewSection({ instructorSlug }: { instructorSlug: string }) {
  const [templates, setTemplates] = useState<InstructorClassTemplateListResponse | null>(null);

  useEffect(() => {
    axiosInstance
      .get<InstructorClassTemplateListResponse>(
        `/public/instructors/${instructorSlug}/class-templates`,
      )
      .then((r) => setTemplates(r.data))
      .catch(() => setTemplates({ total: 0, items: [] }));
  }, [instructorSlug]);

  if (!templates || templates.items.length === 0) return null;

  const preview = templates.items.slice(0, 3);

  return (
    <>
      <section id="classes" className="mx-auto max-w-5xl px-4 py-5 scroll-mt-16">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold text-[#222222]">Zajęcia</h2>
          <span className="text-sm text-[#717171]">{classCountLabel(templates.total)}</span>
        </div>

        <div className="divide-y divide-gray-100">
          {preview.map((item) => {
            const primaryStudio = item.studios[0];
            return (
              <ClassCard
                key={item.id}
                studioSlug={primaryStudio?.slug ?? ""}
                item={item}
                studioName={primaryStudio?.name}
              />
            );
          })}
        </div>

        <Link
          href={`/instruktor/${instructorSlug}/zajecia`}
          className={cn(
            buttonVariants({ variant: "muted" }),
            "relative mt-3 h-12 w-full rounded-xl",
          )}
        >
          Zobacz wszystkie zajęcia
          <ArrowRight className="absolute right-4 h-4 w-4" />
        </Link>
      </section>
      <Separator className="w-auto" />
    </>
  );
}
