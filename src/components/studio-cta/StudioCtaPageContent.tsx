"use client";

import type { AxiosError } from "axios";
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
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type {
  GeneratedStudioProfileDraft,
  StudioPublicListItem,
  StudioPublicSearchItem,
} from "@/types/studio";

const processSteps: CtaProcessStep[] = [
  {
    title: "Sprawdzimy informacje o studiu",
    description: "Szukamy danych udostępnionych w sieci",
    icon: SearchProcessIcon,
  },
  {
    title: "Przygotujemy szkic strony",
    description: "Najważniejsze informacje trafią do prostego widoku, który można poprawić.",
    icon: DraftProcessIcon,
  },
  {
    title: "Rejestracja",
    description: "Załóż profil studia i zacznij zarządzać swoją stroną",
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

type MatchRequired = {
  detail?: {
    code?: string;
    message?: string;
    matches?: StudioPublicSearchItem[];
  };
};

export function StudioCtaPageContent({ studios }: { studios: StudioPublicListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudioPublicSearchItem | null>(null);
  const [suggestions, setSuggestions] = useState<StudioPublicSearchItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 3 || selected) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoadingSuggestions(true);
      axiosInstance
        .get<StudioPublicSearchItem[]>("/public/studios/search", {
          params: { q: value, limit: 10 },
          signal: controller.signal,
        })
        .then(({ data }) => setSuggestions(data))
        .catch((requestError) => {
          if ((requestError as { code?: string }).code !== "ERR_CANCELED") setSuggestions([]);
        })
        .finally(() => setLoadingSuggestions(false));
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected]);

  const changeQuery = (value: string) => {
    setQuery(value);
    setSelected(null);
    setError(null);
  };

  const submit = async () => {
    const input = query.trim();
    if (input.length < 2 || generating) {
      setError("Wpisz nazwę studia.");
      return;
    }
    if (selected?.is_claimed) {
      setError("To studio jest już zarządzane.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post<GeneratedStudioProfileDraft>(
        "/studio-profile-drafts/generate",
        { input, existing_studio_id: selected?.id },
      );
      router.push(`/studio/dodaj/preview/${data.public_token}`);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<MatchRequired>;
      const detail = axiosError.response?.data?.detail;
      if (axiosError.response?.status === 409 && detail?.code === "studio_match_required") {
        setSuggestions(detail.matches ?? []);
        setError(detail.message ?? "Wybierz studio z listy.");
        setGenerating(false);
        return;
      }
      setError("Nie udało się przygotować szkicu. Spróbuj ponownie.");
      setGenerating(false);
    }
  };

  if (generating) return <StudioGenerationScreen />;

  const formProps = {
    query,
    selected,
    suggestions,
    loadingSuggestions,
    error,
    onChange: changeQuery,
    onSelect: (item: StudioPublicSearchItem) => {
      if (item.is_claimed) return;
      setSelected(item);
      setQuery(item.name);
      setSuggestions([]);
      setError(null);
    },
    onSubmit: submit,
  };

  return (
    <main className="overflow-x-hidden bg-white text-[#3F3F46]">
      <HeroSection formProps={formProps} />
      <div className="px-6 py-6 md:hidden">
        <StudioDraftForm {...formProps} variant="mobile" />
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

type FormProps = {
  query: string;
  selected: StudioPublicSearchItem | null;
  suggestions: StudioPublicSearchItem[];
  loadingSuggestions: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSelect: (item: StudioPublicSearchItem) => void;
  onSubmit: () => void;
};

function HeroSection({ formProps }: { formProps: FormProps }) {
  return (
    <section className="relative h-[430px] overflow-hidden rounded-b-lg md:h-[620px] md:rounded-none">
      <Image
        src="/images/cta/studios/hero.png"
        alt="Wnętrze studia jogi"
        fill
        priority
        unoptimized
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative flex h-full flex-col items-center px-8 pt-[116px] text-center text-white md:px-20 md:pt-14">
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
            <StudioDraftForm {...formProps} variant="desktop" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StudioDraftForm(props: FormProps & { variant: "mobile" | "desktop" }) {
  const { query, selected, suggestions, loadingSuggestions, error, onChange, onSelect, onSubmit } =
    props;
  const isDesktop = props.variant === "desktop";
  const id = useId();
  const listId = `${id}-listbox`;
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const open = suggestions.length > 0 && !selected;

  useEffect(() => setActive(open ? 0 : -1), [open, suggestions]);

  const move = (direction: number) => {
    if (!open) return;
    let next = active;
    do next = (next + direction + suggestions.length) % suggestions.length;
    while (suggestions[next]?.is_claimed && next !== active);
    setActive(next);
  };

  return (
    <form
      className={cn(
        "relative bg-[#FAFAFA] text-left text-[#3F3F46]",
        isDesktop
          ? "w-[518px] rounded-2xl p-8"
          : "mx-auto min-h-[260px] w-full max-w-[354px] rounded-2xl p-6 shadow-[0_6px_18px_rgba(39,39,42,0.12)]",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      aria-label="Generator strony studia jogi"
    >
      <h2
        className={cn(
          "font-semibold text-[#52525B]",
          isDesktop ? "text-[30px] leading-[32px]" : "text-[24px] leading-[30px]",
        )}
      >
        Sprawdź, jak może wyglądać strona studia
      </h2>
      <label
        htmlFor={id}
        className="mt-5 block text-[15px] font-medium text-[#71717A] md:text-[18px]"
      >
        Wpisz nazwę studia
      </label>
      <div className="relative mt-2">
        <Input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
          aria-invalid={Boolean(error)}
          value={query}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(1);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              move(-1);
            }
            if (event.key === "Escape") setActive(-1);
            if (event.key === "Enter" && open && active >= 0) {
              event.preventDefault();
              onSelect(suggestions[active]);
            }
          }}
          placeholder="np. Święta Krowa Studio Jogi"
          autoComplete="off"
          className="h-11 rounded-xl border-[#71717A] bg-white px-3 text-[16px] shadow-none placeholder:text-[#B9B9C0]"
        />
        {loadingSuggestions && (
          <span
            className="absolute right-3 top-3 size-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"
            aria-label="Szukamy studiów"
          />
        )}
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl"
          >
            {suggestions.map((item, index) => (
              <li
                key={item.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={false}
                aria-disabled={item.is_claimed}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(item);
                }}
                className={cn(
                  "rounded-lg px-3 py-2",
                  item.is_claimed
                    ? "cursor-not-allowed bg-zinc-50 text-zinc-400"
                    : "cursor-pointer",
                  active === index && !item.is_claimed && "bg-zinc-100",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{item.name}</span>
                  {item.is_claimed && <span className="text-xs">już zarządzane</span>}
                </div>
                {(item.address || item.city) && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {[item.address, item.city].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected && (
        <p className="mt-2 flex items-center gap-1 text-sm text-emerald-700">
          <BadgeCheck className="size-4" /> Wybrano istniejące studio
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="mt-5 h-11 w-full rounded-full bg-[#3F3F46] text-[16px] hover:bg-[#29292d]"
      >
        Zobacz szkic
      </Button>
    </form>
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
            src="/images/cta/studios/benefits.png"
            alt="Przestrzeń do praktyki jogi"
            fill
            unoptimized
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

function StudioGenerationScreen() {
  const [status, setStatus] = useState(0);
  const statuses = [
    "Sprawdzamy bazę studiów",
    "Szukamy publicznych informacji",
    "Przygotowujemy szkic strony",
  ];
  useEffect(() => {
    const timer = window.setInterval(
      () => setStatus((value) => (value + 1) % statuses.length),
      8000,
    );
    return () => window.clearInterval(timer);
  }, [statuses.length]);
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F7F7F7] px-5 text-center text-[#3F3F46]">
      <section
        className="flex min-h-[500px] w-full max-w-[402px] flex-col items-center justify-center rounded-[32px] border border-zinc-200 bg-white px-7 shadow-sm"
        aria-live="polite"
      >
        <span className="text-5xl">🧘</span>
        <h1 className="mt-7 text-[38px] font-semibold leading-[42px] text-[#52525B]">
          Proces tworzenia
        </h1>
        <p className="mt-4 min-h-12 text-[18px] text-[#71717A]">
          {statuses[status]}
          <br />
          <span className="text-sm">To może potrwać około 2 minut.</span>
        </p>
        <div className="mt-10 size-12 animate-spin rounded-full border-[3px] border-zinc-300 border-t-zinc-700" />
      </section>
    </main>
  );
}
