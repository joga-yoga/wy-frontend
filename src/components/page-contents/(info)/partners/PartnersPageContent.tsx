import Image from "next/image";
import Link from "next/link";

import { WyImage } from "@/components/custom/WyImage";
import CustomPartnersComunityIcon from "@/components/icons/CustomPartnersComunityIcon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { getPartnersData, type PartnerExample, type PartnerStat } from "./partners-data";

const focusClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-4";
const offers = [
  {
    title: "Osobista strona nauczyciela jogi",
    description:
      "Doświadczenie, style praktyki, miejsca zajęć, warsztaty i wyjazdy w jednym profilu",
    icon: "logo-solo-instructor.png",
    href: "/instruktor/dodaj",
  },
  {
    title: "Strona studia jogi",
    description: "Utwórz stronę swojego studia jogi i zacznij przyjmować zapisy nowych uczniów",
    icon: "logo-studio.png",
    href: "/studio/dodaj",
  },
  {
    title: "Wydarzenie jogowe",
    description:
      "Pokaż warsztaty, spotkanie lub wydarzenie jogowe osobom szukającym jogi w Twoim mieście",
    icon: "logo-workshops.png",
    href: "/wydarzenia/dodaj",
  },
  {
    title: "Kursy jogi i kursy nauczycielskie",
    description:
      "Na joga.yoga można dodać kurs jogi, dłuższy cykl zajęć albo kurs dla przyszłych nauczycieli",
    icon: "logo-courses.png",
    href: "/wydarzenia/dodaj",
  },
  {
    title: "Wyjazdy jogowe",
    description:
      "Weekend z jogą, wakacje jogowe albo dłuższy retreat mogą mieć program, miejsce i ważne szczegóły",
    icon: "logo-retreats.png",
    href: "/wyjazdy/dodaj",
  },
  {
    title: "System do zarządzania biznesem",
    description: "Twórz grafik zajęć, przyjmuj zapisy i zarządzaj studiem",
    icon: "logo-crm.png",
    href: "/system-dla-studiow-jogi",
  },
];

function Divider({ first = false }: { first?: boolean }) {
  return (
    <div
      className={`mx-auto flex h-[50px] max-w-[1298px] items-center px-8 lg:h-[93px] ${first ? "hidden lg:flex" : ""}`}
      aria-hidden="true"
    >
      <Separator className="bg-gray-200" />
    </div>
  );
}

function Hero({ stats }: { stats: PartnerStat[] }) {
  return (
    <section
      aria-labelledby="partners-title"
      className="relative isolate h-[580px] overflow-hidden rounded-t-[22px] rounded-b-lg lg:h-[695px]"
    >
      <Image
        src="/images/partners/hero-coast.png"
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover lg:object-bottom"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(25,47,40,0.188),rgba(26,46,40,0.05))] lg:hidden" />
      <div className="mx-auto flex h-full max-w-[1201px] flex-col items-center px-8 lg:flex-row lg:justify-between lg:gap-12">
        <div className="flex h-full w-full flex-col items-center pt-8 pb-[49px] lg:max-w-[478px] lg:items-start lg:pt-20 lg:pb-[142px]">
          <Link
            href="/"
            aria-label="joga.yoga — strona główna"
            className={`flex flex-col items-center gap-1.5 rounded-lg lg:gap-3 ${focusClass}`}
          >
            <span className="grid size-8 place-items-center rounded-full bg-white shadow-[0.5px_0.5px_8px_5px_rgba(255,252,238,0.5)] lg:size-[65px] lg:shadow-[1px_1px_16px_10px_rgba(255,252,238,0.5)]">
              <Image
                src="/images/partners/brand-mark.svg"
                alt=""
                width={35}
                height={32}
                className="h-4 w-[17.5px] lg:h-8 lg:w-[35px]"
              />
            </span>
            <span className="flex items-center py-2 text-[22px] leading-[25px] font-semibold tracking-[-0.02em] text-white lg:py-0 lg:text-[30px] lg:leading-[30px]">
              joga<span className="rounded bg-gray-800 py-0.5 pr-1.5">.yoga</span>
            </span>
          </Link>
          <p className="mt-1 text-[15px] leading-[22px] text-white lg:hidden">
            Dla ludzi jogi w Polsce
          </p>
          <div className="mt-[42px] w-full text-center text-gray-50 lg:mt-auto lg:text-left">
            <h1
              id="partners-title"
              className="text-[46px] leading-[50px] font-semibold tracking-[-0.03em] lg:text-[80px] lg:leading-[70px]"
            >
              Pokaż
              <br />
              swoją jogę
            </h1>
            <p className="mx-auto mt-2 max-w-[478px] text-[18px] leading-7 font-medium tracking-[-0.01em] lg:mt-4 lg:text-[24px] lg:leading-[30px]">
              Profil nauczyciela, studio, grafik lub wydarzenie w jednym miejscu
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-auto h-[33px] w-[min(100%,248px)] rounded-[22px] border border-gray-700 bg-white px-3 py-2 text-[15px] leading-[17px] font-normal text-gray-700 hover:bg-gray-100 lg:mt-9 lg:h-[43px] lg:w-full lg:text-[20px] lg:font-medium"
          >
            <Link href="/account/login">Zacznij tworzyć</Link>
          </Button>
        </div>
        {stats.length > 0 && (
          <dl className="hidden min-h-[535px] w-[35.2%] max-w-[400px] shrink-0 flex-col justify-center gap-6 rounded-[22px] bg-gray-50/76 px-[clamp(24px,3.2vw,46px)] py-10 lg:flex">
            {stats.map((stat) => (
              <div key={stat.description}>
                <dt className="text-[30px] leading-[41px] font-semibold tracking-[-0.02em] text-gray-600">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-[18px] leading-[22px] font-medium tracking-[-0.02em] text-gray-800">
                  {stat.description}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

function Offers() {
  return (
    <section
      aria-labelledby="partners-offers-title"
      className="mx-auto max-w-[1440px] px-4 pt-8 lg:px-[45px] lg:pt-[45px]"
    >
      <h2
        id="partners-offers-title"
        className="text-[20px] leading-[30px] font-medium tracking-[-0.01em] text-gray-800 lg:mx-auto lg:max-w-[1234px] lg:text-[46px] lg:leading-[50px] lg:font-semibold lg:tracking-[-0.03em]"
      >
        Co można stworzyć na joga.yoga
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:mt-[45px] lg:grid-cols-3 lg:gap-6 lg:px-8">
        {offers.map((offer) => (
          <Link
            key={offer.icon}
            href={offer.href}
            aria-label={offer.title}
            className={`group relative flex min-h-[190px] min-w-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs transition-colors hover:bg-gray-50 lg:min-h-0 lg:gap-[22px] lg:border-transparent lg:p-0 lg:shadow-none ${focusClass}`}
          >
            <Image
              src={`/images/logo/${offer.icon}`}
              alt=""
              width={50}
              height={50}
              className="size-9 object-contain lg:mx-auto lg:size-[50px]"
            />
            <Image
              src="/images/partners/card-arrow.svg"
              alt=""
              width={24}
              height={24}
              className="absolute top-4 right-2 lg:hidden"
            />
            <div>
              <h3 className="text-[16px] leading-[18px] font-medium text-gray-800 lg:text-[18px] lg:leading-7 lg:tracking-[-0.01em]">
                {offer.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[18px] font-medium text-gray-500 lg:mt-0 lg:text-[18px] lg:leading-[25px] lg:tracking-[-0.02em]">
                {offer.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Benefit({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <h3 className="text-[18px] leading-7 font-medium tracking-[-0.01em] text-gray-800">
        {title}
      </h3>
      <p className="text-[18px] leading-[22px] font-medium tracking-[-0.02em] text-gray-500">
        {children}
      </p>
    </div>
  );
}

function StudioTools({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/system-dla-studiow-jogi"
      aria-label="Narzędzia dla studiów"
      className={`group flex items-start gap-4 rounded-lg transition-colors hover:bg-white/60 ${focusClass} ${className}`}
    >
      <Benefit title="Narzędzia dla studiów">
        Grafik, zajęcia i zapisy pomagają prowadzić studio w prostym systemie
      </Benefit>
      <Image
        src="/images/partners/card-arrow.svg"
        alt=""
        width={24}
        height={24}
        className="mt-0.5 shrink-0 lg:hidden"
      />
    </Link>
  );
}

function Benefits() {
  return (
    <section
      aria-labelledby="partners-benefits-title"
      className="mx-auto max-w-[1440px] lg:px-[45px]"
    >
      <h2
        id="partners-benefits-title"
        className="px-8 text-[22px] leading-[30px] font-medium tracking-[-0.02em] text-gray-800 lg:px-0 lg:text-[46px] lg:leading-[50px] lg:font-semibold lg:tracking-[-0.03em] lg:text-gray-600"
      >
        joga.yoga to:
      </h2>
      <div className="mt-4 grid gap-6 rounded-[22px] border border-gray-50 bg-gray-100 p-8 lg:mt-9 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-9 lg:p-[clamp(32px,6.67vw,96px)]">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-[14px]">
          <div className="flex flex-col gap-4">
            <Benefit title="Wspólna przestrzeń branży">
              Więcej widocznej jogi to więcej osób, które mogą zacząć praktykę
            </Benefit>
            <Benefit title="Joga widoczna lokalnie">
              Łatwiej znaleźć studia, nauczycieli i wydarzenia w każdym mieście
            </Benefit>
            <StudioTools className="hidden lg:flex" />
          </div>
          <div className="relative aspect-[290/196] overflow-hidden rounded-[11px] lg:aspect-auto lg:min-h-[248px]">
            <Image
              src="/images/partners/meditation1.png"
              alt="Medytacja w górach o wschodzie słońca"
              fill
              sizes="(min-width:1024px) 281px, (min-width:600px) 700px, 338px"
              className="object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:gap-3">
          <div className="order-2 flex items-center justify-center gap-8 rounded-[11px] border border-gray-300 bg-white px-3 py-4 lg:order-none">
            <CustomPartnersComunityIcon className="h-[54px] w-24 shrink-0" aria-hidden="true" />
            <div className="max-w-[186px] text-[15px] leading-[18px]">
              <h3 className="font-medium text-gray-800">Siła wspólnoty</h3>
              <p className="font-normal text-gray-500">
                Społeczność joga.yoga wspiera Twoją działalność
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <Benefit title="Strony bez programisty">
                Estetyczna obecność w internecie bez budowania strony od zera
              </Benefit>
              <Benefit title="Zapisy bliżej decyzji">
                Osoba widzi ofertę i może od razu zrobić kolejny krok
              </Benefit>
            </div>
            <div className="relative hidden w-[clamp(100px,11.12vw,160px)] shrink-0 self-stretch overflow-hidden rounded-[11px] lg:block">
              <Image
                src="/images/partners/practice.png"
                alt="Spokojna praktyka medytacji"
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          </div>
          <StudioTools className="order-3 lg:hidden" />
        </div>
      </div>
    </section>
  );
}

function Registration() {
  return (
    <section aria-label="Dołącz do joga.yoga" className="px-8 pb-[34px] lg:bg-gray-50 lg:py-[77px]">
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-4 lg:gap-6">
        <p className="text-center text-[18px] leading-[25px] font-medium tracking-[-0.02em] text-gray-700 lg:text-[24px] lg:leading-[30px] lg:tracking-[-0.01em]">
          Pokaż swoją pracę. Może właśnie dzięki Tobie ktoś zrobi pierwszy krok na matę
        </p>
        <Button
          asChild
          variant="cta"
          className="h-auto min-h-[33px] w-full rounded-[22px] px-3 py-2 text-[15px] leading-[17px] font-normal whitespace-normal lg:min-h-[43px] lg:py-[13px] lg:text-[20px] lg:font-medium"
        >
          <Link href="/account/login">
            <span className="lg:hidden">Zarejestruj się i działaj</span>
            <span className="hidden lg:inline">Dołącz teraz i stwórz profil</span>
          </Link>
        </Button>
      </div>
    </section>
  );
}

function ExampleCard({ example }: { example: PartnerExample }) {
  return (
    <Link
      href={example.href}
      className={`group flex min-w-0 flex-col gap-3 rounded-3xl border border-gray-200 bg-gray-50 px-6 py-2 transition-colors hover:bg-gray-100 lg:gap-5 lg:p-6 ${focusClass}`}
    >
      <h3 className="text-[20px] leading-7 font-medium text-gray-700 lg:leading-8">
        {example.heading}
      </h3>
      <div className="relative h-40 overflow-hidden rounded-xl bg-gray-100 lg:h-60">
        {example.imageId && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
          <WyImage
            src={example.imageId}
            alt={example.name}
            fill
            sizes="(min-width:1440px) 362px, (min-width:1024px) 28vw, (min-width:600px) 700px, 290px"
            className="object-cover"
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
      <div className="px-6 lg:px-0">
        <p className="text-[15px] leading-[18px] font-medium text-gray-700 lg:text-[18px] lg:leading-7">
          {example.name}
        </p>
        {example.subtitle && (
          <p className="mt-1 text-[15px] leading-[18px] font-normal text-gray-500">
            {example.subtitle}
          </p>
        )}
      </div>
      <div className="mt-auto flex items-center justify-end lg:justify-between">
        <span className="sr-only text-[15px] leading-[18px] text-gray-500 lg:not-sr-only">
          {example.action}
        </span>
        <Image
          src="/images/partners/card-arrow.svg"
          alt=""
          width={24}
          height={24}
          className="lg:hidden"
        />
        <Image
          src="/images/partners/example-arrow.svg"
          alt=""
          width={16}
          height={16}
          className="hidden lg:block"
        />
      </div>
    </Link>
  );
}

export async function PartnersPageContent() {
  const { stats, examples } = await getPartnersData();
  return (
    <main className="bg-white text-gray-800">
      <Hero stats={stats} />
      <Divider first />
      <Offers />
      <Divider />
      <Benefits />
      <Divider />
      <Registration />
      {examples.length > 0 && (
        <>
          <Divider />
          <section
            aria-labelledby="partners-examples-title"
            className="mx-auto max-w-[1440px] px-8 py-6 lg:px-20 lg:py-0"
          >
            <h2
              id="partners-examples-title"
              className="text-[22px] leading-[30px] font-medium tracking-[-0.02em] text-gray-700"
            >
              Przykłady stron na joga.yoga
            </h2>
            <div className="mt-6 grid gap-4 lg:mt-12 lg:grid-cols-3 lg:gap-6">
              {examples.map((example) => (
                <ExampleCard key={example.kind} example={example} />
              ))}
            </div>
          </section>
        </>
      )}
      <Divider />
    </main>
  );
}
