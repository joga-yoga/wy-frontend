"use client";

import { Calendar, MapPin, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { HashedAvatar } from "@/components/common/HashedAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { axiosInstance } from "@/lib/axiosInstance";
import type { InstructorProfile } from "@/types/instructor";

interface PublicStudio {
  id: string;
  name: string;
}

interface PublicPreview {
  upcomingCount: number;
  studios: PublicStudio[];
}

/**
 * Header avatar — the partner's Instructor public persona, never account data
 * (spec-b2b §6: Partner is auth/back-office only). Drawer previews the public
 * surface; account settings live in Menu (T09), not here.
 */
export function HeaderAvatar() {
  const [instructor, setInstructor] = useState<InstructorProfile | null | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [preview, setPreview] = useState<PublicPreview | null>(null);

  useEffect(() => {
    axiosInstance
      .get<InstructorProfile[]>("/instructors")
      .then((r) => {
        // `/instructors` returns every instructor this partner manages, including stubs
        // created for (and still only invited to) someone else's email. The header must
        // only ever show the partner's own claimed persona — never a profile pending
        // someone else's claim — so this mirrors the backend's own `get_self_instructor`
        // rule: managed by this partner AND actually claimed.
        setInstructor(r.data.find((i) => i.claimed_at !== null) ?? null);
      })
      .catch(() => setInstructor(null));
  }, []);

  useEffect(() => {
    if (!isOpen || !instructor?.slug) return;
    let cancelled = false;
    Promise.all([
      axiosInstance.get(`/instructor/${instructor.slug}`).catch(() => null),
      axiosInstance
        .get<PublicStudio[]>(`/public/instructors/${instructor.slug}/studios`)
        .catch(() => ({ data: [] })),
    ]).then(([pageRes, studiosRes]) => {
      if (cancelled) return;
      const upcomingCount = pageRes
        ? (pageRes.data.upcoming_retreats?.length ?? 0) +
          (pageRes.data.upcoming_workshops?.length ?? 0) +
          (pageRes.data.upcoming_courses?.length ?? 0)
        : 0;
      setPreview({ upcomingCount, studios: studiosRes?.data ?? [] });
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, instructor?.slug]);

  function openDrawer() {
    setIsOpen(true);
  }

  if (instructor === undefined) {
    return <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100" />;
  }

  return (
    <>
      <button onClick={openDrawer} aria-label="Twój profil instruktora" className="shrink-0">
        {instructor ? (
          <HashedAvatar
            seed={instructor.id}
            name={instructor.name}
            imageId={instructor.image_id}
            size={40}
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-300">
            <User size={18} />
          </div>
        )}
      </button>

      <Drawer open={isOpen} onOpenChange={setIsOpen} showSwipeHandle>
        <DrawerContent className="sm:mx-auto sm:max-w-md">
          {instructor ? (
            <>
              <DrawerHeader className="flex-row items-center justify-between">
                <DrawerTitle className="sr-only">Twój profil instruktora</DrawerTitle>
                <DrawerClose className="text-sm text-muted-foreground">Zamknij</DrawerClose>
                {/* V3's caption: "Ten sam edytor, którym manager edytuje stuby (R5)" —
                    one editor, not a drawer-sized copy of it. A profile with certificates,
                    a gallery and social links does not belong in a bottom sheet. */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/konto/partner/instruktorzy/${instructor.id}/edit`);
                  }}
                  className="text-sm font-semibold text-b2b-green-strong"
                >
                  Edytuj
                </button>
              </DrawerHeader>
              <div className="space-y-5 px-4 pb-6 text-center">
                <HashedAvatar
                  seed={instructor.id}
                  name={instructor.name}
                  imageId={instructor.image_id}
                  size={96}
                  className="mx-auto"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{instructor.name}</p>
                  {instructor.yoga_styles.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      {instructor.yoga_styles.map((s, i) => (
                        <Badge key={i} variant="secondary">
                          {s.yoga_style?.name ?? s.custom_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {instructor.short_bio && (
                  <p className="text-sm text-gray-600">{instructor.short_bio}</p>
                )}
                {instructor.slug && (
                  <a
                    href={`/instruktor/${instructor.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium text-brand-blue hover:underline"
                  >
                    joga.yoga/i/{instructor.slug}
                  </a>
                )}

                <div className="space-y-2 pt-2 text-left">
                  <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
                    <Calendar size={18} className="shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">Nadchodzące wydarzenia</p>
                      <p className="text-xs text-gray-500">
                        {preview || !instructor.slug
                          ? `${preview?.upcomingCount ?? 0} opublikowane`
                          : "Ładowanie..."}
                      </p>
                    </div>
                  </div>
                  {preview && preview.studios.length > 0 && (
                    <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
                      <MapPin size={18} className="shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">Prowadzi zajęcia w</p>
                        <p className="text-xs text-gray-500 truncate">
                          {preview.studios.map((s) => s.name).join(" · ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <DrawerHeader>
                <DrawerTitle className="sr-only">Pokaż się uczniom</DrawerTitle>
                <DrawerDescription className="sr-only">
                  Utwórz publiczny profil instruktora
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 px-4 pb-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-300">
                  <User size={28} />
                </div>
                <div className="space-y-1">
                  <p className="flex items-center justify-center gap-1.5 text-lg font-semibold text-gray-900">
                    <Sparkles size={16} className="text-brand-green-700" />
                    Pokaż się uczniom
                  </p>
                  <p className="text-sm text-gray-500">
                    Publiczny profil instruktora możesz utworzyć w każdej chwili — zdjęcie, bio,
                    style, Twoje wydarzenia i grafik zajęć. Twoja wizytówka z linkiem do
                    udostępniania.
                  </p>
                </div>
                <Link href="/konto/partner/instruktorzy/create" onClick={() => setIsOpen(false)}>
                  <Button variant="green" className="w-full rounded-full">
                    Utwórz profil instruktora
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
