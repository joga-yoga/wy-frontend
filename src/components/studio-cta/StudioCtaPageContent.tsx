"use client";

import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Link2,
  MapPin,
  Sparkles,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  ContactPropertyIcon,
  DescriptionPropertyIcon,
  DraftProcessIcon,
  EventsPropertyIcon,
  GalleryPropertyIcon,
  RegisterProcessIcon,
  SchedulePropertyIcon,
  SearchProcessIcon,
  StylesPropertyIcon,
} from "@/components/instructor-cta/InstructorCtaIcons";
import type { StudioPublicListItem } from "@/types/studio";

import { StudioDiscovery } from "./StudioDiscovery";

const processSteps: CtaProcessStep[] = [
  {
    title: "Znajdź swoje studio",
    description: "Wybierz profil z katalogu, dodaj studio ręcznie lub przenieś dane z Fitssey.",
    icon: SearchProcessIcon,
  },
  {
    title: "Sprawdź dane studia",
    description: "Najważniejsze informacje trafią do prostego widoku, który można poprawić.",
    icon: DraftProcessIcon,
  },
  {
    title: "Rejestracja",
    description: "Zaloguj się i zapisz sprawdzone dane studia.",
    icon: RegisterProcessIcon,
  },
];

const properties: CtaPageProperty[] = [
  { title: "Opis studia", icon: DescriptionPropertyIcon },
  { title: "Grafik zajęć", icon: SchedulePropertyIcon },
  { title: "Nauczyciele", icon: UsersRound },
  { title: "Style jogi", icon: StylesPropertyIcon },
  { title: "Galeria zdjęć", icon: GalleryPropertyIcon },
  { title: "Lokalizacja", icon: MapPin },
  { title: "Cennik i karnety", icon: CreditCard },
  { title: "Karty sportowe", icon: TicketCheck },
  { title: "Wydarzenia", icon: EventsPropertyIcon },
  { title: "Kontakt i linki", icon: ContactPropertyIcon },
];

const headingClass =
  "text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:text-[30px] md:tracking-[-0.6px]";

export function StudioCtaPageContent({ studios }: { studios: StudioPublicListItem[] }) {
  return (
    <main className="overflow-x-hidden bg-white text-[#3F3F46]">
      <HeroSection />
      <div className="px-6 py-6 md:hidden">
        <StudioDiscovery />
      </div>
      <SectionDivider className="md:hidden" />
      <ProcessSection />
      <SectionDivider className="md:h-[72px] md:px-[10px]" />
      <BenefitsSection />
      <SectionDivider className="md:h-[72px] md:px-[10px]" />
      <PropertiesSection />
      <SectionDivider className="md:h-[72px] md:px-[10px]" />
      <StudioExamplesSection studios={studios} />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative h-[430px] overflow-hidden rounded-b-lg md:h-auto md:min-h-[620px] md:rounded-none">
      <Image
        src="/images/cta/studios/hero.webp"
        alt="Wnętrze studia jogi"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative flex h-full flex-col items-center px-8 pt-[116px] text-center text-white md:px-20 md:pt-14 md:pb-14">
        <JogaYogaLogo variant="on-dark" size="desktop" className="scale-[0.62] md:scale-100" />
        <div className="mt-7 md:mt-10 md:grid md:w-full md:max-w-[1120px] md:grid-cols-[1fr_518px] md:items-center md:gap-20 md:text-left">
          <div>
            <h1 className="text-[36px] font-semibold leading-[38px] tracking-[-0.8px] md:text-[54px] md:leading-[58px] md:tracking-[-1.4px]">
              Pokaż swoje studio jogi
            </h1>
            <p className="mx-auto mt-3 max-w-[280px] text-[17px] font-medium leading-[22px] text-white/90 md:mx-0 md:mt-5 md:max-w-[470px] md:text-[22px] md:leading-[30px]">
              joga.yoga wspiera to, co tworzysz
            </p>
          </div>
          <div className="hidden md:block">
            <StudioDiscovery />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="px-8 py-8 md:px-20 md:py-14" aria-labelledby="studio-process-title">
      <h2 id="studio-process-title" className={headingClass}>
        Co będzie dalej:
      </h2>
      <ProcessSteps
        steps={processSteps}
        className="mt-5 grid gap-5 md:mt-12 md:grid-cols-3 md:gap-10"
        itemClassName="gap-3 md:gap-4"
        titleClassName="text-[16px] font-medium leading-6 text-[#3F3F46] md:text-[22px] md:leading-[30px]"
        descriptionClassName="text-[15px] leading-[20px] text-[#71717A] md:text-[18px] md:leading-[25px]"
      />
    </section>
  );
}

const benefits = [
  {
    icon: Sparkles,
    title: "Profesjonalna strona studia",
    text: "Wszystkie najważniejsze informacje w jednym miejscu",
  },
  { icon: CalendarDays, title: "Grafik i zapisy", text: "Prosty dostęp do aktualnych zajęć" },
  { icon: UsersRound, title: "Zespół nauczycieli", text: "Pokaż osoby, które tworzą Twoje studio" },
  {
    icon: Link2,
    title: "Większa widoczność",
    text: "Daj się znaleźć osobom szukającym jogi w mieście",
  },
  { icon: BadgeCheck, title: "Pełna kontrola", text: "Edytuj dane i publikuj wtedy, kiedy chcesz" },
];

function BenefitsSection() {
  return (
    <section
      className="rounded-[24px] bg-[#F2F2F3] px-8 py-9 md:rounded-none md:px-24 md:py-12"
      aria-labelledby="studio-benefits-title"
    >
      <h2 id="studio-benefits-title" className={headingClass}>
        Strona na joga.yoga to:
      </h2>
      <div className="mt-6 grid gap-7 md:mt-12 md:grid-cols-[minmax(0,600px)_1fr] md:items-center md:gap-20">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:h-[510px] md:aspect-auto md:rounded-[32px]">
          <Image
            src="/images/cta/studios/benefits.webp"
            alt="Przestrzeń do praktyki jogi"
            fill
            className="object-cover"
            sizes="(min-width:768px) 600px, 338px"
          />
        </div>
        <div className="grid gap-5">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-[18px] font-medium text-[#27272A] md:text-[22px]">{title}</h3>
                <p className="text-[15px] leading-5 text-[#71717A] md:text-[18px] md:leading-6">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PropertiesSection() {
  return (
    <section className="px-8 py-8 md:px-24 md:py-10" aria-labelledby="studio-properties-title">
      <h2 id="studio-properties-title" className={headingClass}>
        Co zawiera strona studia
      </h2>
      <PagePropertiesGrid
        properties={properties}
        className="mt-5 grid gap-y-3 md:mt-12 md:grid-cols-3 md:gap-x-10 md:gap-y-7"
        itemClassName="gap-4"
        iconClassName="size-6 md:size-8"
        textClassName="text-[15px] font-medium leading-5 text-[#71717A] md:text-[18px] md:leading-6"
      />
    </section>
  );
}

function StudioExamplesSection({ studios }: { studios: StudioPublicListItem[] }) {
  return (
    <section className="px-4 pb-14 md:px-20 md:pb-[120px]" aria-labelledby="studio-examples-title">
      <div className="px-4 md:px-0">
        <h2 id="studio-examples-title" className={headingClass}>
          Studia, które już tworzą z nami
        </h2>
        <p className="text-[17px] font-medium text-[#71717A]">Zobacz strony innych studiów jogi</p>
      </div>
      <div className="mt-5 grid gap-5 md:mt-12 md:grid-cols-3 md:gap-8">
        {studios.slice(0, 3).map((studio) => (
          <StudioExampleCard key={studio.id} studio={studio} />
        ))}
        {studios.length === 0 && (
          <div className="col-span-full rounded-2xl bg-[#F2F2F3] px-6 py-10 text-center text-zinc-500">
            Pierwsze opublikowane studia pojawią się tutaj.
          </div>
        )}
      </div>
    </section>
  );
}

function StudioExampleCard({ studio }: { studio: StudioPublicListItem }) {
  const imageId = studio.image_id ?? studio.image_ids[0];
  return (
    <Link
      href={`/studio/${studio.slug}`}
      className="flex min-h-[300px] flex-col rounded-[24px] border border-[#E4E4E7] bg-white p-5 shadow-[0_10px_20px_rgba(0,0,0,0.04)] md:min-h-[410px] md:p-6"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F2F2F3]">
        {imageId ? (
          <WyImage
            src={imageId}
            alt={studio.name}
            fill
            className="object-cover"
            sizes="(min-width:768px) 340px, 320px"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#F5F3EE] to-[#E2E7E0]">
            <Image
              src="/images/logo/svg/joga-yoga-mark.svg"
              alt=""
              width={58}
              height={58}
              className="opacity-45"
            />
          </div>
        )}
      </div>
      <div className="mt-5">
        <h3 className="text-[21px] font-medium text-[#3F3F46]">{studio.name}</h3>
        <p className="mt-1 text-sm text-[#71717A]">
          {[studio.yoga_styles[0], studio.city || studio.address].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span className="mt-auto pt-5 text-sm font-medium text-[#52525B]">Zobacz stronę →</span>
    </Link>
  );
}
