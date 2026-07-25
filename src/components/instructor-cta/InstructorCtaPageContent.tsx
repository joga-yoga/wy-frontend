"use client";

import type { AxiosError } from "axios";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { JogaYogaLogo } from "@/components/brand/JogaYogaLogo";
import { WyImage } from "@/components/custom/WyImage";
import {
  type CtaPageProperty,
  type CtaProcessStep,
  PagePropertiesGrid,
  ProcessSteps,
  SectionDivider,
} from "@/components/event-cta/EventCtaShared";
import {
  BenefitCalendarIcon,
  CertificatesPropertyIcon,
  ContactPropertyIcon,
  DescriptionPropertyIcon,
  DraftProcessIcon,
  EventsPropertyIcon,
  GalleryPropertyIcon,
  RegisterProcessIcon,
  RetreatsPropertyIcon,
  SchedulePropertyIcon,
  SearchProcessIcon,
  StylesPropertyIcon,
} from "@/components/instructor-cta/InstructorCtaIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FEATURED_INSTRUCTOR } from "@/config/instructorCta";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { GeneratedInstructorProfileDraft, InstructorPublicListItem } from "@/types/instructor";

type GenerateDraftErrorResponse = {
  detail?:
    | {
        code?: string;
        message?: string;
      }
    | string;
};

const rotatingStatuses = [
  "Sprawdzamy źródła publiczne",
  "To może zająć około 2 min. 🙏",
  "Szukamy zdjęć",
  "Tworzymy przykładową stronę",
];

const processSteps: CtaProcessStep[] = [
  {
    title: "Sprawdzimy publiczne informacje",
    description: (
      <>
        <span className="md:hidden">Sprawdzamy informacje dostępne w sieci</span>
        <span className="hidden md:inline">Wyszukiwanie informacji w źródłach otwartych</span>
      </>
    ),
    icon: SearchProcessIcon,
  },
  {
    title: "Przygotujemy szkic strony",
    description: "Ułożymy znalezione informacje w prostą stronę, którą możesz poprawić",
    icon: DraftProcessIcon,
  },
  {
    title: "Rejestracja",
    description: "Załóż konto i zacznij zarządzać swoją stroną",
    icon: RegisterProcessIcon,
  },
];

const pageProperties: CtaPageProperty[] = [
  { title: "Krótki opis", icon: DescriptionPropertyIcon },
  { title: "Harmonogram zajęć", icon: SchedulePropertyIcon },
  { title: "Tworzenie wyjazdów jogowych", icon: RetreatsPropertyIcon },
  { title: "Publikacja wydarzenia z jogą", icon: EventsPropertyIcon },
  { title: "Certyfikaty i wykształcenie", icon: CertificatesPropertyIcon },
  { title: "Style jogi i doświadczenie", icon: StylesPropertyIcon },
  { title: "Galeria zdjęć", icon: GalleryPropertyIcon },
  { title: "Kontakt lub zapisy", icon: ContactPropertyIcon },
];

export function InstructorCtaPageContent({
  additionalInstructors,
}: {
  additionalInstructors: InstructorPublicListItem[];
}) {
  const router = useRouter();
  const [profileQuery, setProfileQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generateDraft = async () => {
    const input = profileQuery.trim();
    if (!input || isGenerating) {
      setGenerationError("Podaj imię i nazwisko albo link do swojego profilu.");
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);

    try {
      const { data } = await axiosInstance.post<GeneratedInstructorProfileDraft>(
        "/instructor-profile-drafts/generate",
        { input },
      );
      router.push(`/instruktor/dodaj/preview/${data.public_token}`);
    } catch (error) {
      setGenerationError(getGenerateDraftErrorMessage(error));
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return <InstructorGenerationScreen />;
  }

  return (
    <main className="overflow-x-hidden bg-white text-[#3F3F46]">
      <HeroSection
        value={profileQuery}
        error={generationError}
        onChange={(value) => {
          setProfileQuery(value);
          if (generationError) setGenerationError(null);
        }}
        onSubmit={generateDraft}
      />
      <SectionDivider className="md:h-[72px] md:px-[10px]" />
      <div className="px-6 py-6 md:hidden">
        <InstructorDraftForm
          id="instructor-query-mobile"
          value={profileQuery}
          error={generationError}
          onChange={(value) => {
            setProfileQuery(value);
            if (generationError) setGenerationError(null);
          }}
          onSubmit={generateDraft}
          variant="mobile"
        />
      </div>
      <SectionDivider className="md:hidden" />
      <ProcessSection />
      <SectionDivider className="md:h-[72px] md:px-[10px]" />
      <BenefitsSection />
      <SectionDivider className="md:h-[72px] md:px-[10px]" />
      <PropertiesSection />
      <SectionDivider className="md:h-[72px] md:px-[10px]" />
      <InstructorExamplesSection additionalInstructors={additionalInstructors} />
      <SectionDivider className="md:hidden" />
    </main>
  );
}

function getGenerateDraftErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<GenerateDraftErrorResponse>;
  const detail = axiosError.response?.data?.detail;

  if (
    axiosError.response?.status === 422 &&
    typeof detail === "object" &&
    detail?.code === "teacher_profile_not_found" &&
    detail.message
  ) {
    return detail.message;
  }

  return "Nie udało się przygotować profilu. Spróbuj ponownie.";
}

function HeroSection({
  value,
  error,
  onChange,
  onSubmit,
}: {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="relative h-[430px] overflow-hidden rounded-b-lg rounded-t-[22px] md:h-[720px] md:rounded-none">
      <Image
        src="/images/cta/instructors/hero.png"
        alt="Nauczycielka jogi podczas spokojnej praktyki"
        fill
        priority
        unoptimized
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="relative flex h-full flex-col items-center px-[75px] pt-[68px] md:px-[120px] md:py-20">
        <JogaYogaLogo
          variant="on-dark"
          size="desktop"
          className="[&_img:first-child]:!size-8 [&_img:last-child]:!h-[22px] [&_img:last-child]:!w-[88px] md:[&_img:first-child]:!size-[65px] md:[&_img:last-child]:!h-[43px] md:[&_img:last-child]:!w-[175px]"
        />

        <div className="mt-[75px] flex w-full flex-col items-center text-center text-white md:mt-16 md:flex-row md:justify-center md:gap-[120px] md:text-left">
          <div className="w-[252px] md:w-[357px]">
            <h1 className="text-[32px] font-semibold leading-[30px] tracking-[-0.64px] md:text-[46px] md:leading-[50px] md:tracking-[-1.38px]">
              Tworzenie strony nauczyciela jogi
            </h1>
            <p className="mx-auto mt-2 w-[164px] text-[15px] leading-[18px] text-[#F2F2F3] md:mx-0 md:mt-6 md:w-full md:text-[22px] md:font-medium md:leading-[30px] md:tracking-[-0.44px] md:text-white/90">
              Opowiedz o sobie, pokaż zajęcia i ułatw ludziom zapis
            </p>
          </div>

          <div className="hidden md:block">
            <InstructorDraftForm
              id="instructor-query-desktop"
              value={value}
              error={error}
              onChange={onChange}
              onSubmit={onSubmit}
              variant="desktop"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function InstructorDraftForm({
  id,
  value,
  error,
  onChange,
  onSubmit,
  variant,
}: {
  id: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  variant: "mobile" | "desktop";
}) {
  const reduceMotion = useReducedMotion();
  const errorId = `${id}-error`;
  const isDesktop = variant === "desktop";

  return (
    <form
      className={cn(
        "bg-[#FAFAFA]",
        isDesktop
          ? "flex w-[518px] flex-col gap-[22px] rounded-2xl p-8 text-left"
          : "mx-auto flex min-h-[259px] w-full max-w-[354px] flex-col rounded-2xl p-6 shadow-[0_6px_18px_rgba(39,39,42,0.12)]",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
      aria-label="Generator strony nauczyciela jogi"
    >
      <div className={cn(isDesktop ? "" : "mb-6")}>
        <h2
          className={cn(
            "font-semibold text-[#52525B]",
            isDesktop
              ? "w-[340px] text-[30px] leading-[30px] tracking-[-0.6px]"
              : "text-[24px] leading-[30px] tracking-[-0.48px]",
          )}
        >
          Sprawdź, jak może wyglądać Twoja strona
        </h2>
        {!isDesktop && (
          <p className="mt-2 text-[15px] font-medium leading-[18px] text-[#71717A]">
            Wpisz imię i nazwisko
          </p>
        )}
      </div>

      <div className={cn("relative", isDesktop ? "" : "mb-6")}>
        <label htmlFor={id} className="sr-only">
          Podaj imię, nazwisko, nazwę profilu lub link
        </label>
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={isDesktop ? "" : "np. Anna Kowalska"}
          autoComplete="name"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "border-[#71717A] bg-white font-medium text-[#3F3F46] shadow-none placeholder:text-[#D4D4D8] focus-visible:ring-[#52525B]/20",
            isDesktop
              ? "h-11 rounded-xl px-[10px] text-[18px] leading-7"
              : "h-9 rounded-lg px-[10px] text-[15px] leading-[18px]",
          )}
        />
        {isDesktop && !value && (
          <motion.span
            className="pointer-events-none absolute left-[10px] top-2 text-[18px] font-medium leading-7 text-[#D4D4D8]"
            initial={false}
            animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 5,
                    times: [0, 0.1918, 0.1919, 1],
                    ease: "linear",
                    repeat: Infinity,
                  }
            }
          >
            np. Anna Kowalska
          </motion.span>
        )}
        {isDesktop && (
          <p className="mt-2 text-[18px] font-medium leading-[22px] tracking-[-0.36px] text-[#71717A]">
            Wpisz imię i nazwisko
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 text-[13px] font-medium leading-4 text-red-600"
          >
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className={cn(
          "w-full bg-[#3F3F46] font-medium text-white hover:bg-[#323238]",
          isDesktop
            ? "h-11 rounded-[22px] text-[20px] leading-[17px]"
            : "mt-auto h-[33px] rounded-[18px] text-[15px] leading-[17px]",
        )}
      >
        Zobacz szkic strony
      </Button>
    </form>
  );
}

function ProcessSection() {
  return (
    <section aria-labelledby="instructor-process-title" className="px-8 md:h-[158px] md:px-20">
      <h2
        id="instructor-process-title"
        className="text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:text-[30px] md:tracking-[-0.6px]"
      >
        Co będzie dalej:
      </h2>
      <ProcessSteps
        steps={processSteps}
        className="mt-4 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-10"
        itemClassName="gap-3 md:gap-4"
        titleClassName="text-[15px] font-medium leading-7 text-[#3F3F46] md:text-[22px] md:leading-[30px] md:tracking-[-0.44px]"
        descriptionClassName="text-[15px] font-medium leading-[18px] text-[#71717A] md:text-[20px] md:leading-[25px] md:tracking-[-0.2px]"
      />
    </section>
  );
}

function BenefitCopy({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-[18px] font-medium leading-7 text-[#27272A] md:text-[24px] md:leading-5 md:tracking-[-0.24px]">
        {title}
      </h3>
      <p className="text-[15px] font-medium leading-[22px] text-[#71717A] md:mt-1 md:text-[20px] md:leading-[25px] md:tracking-[-0.2px]">
        {description}
      </p>
    </div>
  );
}

function BenefitsSection() {
  return (
    <section aria-labelledby="instructor-benefits-title">
      <h2
        id="instructor-benefits-title"
        className="px-8 text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:hidden"
      >
        Co daje strona na joga.yoga?
      </h2>

      <div className="mt-4 rounded-[24px] bg-[#F2F2F3] px-8 py-8 md:mt-0 md:flex md:h-[766px] md:flex-col md:gap-16 md:px-24 md:py-9">
        <h2 className="hidden text-[30px] font-semibold leading-[30px] tracking-[-0.6px] text-[#3F3F46] md:block">
          Strona na joga.yoga to:
        </h2>

        <div className="grid gap-6 md:grid-cols-[600px_minmax(0,1fr)] md:items-center md:gap-20">
          <div className="relative h-[229px] overflow-hidden rounded-xl md:h-[600px] md:rounded-[32px]">
            <Image
              src="/images/cta/instructors/benefits.png"
              alt="Nauczycielka przeglądająca stronę joga.yoga"
              fill
              unoptimized
              className="object-cover"
              sizes="(min-width: 768px) 600px, 338px"
            />
          </div>

          <div className="grid gap-4 md:gap-6">
            <BenefitCopy
              title="Profesjonalny profil nauczyciela"
              description="Studia, certyfikaty, style jogi, warsztaty i wyjazdy są w jednym miejscu"
            />
            <BenefitCopy
              title="Twórz i sprzedawaj swoje wydarzenia"
              description="Warsztaty, kursy i wyjazdy z łatwą rejestracją"
            />
            <div className="flex items-center gap-6 rounded-xl border border-[#D4D4D8] bg-white px-6 py-4">
              <BenefitCalendarIcon className="size-8 shrink-0 md:size-11" aria-hidden="true" />
              <BenefitCopy
                title="Jeden grafik z różnych miejsc"
                description="Połącz zajęcia z kilku studiów w jeden grafik"
              />
            </div>
            <BenefitCopy
              title="Widoczność w mieście"
              description="Zajęcia łatwo znaleźć lokalnie"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PropertiesSection() {
  return (
    <section aria-labelledby="instructor-properties-title" className="px-8 md:h-[278px] md:px-24">
      <h2
        id="instructor-properties-title"
        className="text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:text-[30px] md:tracking-[-0.6px]"
      >
        Co zawiera Twoja strona
      </h2>
      <PagePropertiesGrid
        properties={pageProperties}
        className="mt-4 grid gap-y-2 md:mt-12 md:grid-cols-2 md:gap-x-4 md:gap-y-6"
        itemClassName="gap-4"
        iconClassName="size-6 md:size-8"
        textClassName="text-[15px] font-medium leading-[18px] text-[#71717A] md:text-[20px] md:leading-[25px] md:tracking-[-0.2px]"
      />
    </section>
  );
}

function InstructorExamplesSection({
  additionalInstructors,
}: {
  additionalInstructors: InstructorPublicListItem[];
}) {
  return (
    <section aria-labelledby="instructor-examples-title" className="pb-0 md:px-20 md:pb-[120px]">
      <div className="leading-[30px]">
        <h2
          id="instructor-examples-title"
          className="text-[30px] font-semibold tracking-[-0.6px] text-[#3F3F46]"
        >
          Strony innych nauczycieli
        </h2>
        <p className="mt-2 text-[22px] font-medium tracking-[-0.44px] text-[#71717A]">
          Można zobaczyć, jak wyglądają strony innych nauczycieli na joga.yoga
        </p>
      </div>

      <div className="mt-4 grid gap-[18px] md:mt-16 md:max-w-[1200px] md:grid-cols-3 md:gap-10">
        <InstructorExampleCard
          name={FEATURED_INSTRUCTOR.name}
          subtitle={FEATURED_INSTRUCTOR.subtitle}
          href={FEATURED_INSTRUCTOR.href}
          localImageSrc={FEATURED_INSTRUCTOR.imageSrc}
        />
        {additionalInstructors.slice(0, 2).map((instructor) => (
          <InstructorExampleCard
            key={instructor.slug}
            name={instructor.name}
            subtitle={getInstructorSubtitle(instructor)}
            href={`/instruktor/${instructor.slug}`}
            imageId={instructor.image_id}
          />
        ))}
      </div>
    </section>
  );
}

function getInstructorSubtitle(instructor: InstructorPublicListItem) {
  const yogaStyle =
    instructor.yoga_styles?.[0]?.custom_name ??
    instructor.yoga_styles?.[0]?.yoga_style?.name ??
    null;
  const city = instructor.cities?.[0]?.name ?? null;
  return [yogaStyle, city].filter(Boolean).join(" · ");
}

function InstructorExampleCard({
  name,
  subtitle,
  href,
  imageId,
  localImageSrc,
}: {
  name: string;
  subtitle: string;
  href: string;
  imageId?: string;
  localImageSrc?: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[398px] flex-col gap-5 rounded-[24px] border border-[#E4E4E7] bg-white p-6 shadow-[0_10px_10px_rgba(0,0,0,0.03)]"
    >
      <div className="relative h-60 w-full overflow-hidden rounded-2xl bg-[#F2F2F3]">
        {localImageSrc ? (
          <Image
            src={localImageSrc}
            alt={name}
            fill
            unoptimized
            className="object-cover"
            sizes="(min-width: 768px) 326px, 354px"
          />
        ) : imageId ? (
          <WyImage
            src={imageId}
            alt={name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 326px, 354px"
          />
        ) : null}
      </div>
      <div>
        <h3 className="text-[22px] font-medium leading-[30px] tracking-[-0.44px] text-[#3F3F46]">
          {name}
        </h3>
        {subtitle && <p className="text-[15px] leading-[18px] text-[#71717A]">{subtitle}</p>}
      </div>
      <span className="mt-auto flex items-center gap-2 text-[15px] font-medium leading-[18px] text-[#52525B]">
        Zobacz stronę
        <Image
          src="/images/cta/instructors/icons/card-arrow.svg"
          alt=""
          width={14}
          height={14}
          className="size-[14px]"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function InstructorGenerationScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F7F7F7] px-4 py-10 text-[#3F3F46]">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
        className="flex min-h-[577px] w-full max-w-[402px] flex-col items-center gap-9 rounded-[34px] border border-[#E4E4E7] bg-white px-6 pb-9 pt-[66px]"
        aria-live="polite"
        aria-label="Tworzenie szkicu strony nauczyciela"
      >
        <div className="h-[50px] w-full text-center text-[46px] font-semibold leading-[50px] text-[#27272A]">
          🙋
        </div>

        <div className="flex w-[294px] flex-col items-center gap-[18px]">
          <h1 className="w-[294px] text-center text-[46px] font-semibold leading-[50px] text-[#52525B]">
            Proces tworzenia
          </h1>
          <AnimatedStatusText />
        </div>

        <GenerationAnimation />
      </motion.section>
    </main>
  );
}

function AnimatedStatusText() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % rotatingStatuses.length);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="relative h-[25px] w-[294px] overflow-hidden text-center text-[20px] font-medium leading-[25px] text-[#71717A]">
      <AnimatePresence mode="wait">
        <motion.p
          key={rotatingStatuses[statusIndex]}
          className="absolute inset-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
        >
          {rotatingStatuses[statusIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function GenerationAnimation() {
  return (
    <div className="relative h-[210px] w-[310px] overflow-hidden bg-[#EFEFF1]">
      <motion.div
        className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        animate={{ x: [-320, 320] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute left-5 top-5 h-[170px] w-[78px] rounded-md bg-white shadow-sm" />
      <div className="absolute left-[112px] top-6 h-9 w-[168px] rounded bg-[#D5D5DC]" />
      <div className="absolute left-[112px] top-[76px] h-[18px] w-[138px] rounded bg-[#C7C7CF]" />
      <div className="absolute left-[112px] top-[108px] h-[18px] w-[168px] rounded bg-[#DCDCE1]" />
      <div className="absolute left-[112px] top-[142px] h-[52px] w-[168px] rounded bg-white" />
      <motion.div
        aria-hidden="true"
        className="absolute left-[38px] top-[44px] h-9 w-9 rounded-full bg-[#8F9C8A]"
        animate={{ scale: [1, 1.12, 1], opacity: [0.78, 1, 0.78] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
