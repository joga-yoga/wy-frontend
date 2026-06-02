"use client";

import { Award, ChevronLeft, ChevronRight, Globe, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { CertificateItem, InstructorPublic, InstructorYogaStyle } from "@/types/instructor";

const LANGUAGE_FULL: Record<string, string> = {
  pl: "Polski",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  uk: "Українська",
  cs: "Čeština",
  sk: "Slovenčina",
  nl: "Nederlands",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
};

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="px-4 pt-7 pb-4">
      <h2 className="text-[22px] font-semibold" style={{ color: "#222222" }}>
        {label}
      </h2>
    </div>
  );
}

function SubLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-7 pb-3 text-[18px] font-semibold" style={{ color: "#222222" }}>
      {label}
    </p>
  );
}

function BioBlock({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // Measure once after mount (and if bio changes). Line-clamp is active on first render
  // so scrollHeight > clientHeight correctly detects overflow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight);
  }, [bio]);

  return (
    <div className="px-4 pt-1">
      <p
        ref={ref}
        className={`text-[15px] leading-[1.65]${!expanded ? " line-clamp-4" : ""}`}
        style={{ color: "#222222" }}
      >
        {bio}
      </p>
      {!expanded && isClamped && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-sm font-medium underline underline-offset-2"
          style={{ color: "#717171" }}
        >
          Czytaj dalej
        </button>
      )}
    </div>
  );
}

function LanguagesBlock({ languages }: { languages: string[] }) {
  if (languages.length === 0) return null;
  return (
    <div className="px-4 pt-5">
      <div className="flex items-center gap-1.5 mb-3">
        <Globe className="h-4 w-4" style={{ color: "#717171" }} />
        <p className="text-sm font-semibold" style={{ color: "#444444" }}>
          Prowadzę zajęcia w językach
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages.map((code) => (
          <span
            key={code}
            className="text-[13px] font-medium px-3 py-1 rounded-full"
            style={{ background: "#F7F7F7", border: "1px solid #D9D9D9", color: "#444444" }}
          >
            {LANGUAGE_FULL[code] ?? code.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

function YogaStyleCard({ style }: { style: InstructorYogaStyle }) {
  const name = style.yoga_style?.name ?? style.custom_name ?? "";
  if (!name) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <span
        className="mt-[7px] h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ background: "#B0B0B0" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-tight" style={{ color: "#222222" }}>
          {name}
        </p>
        {style.description && (
          <p className="text-sm mt-1 leading-snug" style={{ color: "#717171" }}>
            {style.description}
          </p>
        )}
      </div>
    </div>
  );
}

function CertificateRow({ cert, onOpen }: { cert: CertificateItem; onOpen: () => void }) {
  return (
    <button
      onClick={cert.image_id ? onOpen : undefined}
      className="flex items-center gap-3 px-4 py-2.5 w-full text-left"
      disabled={!cert.image_id}
    >
      <div
        className="relative flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden"
        style={{ background: "#F7F7F7", border: "1px solid #EBEBEB" }}
      >
        {cert.image_id ? (
          <WyImage src={cert.image_id} alt={cert.name} fill className="object-cover" sizes="40px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Award className="h-4 w-4" style={{ color: "#B0B0B0" }} />
          </div>
        )}
      </div>
      <p className="text-[15px] flex-1 min-w-0 truncate" style={{ color: "#222222" }}>
        {cert.name}
      </p>
    </button>
  );
}

function PhotoGrid({ photoIds, onOpen }: { photoIds: string[]; onOpen: (index: number) => void }) {
  const maxCells = 6;
  const hasMore = photoIds.length > maxCells;
  const cells = hasMore ? photoIds.slice(0, 5) : photoIds.slice(0, maxCells);

  return (
    <div className="px-4 pt-2 pb-4 grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
      {cells.map((id, i) => (
        <button
          key={id}
          onClick={() => onOpen(i)}
          className="relative aspect-square rounded-lg overflow-hidden"
          style={{ background: "#F7F7F7" }}
        >
          <WyImage
            src={id}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 640px) 160px, 120px"
          />
        </button>
      ))}
      {hasMore && (
        <button
          onClick={() => onOpen(5)}
          className="relative aspect-square rounded-lg overflow-hidden flex items-center justify-center"
          style={{ background: "#F7F7F7" }}
        >
          <WyImage
            src={photoIds[5]}
            alt=""
            fill
            className="object-cover opacity-40"
            sizes="(min-width: 640px) 160px, 120px"
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
            style={{ color: "#222222" }}
          >
            +{photoIds.length - 5}
          </span>
        </button>
      )}
    </div>
  );
}

function PhotoLightbox({
  photoIds,
  initialIndex,
  open,
  onClose,
}: {
  photoIds: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const prev = () => setIndex((i) => (i - 1 + photoIds.length) % photoIds.length);
  const next = () => setIndex((i) => (i + 1) % photoIds.length);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 border-none max-w-[390px] w-full bg-black/95 [&>button]:hidden">
        <div className="relative flex flex-col items-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <X className="h-4 w-4 text-white" />
          </button>

          <div className="relative w-full aspect-square">
            {photoIds[index] && (
              <WyImage src={photoIds[index]} alt="" fill className="object-contain" sizes="390px" />
            )}
          </div>

          {photoIds.length > 1 && (
            <div className="flex items-center gap-4 py-4">
              <button
                onClick={prev}
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <span className="text-xs text-white/60">
                {index + 1} / {photoIds.length}
              </span>
              <button
                onClick={next}
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
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

function CertLightbox({
  cert,
  open,
  onClose,
}: {
  cert: CertificateItem | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!cert?.image_id) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 border-none max-w-[390px] w-full bg-black/95 [&>button]:hidden">
        <div className="relative flex flex-col items-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="relative w-full aspect-square">
            <WyImage
              src={cert.image_id}
              alt={cert.name}
              fill
              className="object-contain"
              sizes="390px"
            />
          </div>
          <p className="text-white/80 text-sm py-4 px-4 text-center">{cert.name}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AboutSectionProps {
  instructor: InstructorPublic;
}

export function AboutSection({ instructor }: AboutSectionProps) {
  const languages = instructor.languages ?? [];
  const yogaStyles = instructor.yoga_styles ?? [];
  const certificates = instructor.certificates ?? [];
  const photoIds = instructor.photo_ids ?? [];

  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [photoLightboxIndex, setPhotoLightboxIndex] = useState(0);
  const [certLightboxOpen, setCertLightboxOpen] = useState(false);
  const [activeCert, setActiveCert] = useState<CertificateItem | null>(null);

  const openPhoto = (i: number) => {
    setPhotoLightboxIndex(i);
    setPhotoLightboxOpen(true);
  };

  const openCert = (cert: CertificateItem) => {
    setActiveCert(cert);
    setCertLightboxOpen(true);
  };

  return (
    <div>
      <SectionDivider label="O mnie" />

      {instructor.description && <BioBlock bio={instructor.description} />}

      {languages.length > 0 && <LanguagesBlock languages={languages} />}

      {yogaStyles.length > 0 && (
        <>
          <SubLabel label="Co prowadzę" />
          {yogaStyles.map((style) => (
            <YogaStyleCard key={style.id} style={style} />
          ))}
        </>
      )}

      {certificates.length > 0 && (
        <>
          <SubLabel label="Certyfikaty i wykształcenie" />
          {certificates.map((cert, i) => (
            <CertificateRow key={`${cert.name}-${i}`} cert={cert} onOpen={() => openCert(cert)} />
          ))}
        </>
      )}

      {photoIds.length > 0 && (
        <>
          <SubLabel label="Galeria" />
          <PhotoGrid photoIds={photoIds} onOpen={openPhoto} />
        </>
      )}

      <PhotoLightbox
        photoIds={photoIds}
        initialIndex={photoLightboxIndex}
        open={photoLightboxOpen}
        onClose={() => setPhotoLightboxOpen(false)}
      />

      <CertLightbox
        cert={activeCert}
        open={certLightboxOpen}
        onClose={() => setCertLightboxOpen(false)}
      />
    </div>
  );
}
