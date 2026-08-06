"use client";

import { Award, GraduationCap, Languages, MapPin } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { PhotoGallery } from "@/components/custom/PhotoGallery";
import { WyImage } from "@/components/custom/WyImage";
import TagYogaLotosIcon from "@/components/icons/tags/TagYogaLotosIcon";
import { scrollTo } from "@/lib/scrollTo";
import { cn } from "@/lib/utils";

import type {
  InstructorCertificateViewModel,
  InstructorHighlightViewModel,
  InstructorProfileViewModel,
  InstructorStyleViewModel,
} from "./viewModel";

/** Section ids that each highlight kind scrolls to when clicked. `location`/`language`
 * have no corresponding section on the page and stay non-interactive. */
const HIGHLIGHT_SCROLL_TARGETS: Partial<Record<InstructorHighlightViewModel["kind"], string>> = {
  certificate: "certificates",
  experience: "experience",
};

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
        {highlights.map((item) => {
          const targetId = HIGHLIGHT_SCROLL_TARGETS[item.kind];
          const isInteractive = Boolean(targetId);

          return (
            <div
              key={item.id}
              data-testid={`instructor-highlight-${item.kind}`}
              role={isInteractive ? "button" : undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={isInteractive ? () => scrollTo(targetId!) : undefined}
              onKeyDown={
                isInteractive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") scrollTo(targetId!);
                    }
                  : undefined
              }
              className={cn(
                "flex min-w-0 items-center gap-3 text-[#717171]",
                isInteractive && "cursor-pointer",
              )}
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
          );
        })}
      </div>
    </section>
  );
}

function highlightIcon(kind: InstructorHighlightViewModel["kind"]) {
  const className = "h-6 w-6 md:h-8 md:w-8";

  switch (kind) {
    case "certificate":
      return <Award className={className} aria-hidden="true" />;
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
    <section
      id="experience"
      className="scroll-mt-16 px-4 py-7 md:px-8 md:py-10"
      aria-labelledby="instructor-experience-title"
    >
      <SectionHeading
        id="instructor-experience-title"
        icon={<TagYogaLotosIcon className="h-5 w-5" aria-hidden="true" />}
      >
        Style, których uczę
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
  return (
    <section
      id="certificates"
      className="scroll-mt-16 px-4 py-7 md:px-8 md:py-10"
      aria-labelledby="instructor-certificates-title"
    >
      <SectionHeading
        id="instructor-certificates-title"
        icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
      >
        Certyfikaty i wykształcenie
      </SectionHeading>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {certificates.map((certificate, index) => (
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
  return (
    <section className="px-4 py-7 md:px-8 md:py-10" aria-labelledby="instructor-gallery-title">
      <SectionHeading id="instructor-gallery-title">Galeria</SectionHeading>
      <PhotoGallery
        images={imageIds}
        alt="Zdjęcie z galerii nauczyciela"
        variant="grid"
        className="mt-4"
      />
    </section>
  );
}

export function SectionHeading({
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
