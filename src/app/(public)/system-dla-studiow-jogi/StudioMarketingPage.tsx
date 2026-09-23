import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import CustomLocationIcon from "@/components/icons/CustomLocationIcon";
import { Button } from "@/components/ui/button";

import { HeroVideo } from "./HeroVideo";
import { FaqSection, ScheduleTabs } from "./InteractiveSections";

const ecosystemCards = [
  { emoji: "🪷", title: "Studio", description: "Grafik, profil, zespół i oferta" },
  { emoji: "🙋", title: "Instruktor", description: "Własny profil i przypisane zajęcia" },
  {
    emoji: "🧘‍♀️",
    title: "Wydarzenie",
    description: "Czytelna strona, która zbiera wszystkie ważne informacje",
  },
  {
    emoji: "🏕️",
    title: "Wyjazd jogowy",
    description: "Program, prowadzący i pełna opowieść o wyjeździe",
  },
] as const;

const steps = [
  {
    title: "Dodaj lub potwierdź studio",
    description: "Podaj najważniejsze dane i sprawdź podgląd profilu",
    href: "/studio/dodaj",
  },
  { title: "Ułóż pierwszy grafik", description: "Dodaj zajęcia, sale i osoby prowadzące" },
  {
    title: "Zapraszaj i rozwijaj",
    description:
      "Dołącz zespół, publikuj ofertę i korzystaj z kolejnych narzędzi, gdy ich potrzebujesz",
  },
] as const;

function Divider() {
  return (
    <div className="mx-auto flex h-8 w-full max-w-[403px] items-center" aria-hidden="true">
      <span className="mx-auto h-px w-4/5 max-w-[328px] bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
    </div>
  );
}

export function StudioMarketingPage() {
  return (
    <main className="overflow-x-hidden bg-white text-gray-800 [&_.section-heading]:text-[28px] [&_.section-heading]:font-semibold [&_.section-heading]:leading-[31px] [&_.section-heading]:tracking-[-0.7px] [&_.section-lead]:text-[17px] [&_.section-lead]:leading-[27.2px] [&_.section-lead]:text-[#78716c] [&_.section-shell]:mx-auto [&_.section-shell]:w-full [&_.section-shell]:max-w-6xl [&_.section-shell]:px-5">
      <section className="rounded-b-2xl bg-white" aria-labelledby="hero-heading">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 pt-4 md:grid-cols-[1fr_420px] md:items-center md:gap-14 md:py-14">
          <div>
            <p className="text-[15px] leading-[22px] text-gray-600">
              System do prowadzenia studia jogi
            </p>
            <h1
              id="hero-heading"
              className="mt-5 text-[40px] font-semibold leading-[44px] tracking-[-1.2px] text-gray-800 md:text-[58px] md:leading-[62px]"
            >
              Twoje zajęcia.
              <br />
              Uczestnicy.
              <br />
              Wszystko pod ręką.
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-[22px] text-gray-600 md:text-[17px] md:leading-7">
              Pokaż także warsztaty, kursy i wyjazdy, które organizujesz
            </p>
            <div className="mt-6 hidden flex-col items-start gap-4 md:flex">
              <HeroActions />
            </div>
          </div>
          <div className="mx-auto h-[533px] w-[234px] md:h-[600px] md:w-[264px]">
            <HeroVideo />
          </div>
          <div className="flex flex-col items-start gap-4 pb-0 md:hidden">
            <HeroActions />
          </div>
        </div>
      </section>

      <div className="mt-8">
        <Divider />
      </div>

      <section className="section-shell mt-8" aria-labelledby="ecosystem-heading">
        <div className="max-w-xl">
          <h2 id="ecosystem-heading" className="section-heading">
            Studio, instruktorzy i praktyka w naturalnym połączeniu
          </h2>
          <p className="mt-2 text-[15px] leading-[22px] text-gray-500">
            Joga żyje relacjami. Dlatego joga.yoga pomaga łączyć studio z ludźmi, którzy prowadzą
            zajęcia, tworzą wydarzenia i budują lokalną społeczność.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ecosystemCards.map((card) => (
            <article
              key={card.title}
              className="min-h-[148px] rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.06),0_1px_1px_rgba(28,25,23,0.04)]"
            >
              <span className="text-[36px] leading-[30px]" aria-hidden="true">
                {card.emoji}
              </span>
              <h3 className="mt-3 text-[16px] font-semibold leading-6">{card.title}</h3>
              <p className="mt-1 text-[14px] leading-[21px] text-gray-500">{card.description}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 max-w-2xl text-[15px] leading-[22px] text-gray-500">
          Gdy ktoś pozna Twoje studio przez instruktora, wydarzenie albo wyjazd, łatwiej trafia do
          całej Twojej oferty
        </p>
      </section>

      <div className="mt-8">
        <Divider />
      </div>

      <section className="section-shell mt-8" aria-labelledby="pricing-heading">
        <h2 id="pricing-heading" className="section-heading">
          Ile kosztuje start
        </h2>
        <div className="mt-4 max-w-xl rounded-[24px] border border-gray-200 p-6">
          <div className="grid grid-cols-2 text-center">
            <div>
              <p className="text-[38px] font-semibold leading-[46px]">0 zł</p>
              <p className="text-[14px] leading-[22px]">abonamentu</p>
            </div>
            <div>
              <p className="text-[38px] font-semibold leading-[46px]">100</p>
              <p className="text-[14px] leading-[22px]">zapisów gratis / mies.</p>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <Button
              asChild
              variant="outline"
              className="h-[34px] w-full rounded-full border-gray-700 text-[15px] font-normal text-gray-600 shadow-none"
            >
              <Link href="/cennik">Zobacz pełny cennik</Link>
            </Button>
          </div>
          <p className="mt-4 text-[11px] leading-[17px] text-gray-600">
            Opłaty operatora płatności osobno
          </p>
        </div>
      </section>

      <div className="mt-8">
        <Divider />
      </div>

      <section
        className="section-shell mt-8 md:grid md:grid-cols-[1fr_420px] md:items-center md:gap-14"
        aria-labelledby="yoga-first-heading"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/images/marketing/studios/black-lotos.svg" alt="" width={32} height={32} />
            <h2 id="yoga-first-heading" className="section-heading">
              Od początku dla jogi
            </h2>
          </div>
          <p className="mt-4 text-[17px] leading-[26px] text-gray-600">
            Grafik i zapisy dopasowane wyłącznie do pracy studia i nauczycieli jogi. Bez zbędnych
            funkcji i opłat za narzędzia tworzone dla siłowni, salonów beauty i innych branż
          </p>
        </div>
        <figure className="mt-4 md:mt-0">
          <Image
            src="/images/marketing/studios/yoga-first.webp"
            alt="Kameralne studio jogi i ekran informacji o zajęciach"
            width={363}
            height={363}
            className="h-auto w-full rounded-sm"
          />
          <figcaption className="mt-4 text-right text-[12px] leading-[13px] text-gray-600">
            Grafika stworzona przez AI dla nastroju
          </figcaption>
        </figure>
      </section>

      <div className="mt-8">
        <Divider />
      </div>

      <section
        className="section-shell mt-8 md:grid md:grid-cols-[1fr_420px] md:items-center md:gap-14"
        aria-labelledby="discovery-heading"
      >
        <div>
          <p className="text-[15px] leading-[22px] text-gray-500">
            Rozwijamy katalog studiów według miast
          </p>
          <h2 id="discovery-heading" className="section-heading mt-4">
            Poznaj osoby szukające jogi w mieście
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <CustomLocationIcon className="size-8 shrink-0" aria-hidden="true" />
            <p className="text-[15px] leading-[22px] text-gray-600">
              Dołącz do lokalnego katalogu i daj się łatwo znaleźć na mapie jogi w Twoim mieście
            </p>
          </div>
        </div>
        <figure className="mt-4 md:mt-0">
          <Image
            src="/images/marketing/studios/city-catalogue.webp"
            alt="Katalog studiów jogi uporządkowany według miast"
            width={363}
            height={363}
            className="aspect-square w-full rounded-[16px] object-cover"
          />
          <figcaption className="section-lead mt-4">
            Daj się poznać osobom, które szukają jogi
          </figcaption>
        </figure>
      </section>

      <div className="mt-8">
        <ScheduleTabs />
      </div>

      <div className="mt-8">
        <Divider />
      </div>

      <section className="section-shell mt-8" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="section-heading">
          Jak zacząć? Zacznij od studia
        </h2>
        <p className="section-lead">Resztę ułożysz po drodze</p>
        <ol className="mt-4 max-w-2xl space-y-2">
          {steps.map((step, index) => {
            const row = (
              <>
                <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                  <span className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-[13px] font-semibold text-brand-green-700">
                    0{index + 1}
                  </span>
                  {index < steps.length - 1 && (
                    <span className="min-h-8 w-px flex-1 bg-gray-200" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-2">
                  <div className="flex items-start gap-2">
                    <h3 className="text-[18px] font-semibold leading-[25px] text-[#1c1917]">
                      {step.title}
                    </h3>
                    {"href" in step && step.href && (
                      <span
                        aria-hidden="true"
                        className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-700 motion-safe:transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
                      >
                        <ArrowRight className="size-[18px]" strokeWidth={1.5} />
                      </span>
                    )}
                  </div>
                  <p className="text-[16px] leading-6 text-[#78716c]">{step.description}</p>
                </div>
              </>
            );

            return (
              <li key={step.title}>
                {"href" in step && step.href ? (
                  <Link
                    href={step.href}
                    aria-label={`${step.title}. ${step.description}`}
                    className="group flex min-h-12 gap-5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-2"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="flex gap-5">{row}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-8">
        <Divider />
      </div>

      <section className="section-shell mt-8" aria-labelledby="migration-heading">
        <div className="flex items-start gap-2.5">
          <Image
            src="/images/marketing/studios/migration.svg"
            alt=""
            width={32}
            height={32}
            className="mt-0.5 size-8 shrink-0"
          />
          <h2 id="migration-heading" className="section-heading">
            Zmieniasz system na nowy. Nie zaczynasz od zera
          </h2>
        </div>
        <p className="mt-4 text-[15px] leading-[22px] text-gray-600">
          Wszystkie dane z Fitssey lub innych systemów przeniosą się łatwo i bez zbędnych
          komplikacji
        </p>
        <Link
          href="/account/login"
          className="mt-5 inline-block text-[15px] font-medium leading-[22px] text-gray-800 underline underline-offset-2"
        >
          Zobacz, jak łatwo przenieść dane →
        </Link>
      </section>

      <div className="mt-8">
        <Divider />
      </div>

      <div className="mt-8">
        <FaqSection />
      </div>

      <section
        className="mx-auto mt-8 w-full max-w-6xl rounded-t-2xl bg-gray-200 px-5 py-4"
        aria-labelledby="final-cta-heading"
      >
        <p className="text-[14px] leading-6 text-gray-600">joga.yoga dla studiów</p>
        <div className="mx-auto max-w-xl text-center">
          <h2
            id="final-cta-heading"
            className="mt-4 text-[28px] font-semibold leading-[36px] tracking-[-0.7px] text-[#1c1917]"
          >
            Każde studio działa trochę inaczej
          </h2>
          <p className="mt-4 text-[17px] leading-[27px] text-[#78716c]">
            Nie wszystko wyjaśnimy na jednej stronie. Pytania o zajęcia, zapisy lub potrzeby studia
            można przesłać w wiadomości.
          </p>
        </div>
        <Button
          asChild
          className="mt-8 h-12 w-full rounded-full bg-[#1c1917] text-[16px] font-medium text-gray-100 hover:bg-[#292524]"
        >
          <Link href="/contact">Napisz do nas</Link>
        </Button>
      </section>
    </main>
  );
}

function HeroActions() {
  return (
    <>
      <Button
        asChild
        className="h-[34px] w-full rounded-full bg-gray-800 px-3 py-2 text-[15px] font-normal leading-[17px] text-white hover:bg-gray-700 md:w-auto"
      >
        <Link href="/studio/dodaj">
          Dodaj swoje studio
          <Image
            src="/images/marketing/studios/cta-arrow.svg"
            alt=""
            width={18}
            height={18}
            className="size-[18px]"
          />
        </Link>
      </Button>
      <div className="flex min-h-[37px] w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-[0_1px_1px_rgba(28,25,23,0.05)] md:w-auto">
        <Image
          src="/images/marketing/studios/mat.svg"
          alt=""
          width={16}
          height={16}
          className="size-4"
        />
        <p className="text-[12px] leading-[13px] text-gray-600">
          Zaprojektowane wokół realnej pracy studia jogi
        </p>
      </div>
    </>
  );
}
