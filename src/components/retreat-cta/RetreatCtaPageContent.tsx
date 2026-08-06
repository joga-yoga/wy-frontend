"use client";

import Image from "next/image";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { savePendingRetreatImport } from "@/lib/pendingRetreatImport";
import { cn } from "@/lib/utils";

import {
  AccommodationIcon,
  AccountProcessIcon,
  ArrowDownIcon,
  ContactIcon,
  EditProcessIcon,
  FacebookIcon,
  GalleryIcon,
  InstructorIcon,
  LocationIcon,
  PracticalInfoIcon,
  PriceDateIcon,
  ProgramIcon,
  PublishProcessIcon,
  ShortDescriptionIcon,
  SparklesProcessIcon,
} from "./RetreatCtaIcons";

const CREATE_RETREAT_PATH = "/profile/retreats/create";
const CREATE_RETREAT_FROM_URL_PATH = `${CREATE_RETREAT_PATH}?source=url`;
const AUTH_CREATE_RETREAT_HREF = `/profile/login?next=${encodeURIComponent(CREATE_RETREAT_PATH)}`;
const AUTH_IMPORT_RETREAT_HREF = `/profile/login?next=${encodeURIComponent(CREATE_RETREAT_FROM_URL_PATH)}`;

const processSteps: CtaProcessStep[] = [
  {
    title: "Stwórz sowje konto",
    description: "To pomaga dbać o jakość ogłoszeń i kontakt z organizatorami",
    icon: AccountProcessIcon,
  },
  {
    title: "Tworzenie strony wyjazdu",
    description: "Generowanie strony na podstawie linku lub wprowadzonych danych",
    icon: SparklesProcessIcon,
  },
  {
    title: "Edycja danych",
    description: "Zmiana szczegółów informacji, dodawanie zdjęć, sprawdzanie ceny",
    icon: EditProcessIcon,
  },
  {
    title: "Publikacja",
    description: "Uczestnicy mogą się zapisać",
    icon: PublishProcessIcon,
  },
];

const pageProperties: CtaPageProperty[] = [
  { title: "Krótki opis", icon: ShortDescriptionIcon, className: "order-1" },
  {
    title: "Opcje zakwaterowania",
    icon: AccommodationIcon,
    className: "order-4",
  },
  { title: "Cena i termin", icon: PriceDateIcon, className: "order-2" },
  {
    title: "Program dzienny i harmonogram",
    icon: ProgramIcon,
    className: "order-5",
  },
  {
    title: "Profil prowadzącego / nauczyciela",
    icon: InstructorIcon,
    className: "order-6",
  },
  {
    title: "Galeria zdjęć i opisy miejsca",
    icon: GalleryIcon,
    className: "order-7",
  },
  { title: "Lokalizacja i dojazd", icon: LocationIcon, className: "order-3" },
  {
    title: "Informacje praktyczne",
    icon: PracticalInfoIcon,
    className: "order-8",
  },
  { title: "Kontakt i zapisy", icon: ContactIcon, className: "order-9" },
];

function ImportRetreatForm({ id }: { id: "mobile" | "desktop" }) {
  const router = useRouter();

  return (
    <SourceUrlForm
      id={`retreat-source-url-${id}`}
      label="Link do strony wyjazdu"
      placeholder="Wklej link do swojego wydarzenia"
      buttonLabel="Utwórz stronę z linku"
      emptyError="Wklej link do strony swojego wyjazdu."
      invalidError="Wpisz prawidłowy adres URL, np. https://twoja-strona.pl/wyjazd"
      onValidSubmit={(url) => {
        savePendingRetreatImport(url);
        router.push(AUTH_IMPORT_RETREAT_HREF);
      }}
      className="flex w-full flex-col gap-4 md:w-[520px]"
      inputClassName="h-9 rounded-md border-[#71717A] bg-white px-3 text-[12px] placeholder:text-[#D4D4D8] md:h-11 md:p-[10px] md:text-[18px]"
      buttonClassName="h-[34px] w-full rounded-[22px] text-[15px] font-normal md:h-[43px] md:text-[20px]"
    />
  );
}

function ProcessAndImportSection() {
  return (
    <section aria-labelledby="retreat-process-title">
      <div className="mx-4 overflow-hidden rounded-[24px] bg-white px-6 py-[30px] shadow-[0_8px_28px_rgba(39,39,42,0.08)] md:mx-0 md:rounded-none md:px-24 md:py-[72px] md:shadow-none">
        <h2
          id="retreat-process-title"
          className="text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:text-[30px]"
        >
          Co będzie dalej
        </h2>
        <ProcessSteps
          steps={processSteps}
          className="mt-4 grid gap-4 md:mx-auto md:mt-10 md:w-[824px] md:grid-cols-2 md:gap-6"
          itemClassName="gap-[18px] md:min-h-[113px] md:rounded-xl md:border md:border-[#E4E4E7] md:bg-[#F2F2F3] md:p-6"
          titleClassName="text-[18px] font-medium leading-6 text-[#27272A]"
          descriptionClassName="text-[15px] leading-5 text-[#71717A]"
        />

        <div className="my-7 h-px bg-[#E4E4E7] md:hidden" aria-hidden="true" />

        <div className="md:hidden">
          <h2 className="text-[20px] font-medium leading-[30px] text-[#3F3F46]">
            Masz już stronę wyjazdu?
          </h2>
          <p className="mt-1 text-[15px] leading-5 text-[#71717A]">
            Wklej link, a joga.yoga przygotuje szkic strony na podstawie istniejących informacji
          </p>
          <div className="mt-4">
            <ImportRetreatForm id="mobile" />
          </div>
        </div>
      </div>

      <SectionDivider className="hidden md:flex md:h-[72px]" />

      <div className="hidden items-center justify-between bg-[#F2F2F3] px-24 py-[72px] md:flex">
        <div>
          <h2 className="text-[30px] font-medium text-[#34343A]">Masz już stronę wyjazdu?</h2>
          <p className="mt-3 text-[18px] text-[#717178]">
            Wklej link, a joga.yoga przygotuje szkic strony na podstawie istniejących informacji
          </p>
        </div>
        <ImportRetreatForm id="desktop" />
      </div>
    </section>
  );
}

function BenefitCopy({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <h3 className="text-[20px] font-medium leading-[30px] text-[#3F3F46]">{title}</h3>
      <p className="text-[18px] font-medium leading-[25px] text-[#71717A]">{description}</p>
    </div>
  );
}

function SocialProofCard() {
  return (
    <div className="flex items-center gap-[22px] rounded-xl border border-[#D4D4D8] bg-white px-[22px] py-4">
      <div className="flex shrink-0 flex-col items-center">
        <FacebookIcon className="size-9" aria-hidden="true" />
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
        <p className="text-[20px] font-medium leading-[25px] text-[#27272A] md:leading-[30px]">
          Facebook zaprasza. Strona wyjazdu pomaga podjąć decyzję
        </p>
        <p className="mt-1 hidden text-[20px] font-medium leading-[25px] text-[#71717A] md:block">
          Dodaj wyjazd z jogą na joga.yoga i zobacz, jak wygodnie mieć program, szczegóły i zapisy w
          jednym miejscu
        </p>
      </div>
    </div>
  );
}

function BenefitsSection() {
  return (
    <section aria-labelledby="retreat-benefits-title">
      <h2
        id="retreat-benefits-title"
        className="px-8 text-[20px] font-semibold leading-[30px] text-[#3F3F46] md:hidden"
      >
        Strona wyjazdu na joga.yoga to:
      </h2>
      <div className="mt-4 rounded-[24px] bg-[#F2F2F3] px-8 py-8 md:mt-0 md:px-24 md:py-[72px]">
        <h2 className="hidden text-[30px] font-semibold leading-[30px] text-[#3F3F46] md:block">
          Strona wyjazdu na joga.yoga to:
        </h2>
        <div className="mt-0 grid items-center gap-7 md:mt-[42px] md:grid-cols-[520px_1fr] md:gap-14">
          <div className="contents md:flex md:flex-col md:gap-14">
            <div className="relative order-2 h-[225px] overflow-hidden rounded-2xl md:order-none md:h-[352px]">
              <Image
                src="/images/cta/retreats/benefits.png"
                alt="Grupa podczas praktyki jogi na tarasie z widokiem na morze"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 520px, calc(100vw - 64px)"
                priority={false}
              />
            </div>
            <BenefitCopy
              title="Publiczny link do promocji"
              description="Jedna strona do wysłania, udostępnienia i dodania do profilu albo strony studia"
              className="order-7 md:order-none md:px-[22px] md:py-4"
            />
          </div>

          <div className="contents md:flex md:flex-col md:gap-7">
            <BenefitCopy
              title="Oferta gotowa do pokazania"
              description="Wyjazd wygląda jasno i konkretnie od pierwszego spojrzenia lub wejrzenia"
              className="order-1"
            />
            <BenefitCopy
              title="Więcej rezerwacji"
              description="Jasna oferta i prosty zapis skracają drogę od zainteresowania faktycznej rezerwacji"
              className="order-3"
            />
            <BenefitCopy
              title="Pewność i zaufanie"
              description="Uczestnik widzi klimat, program i warunki"
              className="order-4"
            />
            <BenefitCopy
              title="Zapis od razu"
              description="Gdy pojawia się decyzja, można od razu zarezerwować miejsce"
              className="order-5 md:order-7"
            />
            <div className="order-6 md:order-5">
              <SocialProofCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PagePropertiesSection() {
  return (
    <section className="px-8" aria-labelledby="retreat-properties-title">
      <h2
        id="retreat-properties-title"
        className="text-[20px] font-medium leading-[30px] text-[#27272A]"
      >
        Co zawiera strona Twojego wyjazdu
      </h2>
      <PagePropertiesGrid
        properties={pageProperties}
        className="mt-6 grid gap-y-3 md:grid-cols-3 md:gap-x-16 md:gap-y-6"
        itemClassName="gap-4 md:order-none"
        textClassName="text-[15px] font-medium leading-[25px] text-[#71717A] md:text-[20px]"
      />
    </section>
  );
}

function ExamplesSection({ events }: { events: Event[] }) {
  return (
    <section
      className="rounded-t-[24px] bg-[#F2F2F3] px-8 py-[30px] md:rounded-none md:px-24 md:py-[72px]"
      aria-labelledby="retreat-examples-title"
    >
      <div className="md:text-center">
        <h2
          id="retreat-examples-title"
          className="text-[20px] font-medium leading-[30px] text-[#27272A] md:text-[36px] md:leading-[44px]"
        >
          Wyjazdy, które są już na joga.yoga
        </h2>
        <p className="mt-1 text-[15px] leading-5 text-[#757580] md:mt-2 md:text-[18px] md:leading-[26px]">
          <span className="md:hidden">
            Zobacz przykłady wyjazdów już opublikowanych na platformie
          </span>
          <span className="hidden md:inline">
            Zobacz wyjazdy, które organizatorzy już publikują na platformie
          </span>
        </p>
      </div>
      {events.length > 0 ? (
        <div className="-mx-1 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 md:mx-0 md:mt-9 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {events.map((event) => (
            <div key={event.id} className="w-full shrink-0 md:w-auto">
              <CompactEventCard
                event={event}
                hrefPrefix="/wyjazdy"
                fallbackDescription="Wyjazd jogowy na joga.yoga"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-center text-[15px] text-[#757580]">
          Wkrótce pojawią się tutaj pierwsze wyjazdy
        </p>
      )}
    </section>
  );
}

export function RetreatCtaPageContent({ events }: { events: Event[] }) {
  return (
    <main className="bg-white text-[#27272A]">
      <section className="relative h-[430px] overflow-hidden rounded-b-lg rounded-t-none md:h-[620px] md:rounded-[24px] md:bg-[#F2F2F3] md:px-24 md:py-[72px]">
        <div className="absolute inset-0 md:static md:grid md:h-full md:grid-cols-[520px_1fr] md:items-center md:gap-20">
          <div className="relative z-10 flex h-full flex-col justify-between px-8 py-9 md:items-center md:px-0 md:py-0">
            <JogaYogaLogo variant="on-dark" size="mobile" className="md:hidden" />
            <JogaYogaLogo variant="on-light" size="desktop" className="hidden md:flex" />
            <div className="flex flex-col gap-8 md:items-center md:gap-7">
              <div>
                <h1 className="text-[30px] font-semibold leading-[30px] tracking-[-0.6px] text-white md:text-center md:text-[64px] md:leading-[66px] md:tracking-[-1.28px] md:text-[#34343A]">
                  Dodaj wyjazd jogowy
                </h1>
                <p className="mt-2 text-[18px] font-medium leading-[22px] tracking-[-0.36px] text-[#E4E4E7] md:mt-7 md:text-center md:text-[24px] md:leading-8 md:tracking-normal md:text-[#66646B]">
                  Stwórz czytelną stronę wyjazdu z programem, atmosferą miejsca i prostym zapisem
                  dla uczestników
                </p>
              </div>
              <Button
                asChild
                className="h-[34px] w-full rounded-[22px] border border-[#3F3F46] bg-white text-[15px] font-normal text-[#3F3F46] hover:bg-white/90 md:h-[43px] md:border-0 md:bg-[#3F3F46] md:text-[20px] md:font-medium md:text-white md:hover:bg-[#27272A]"
              >
                <Link href={AUTH_CREATE_RETREAT_HREF}>Stwórz stronę wyjazdu od zera</Link>
              </Button>
            </div>
          </div>

          <div className="absolute inset-0 md:relative md:h-full md:overflow-hidden rounded-b-lg rounded-t-none md:border md:border-white/70 md:shadow-[0_18px_48px_rgba(0,0,0,0.16)] md:rounded-none">
            <Image
              src="/images/cta/retreats/hero.png"
              alt="Praktyka jogi przy basenie o zachodzie słońca"
              fill
              priority
              className="object-cover md:rounded-2xl"
              sizes="(min-width: 768px) 648px, 100vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_49%,rgba(0,0,0,0.8)_88%,rgba(0,0,0,0.8)_100%)] md:hidden" />
          </div>
        </div>
      </section>

      <SectionDivider className="md:h-[72px]" />
      <ProcessAndImportSection />
      <SectionDivider className="md:h-[72px]" />
      <BenefitsSection />
      <SectionDivider className="md:h-[72px]" />
      <PagePropertiesSection />
      <SectionDivider className="md:h-[72px]" />
      <ExamplesSection events={events} />
    </main>
  );
}
