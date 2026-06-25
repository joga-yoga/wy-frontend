"use client";

import {
  Award,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  Languages,
  MapPin,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import TagYogaLotosIcon from "@/components/icons/tags/TagYogaLotosIcon";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import type {
  InstructorCertificateViewModel,
  InstructorHighlightViewModel,
  InstructorProfileViewModel,
  InstructorStyleViewModel,
} from "./viewModel";

export function InstructorHighlights({
  highlights,
}: {
  highlights: InstructorHighlightViewModel[];
}) {
  if (highlights.length === 0) return null;

  return (
    <section
      data-testid="instructor-highlights"
      className="px-[18px] py-3 md:px-8 md:py-6"
      aria-label="Najważniejsze informacje o nauczycielu jogi"
    >
      <div className="space-y-2 md:space-y-4">
        {highlights.map((item) => (
          <div
            key={item.id}
            data-testid={`instructor-highlight-${item.kind}`}
            className="flex min-w-0 items-center gap-3 text-[#717171]"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#5F5F69] md:h-8 md:w-8">
              {highlightIcon(item.kind)}
            </span>
            <span
              className="min-w-0 truncate text-[15px] font-medium leading-5 md:text-[28px] md:leading-[34px]"
              title={item.label}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function highlightIcon(kind: InstructorHighlightViewModel["kind"]) {
  const className = "h-6 w-6 md:h-8 md:w-8";

  switch (kind) {
    case "certificate":
      return <Award className={className} aria-hidden="true" />;
    case "studio":
      return <Home className={className} aria-hidden="true" />;
    case "location":
      return <MapPin className={className} aria-hidden="true" />;
    case "experience":
      return <TagYogaLotosIcon className={className} aria-hidden="true" />;
    case "language":
      return <Languages className={className} aria-hidden="true" />;
    default:
      return null;
  }
}

export function AboutInstructor({ bio }: { bio: string }) {
  const bioRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [bio]);

  useEffect(() => {
    if (expanded) return;

    const checkOverflow = () => {
      const element = bioRef.current;
      if (!element) return;
      setCanExpand(element.scrollHeight > element.clientHeight + 1);
    };

    const frameId = window.requestAnimationFrame(checkOverflow);
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [bio, expanded]);

  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby="about-instructor-title">
      <SectionHeading id="about-instructor-title">O mnie</SectionHeading>
      <p
        ref={bioRef}
        className={cn(
          "mt-4 whitespace-pre-line text-[16px] leading-[22px] text-[#222222] md:max-w-[760px] md:text-[18px] md:leading-[30px]",
          !expanded && "line-clamp-5",
        )}
      >
        {bio}
      </p>
      {!expanded && canExpand && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-m-header text-[#222222] underline underline-offset-2"
        >
          Czytaj dalej
        </button>
      )}
    </section>
  );
}

export function InstructorLanguages({
  languages,
}: {
  languages: InstructorProfileViewModel["languages"];
}) {
  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby="instructor-languages-title">
      <SectionHeading
        id="instructor-languages-title"
        icon={<Languages className="h-5 w-5" aria-hidden="true" />}
      >
        Języki
      </SectionHeading>
      <div className="mt-4 flex flex-wrap gap-2">
        {languages.map((language) => (
          <span
            key={language.code}
            className="rounded-full border border-[#D9D9D9] bg-[#F7F7F7] px-3 py-1 text-[13px] font-medium leading-5 text-[#444444]"
          >
            {language.label}
          </span>
        ))}
      </div>
    </section>
  );
}

export function InstructorExperience({ items }: { items: InstructorStyleViewModel[] }) {
  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby="instructor-experience-title">
      <SectionHeading
        id="instructor-experience-title"
        icon={<TagYogaLotosIcon className="h-5 w-5" aria-hidden="true" />}
      >
        Doświadczenie
      </SectionHeading>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B0B0B0]" />
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold leading-5 text-[#222222]">{item.name}</h3>
              {item.description && (
                <p className="mt-1 text-[15px] leading-[22px] text-[#717171]">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InstructorCertificates({
  certificates,
}: {
  certificates: InstructorCertificateViewModel[];
}) {
  const visibleCertificates =
    certificates.length > 0
      ? certificates
      : [
          { name: "Miejsce na certyfikat", imageId: null },
          { name: "Miejsce na szkolenie", imageId: null },
          { name: "Miejsce na edukację", imageId: null },
        ];

  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby="instructor-certificates-title">
      <SectionHeading
        id="instructor-certificates-title"
        icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
      >
        Certyfikaty i wykształcenie
      </SectionHeading>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {visibleCertificates.map((certificate, index) => (
          <article
            key={`${certificate.name}-${index}`}
            className="flex items-center gap-3 rounded-2xl border border-[#EBEBEB] bg-white p-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F1F1F1] text-[#717171]">
              <Award className="h-5 w-5" />
            </div>
            <p className="min-w-0 text-[15px] font-semibold leading-5 text-[#222222]">
              {certificate.name}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function InstructorGallery({ imageIds }: { imageIds: string[] }) {
  const visibleImageIds = imageIds.slice(0, 4);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openPhoto = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby="instructor-gallery-title">
      <SectionHeading id="instructor-gallery-title">Galeria</SectionHeading>
      <div className="mt-4 grid grid-cols-2 gap-2 md:max-w-[560px] md:gap-3">
        {visibleImageIds.map((imageId, index) => (
          <button
            key={`${imageId}-${index}`}
            type="button"
            onClick={() => openPhoto(index)}
            className="relative aspect-square overflow-hidden rounded-lg bg-[#F7F7F7]"
            aria-label={`Otwórz zdjęcie ${index + 1}`}
          >
            <WyImage
              src={imageId}
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 768px) 274px, 50vw"
            />
          </button>
        ))}
      </div>

      <PhotoLightbox
        imageIds={visibleImageIds}
        initialIndex={activeIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
  );
}

function SectionHeading({
  id,
  icon,
  children,
}: {
  id: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F7] text-[#444444]">
          {icon}
        </span>
      )}
      <h2 id={id} className="text-[22px] font-semibold leading-[30px] text-[#222222]">
        {children}
      </h2>
    </div>
  );
}

function PhotoLightbox({
  imageIds,
  initialIndex,
  open,
  onClose,
}: {
  imageIds: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  if (imageIds.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + imageIds.length) % imageIds.length);
  const next = () => setIndex((i) => (i + 1) % imageIds.length);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-full max-w-[390px] border-none bg-black/95 p-0 [&>button]:hidden">
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60"
            aria-label="Zamknij galerię"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          <div className="relative aspect-square w-full">
            <WyImage src={imageIds[index]} alt="" fill className="object-contain" sizes="390px" />
          </div>

          {imageIds.length > 1 && (
            <div className="flex items-center gap-4 py-4">
              <button
                type="button"
                onClick={prev}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
                aria-label="Poprzednie zdjęcie"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <span className="text-xs text-white/60">
                {index + 1} / {imageIds.length}
              </span>
              <button
                type="button"
                onClick={next}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
                aria-label="Następne zdjęcie"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
