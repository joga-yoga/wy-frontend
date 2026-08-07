"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import type { Event } from "@/app/(public)/retreats/types";
import { JogaYogaLogo } from "@/components/brand/JogaYogaLogo";
import {
  CompactEventCard,
  type CtaPageProperty,
  type CtaProcessStep,
  PagePropertiesGrid,
  ProcessSteps,
  SectionDivider,
  SourceUrlForm,
} from "@/components/event-cta/EventCtaShared";
import { InstagramIcon, MeditationPoseIcon } from "@/components/event-cta/WorkshopCtaIcons";
import {
  AccountProcessIcon,
  ArrowDownIcon,
  ContactIcon,
  EditProcessIcon,
  GalleryIcon,
  InstructorIcon,
  LocationIcon,
  PracticalInfoIcon,
  PriceDateIcon,
  PublishProcessIcon,
  ShortDescriptionIcon,
  SparklesProcessIcon,
} from "@/components/retreat-cta/RetreatCtaIcons";
import { savePendingEventImport } from "@/lib/pendingEventImport";

const CREATE_WORKSHOP_FROM_URL_PATH = "/profile/workshops/create?source=url";
const AUTH_IMPORT_WORKSHOP_HREF = `/profile/login?next=${encodeURIComponent(CREATE_WORKSHOP_FROM_URL_PATH)}`;

const processSteps: CtaProcessStep[] = [
  {
    title: "Stwórz sowje konto",
    description: "Profil pozwala zarządzać wydarzeniami, zapisami i danymi kontaktowymi",
    icon: AccountProcessIcon,
  },
  {
    title: "Tworzenie strony wydarzenia",
    description: "Generowanie strony na podstawie linku lub wprowadzonych danych",
    icon: SparklesProcessIcon,
  },
  {
    title: "Edycja szczegółów",
    description: "Zmiana szczegółów informacji, dodawanie zdjęć, sprawdzanie ceny",
    icon: EditProcessIcon,
  },
  {
    title: "Publikacja",
    description: "Uczestnicy mogą już go zobaczyć i się zapisać",
    icon: PublishProcessIcon,
  },
];

const pageProperties: CtaPageProperty[] = [
  {
    title: "Opis praktyki i temat spotkania",
    icon: ShortDescriptionIcon,
    className: "order-1",
  },
  {
    title: "Cena, termin i czas trwania",
    icon: PriceDateIcon,
    className: "order-2 md:order-2",
  },
  {
    title: "Miejsce lub format online",
    icon: LocationIcon,
    className: "order-3 md:order-3",
  },
  {
    title: "Opis praktyki i temat spotkania",
    icon: MeditationPoseIcon,
    className: "order-4 md:order-4",
  },
  {
    title: "Profil prowadzącego / nauczyciela",
    icon: InstructorIcon,
    className: "order-5 md:order-5",
  },
  {
    title: "Galeria zdjęć i opisy miejsca",
    icon: GalleryIcon,
    className: "order-6 md:order-6",
  },
  {
    title: "Informacje praktyczne",
    icon: PracticalInfoIcon,
    className: "order-7 md:order-7",
  },
  {
    title: "Kontakt i zapisy",
    icon: ContactIcon,
    className: "order-8 md:order-8",
  },
];

function WorkshopSourceUrlForm({ id }: { id: "mobile" | "desktop" }) {
  const router = useRouter();

  return (
    <SourceUrlForm
      id={`workshop-source-url-${id}`}
      label="Link do strony wydarzenia"
      placeholder="Wklej link do swojego wydarzenia"
      buttonLabel="Utwórz stronę wydarzenia"
      emptyError="Wklej link do strony swojego wydarzenia"
      invalidError="Wpisz prawidłowy adres URL, np. https://twoja-strona.pl/wydarzenie"
      onValidSubmit={(url) => {
        savePendingEventImport("workshop", url);
        router.push(AUTH_IMPORT_WORKSHOP_HREF);
      }}
      className="flex w-full flex-col gap-4 md:gap-6"
      inputClassName="h-9 rounded-m border-[#71717A] bg-white px-3 text-[12px] placeholder:text-[#D4D4D8] md:h-11 md:p-[10px] md:text-[18px]"
      buttonClassName="h-[34px] w-full rounded-[22px] text-[15px] font-normal md:h-[44px] md:text-[20px]"
    />
  );
}

function HeroSection() {
  return (
    <>
      <section className="relative h-[430px] overflow-hidden rounded-b-lg rounded-t-none md:h-[640px] md:rounded-none md:bg-[#F2F2F3] md:px-24 md:py-[72px]">
        <div className="absolute inset-0 md:static md:grid md:h-full md:grid-cols-[576px_1fr] md:items-center md:gap-16">
          <div className="relative z-10 flex h-full flex-col items-start justify-between px-8 py-9 md:h-auto md:items-center md:justify-start md:px-0 md:py-0">
            <JogaYogaLogo variant="on-dark" size="mobile" className="self-center md:hidden" />
            <JogaYogaLogo variant="on-light" size="desktop" className="hidden md:flex" />
            <div className="w-full md:mt-6">
              <h1 className="text-[30px] font-semibold leading-[30px] tracking-[-0.6px] text-white md:text-[46px] md:leading-[50px] md:tracking-[-1.38px] md:text-[#52525B]">
                Dodaj wydarzenie jogowe
              </h1>
              <p className="mt-3 text-[18px] font-medium leading-[22px] tracking-[-0.36px] text-[#E4E4E7] md:mt-6 md:max-w-[520px] md:text-[18px] md:font-normal md:leading-7 md:tracking-normal md:text-[#71717A]">
                Publikuj kursy, warsztaty i wydarzenia jogowe w jednym miejscu
              </p>
              <div className="mt-6 hidden md:block">
                <WorkshopSourceUrlForm id="desktop" />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 md:relative md:h-full md:overflow-hidden md:rounded-[24px]">
            <Image
              src="/images/cta/workshops/hero.webp"
              alt="Kobieta praktykująca jogę w spokojnym wnętrzu"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 768px) 608px, 100vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_55%,rgba(0,0,0,0.72)_100%)] md:hidden" />
          </div>
        </div>
      </section>

      <div className="px-8 pt-6 md:hidden">
        <h2 className="text-[20px] font-medium leading-[30px] text-[#3F3F46]">
          Masz już stronę wydarzenia?
        </h2>
        <p className="mt-1 text-[15px] leading-5 text-[#71717A]">
          Wklej link, a joga.yoga przygotuje szkic strony wydarzenia na podstawie istniejących
          informacji
        </p>
        <div className="mt-4">
          <WorkshopSourceUrlForm id="mobile" />
        </div>
      </div>
    </>
  );
}

function ProcessSection() {
  return (
    <section
      className="px-8 pt-6 pb-0 md:px-24 md:pt-6 md:pb-11"
      aria-labelledby="workshop-process-title"
    >
      <h2
        id="workshop-process-title"
        className="text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:text-[30px]"
      >
        Co dalej
      </h2>
      <ProcessSteps
        steps={processSteps}
        className="mt-6 grid gap-6 md:grid-cols-4 md:gap-6"
        itemClassName="gap-4 md:items-center"
        titleClassName="text-[18px] font-medium leading-6 text-[#27272A] md:text-[20px] md:leading-[30px]"
        descriptionClassName="text-[18px] leading-5 text-[#71717A] md:text-[18px] md:font-medium md:leading-7"
      />
    </section>
  );
}

function BenefitCopy({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-[18px] font-medium leading-[22px] text-[#27272A] md:text-[20px] md:leading-[30px]">
        {title}
      </h3>
      <p className="mt-1 text-[18px] font-medium leading-[22px] text-[#71717A] md:text-[20px] md:leading-[25px]">
        {description}
      </p>
    </div>
  );
}

function InstagramProofCard() {
  return (
    <div className="flex items-center gap-[22px] rounded-xl border border-[#D4D4D8] bg-white px-[22px] py-4">
      <div className="flex shrink-0 flex-col items-center">
        <InstagramIcon className="size-9" aria-hidden="true" />
        <ArrowDownIcon className="size-9" aria-hidden="true" />
        <Image
          src="/images/logo/svg/joga-yoga-mark.svg"
          alt=""
          width={33}
          height={33}
          className="size-[33px]"
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-medium leading-[18px] text-[#27272A]">
          Instagram zaprasza. Strona wydarzenia porządkuje decyzję
        </p>
        <p className="mt-1 text-[15px] leading-[18px] text-[#71717A]">
          Post może zapowiedzieć spotkanie, a strona przechowuje szczegóły, terminy i zapisy.
        </p>
      </div>
    </div>
  );
}

function BenefitsSection() {
  return (
    <section aria-labelledby="workshop-benefits-title">
      <h2
        id="workshop-benefits-title"
        className="px-8 text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:px-24 md:text-[30px]"
      >
        Jakie masz z tego korzyści
      </h2>
      <div className="mt-4 rounded-[24px] bg-[#F2F2F3] px-8 py-8 md:mx-24 md:mt-9 md:grid md:h-[545.5px] md:grid-cols-2 md:gap-6 md:p-8">
        <div className="grid gap-6 md:block">
          <div className="md:hidden">
            <BenefitCopy
              title="Gotowa strona wydarzenia"
              description="Opis, termin, miejsce i prowadzący pokazani w prosty sposób"
            />
          </div>
          <div className="relative h-[229px] overflow-hidden rounded-xl md:h-full md:min-h-[393px]">
            <Image
              src="/images/cta/workshops/benefits.webp"
              alt="Kobieta podczas spokojnej praktyki oddechowej"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 580px, calc(100vw - 64px)"
            />
          </div>
        </div>
        <div className="mt-7 grid gap-6 md:mt-0">
          <div className="hidden md:block">
            <BenefitCopy
              title="Gotowa strona wydarzenia"
              description="Opis, termin, miejsce i prowadzący pokazani w prosty sposób"
            />
          </div>
          <BenefitCopy
            title="Rezerwacje od razu"
            description="Uczestnik widzi szczegóły wydarzenia i od razu może się zapisać"
          />
          <BenefitCopy
            title="Mniej pytań przed zapisami"
            description="Najważniejsze informacje są dostępne w jednym miejscu: dla kogo jest wydarzenie, co zabrać, ile kosztuje i kto prowadzi"
          />
          <InstagramProofCard />
          <BenefitCopy
            title="Publiczny link do promocji"
            description="Jedna strona do wysłania, udostępnienia i zapisów"
          />
        </div>
      </div>
    </section>
  );
}

function PropertiesSection() {
  return (
    <section className="px-8 md:px-24" aria-labelledby="workshop-properties-title">
      <h2
        id="workshop-properties-title"
        className="text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:text-[30px]"
      >
        Co zawiera strona wydarzenia
      </h2>
      <PagePropertiesGrid
        properties={pageProperties}
        className="mt-6 grid gap-y-2 md:grid-cols-3 md:gap-x-20 md:gap-y-4"
        itemClassName="gap-4 md:h-6 md:order-none"
        textClassName="text-[15px] font-medium leading-[24px] text-[#52525B] md:whitespace-nowrap md:text-[20px] md:leading-[30px]"
      />
    </section>
  );
}

function ExamplesSection({ events }: { events: Event[] }) {
  return (
    <section
      className="px-8 pb-6 md:h-[402px] md:px-24 md:pt-[72px] md:pb-[72px]"
      aria-labelledby="workshop-examples-title"
    >
      <h2
        id="workshop-examples-title"
        className="text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:text-[30px]"
      >
        Wydarzenia na joga.yoga
      </h2>
      <p className="mt-1 text-[15px] leading-[18px] text-[#71717A] md:text-[20px] md:leading-[30px]">
        Zobacz przykłady wydarzeń już opublikowanych na platformie
      </p>

      {events.length > 0 ? (
        <div className="mt-6 grid gap-3 md:mt-9 md:grid-cols-3 md:gap-6">
          {events.map((event) => (
            <CompactEventCard
              key={event.id}
              event={event}
              hrefPrefix="/wydarzenia"
              fallbackDescription="Wydarzenie jogowe na joga.yoga"
              variant="workshop"
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-[15px] text-[#757580]">
          Wkrótce pojawią się tutaj pierwsze wydarzenia
        </p>
      )}
    </section>
  );
}

export function WorkshopCtaPageContent({ events }: { events: Event[] }) {
  return (
    <main className="bg-white text-[#27272A]">
      <HeroSection />
      <ProcessSection />
      <SectionDivider />
      <BenefitsSection />
      <SectionDivider />
      <PropertiesSection />
      <SectionDivider />
      <ExamplesSection events={events} />
    </main>
  );
}
