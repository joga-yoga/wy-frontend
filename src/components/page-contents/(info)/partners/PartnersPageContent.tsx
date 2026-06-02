import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import CustomPartnersComunityIcon from "@/components/icons/CustomPartnersComunityIcon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { LogoPartners } from "./components/LogoPartners";

type PublicStats = {
  total_public_retreats: number;
  total_public_workshops: number;
  total_countries_with_public_retreats: number;
  total_public_retreats_in_poland: number;
  total_partners: number;
};

function polishPlural(count: number, forms: [string, string, string]) {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return forms[1];
  return forms[2];
}

function polishCountriesLocativePhrase(count: number) {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  const isSingular = mod10 === 1 && mod100 !== 11;
  const noun = isSingular ? "kraju" : "krajach";
  const pronoun = isSingular ? "w którym" : "w których";
  return `${noun}, ${pronoun} działamy`;
}

const addableItems = [
  {
    emoji: "🙋",
    desktopTitle: "Dodaj się jako instruktor jogi",
    desktopDescription:
      "Dokładnie sprawdź wszystkie dane i upewnij się, że wszystko jest gotowe przed publikacją",
    mobileTitle: "Instruktora jogi",
    mobileDescription: "Twój profil będzie widoczny na platformie jogi dla całej Polski",
  },
  {
    emoji: "🧘‍♀️",
    desktopTitle: "Wydarzenie jogowe",
    desktopDescription: "Dodaj zdjęcia, które zainspirują uczestników i oddadzą klimat wydarzenia",
    mobileTitle: "Wydarzenie jogowe",
    mobileDescription:
      "Pokaż warsztaty, spotkanie lub wydarzenie jogowe osobom szukającym jogi w Twoim mieście",
  },
  {
    emoji: "🎓",
    desktopTitle: "Kurs",
    desktopDescription: "Udostępnij swoją podróż i rozpocznij zapisy na praktykę",
    mobileTitle: "Kurs",
    mobileDescription:
      "Pokaż kurs jogi osobom, które szukają nauki, praktyki lub kursu dla początkujących",
  },
  {
    emoji: "🏕️",
    desktopTitle: "Wyjazd z jogą",
    desktopDescription:
      "Opisz swoje wydarzenie - AI pomoże automatycznie uzupełnić informacje o ofercie",
    mobileTitle: "Wyjazd z jogą",
    mobileDescription:
      "Dodaj wyjazd z jogą, wakacje jogowe lub weekendową praktykę dla osób z całej Polski",
  },
];

async function fetchCachedPublicStats(): Promise<PublicStats> {
  "use cache";

  cacheLife({ stale: 1800, revalidate: 1800, expire: 7200 });
  cacheTag("public-stats");

  const base = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_ENDPOINT is not configured");
  }

  // We intentionally use fetch here (and not axiosInstance):
  // - This is a server component; axiosInstance adds a browser-only localStorage interceptor,
  //   which breaks on the server.
  // - Cache Components keeps these public stats reusable without request-time refetching.
  const res = await fetch(`${base}/public/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch public stats: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as PublicStats;
}

async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    return await fetchCachedPublicStats();
  } catch (error) {
    console.error("Failed to fetch public stats:", error);
    return null;
  }
}

export const PartnersPageContent = async () => {
  const statsData = await fetchPublicStats();
  const stats = statsData
    ? [
        {
          title: String(statsData.total_public_retreats),
          description: `${polishPlural(statsData.total_public_retreats, ["wyjazd", "wyjazdy", "wyjazdów"])} z jogą w kalendarzu`,
        },
        {
          title: String(statsData.total_public_workshops),
          description: `${polishPlural(statsData.total_public_workshops, ["wydarzenie", "wydarzenia", "wydarzeń"])} z jogą w kalendarzu`,
        },
        {
          title: String(statsData.total_countries_with_public_retreats),
          description: polishCountriesLocativePhrase(
            statsData.total_countries_with_public_retreats,
          ),
        },
        {
          title: String(statsData.total_partners),
          description: `${polishPlural(statsData.total_partners, ["organizator", "organizatorzy", "organizatorów"])}`,
        },
      ]
    : [];
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section
        className="relative h-[80svh] lg:h-[720px] 2xl:h-[1000px] bg-cover bg-center rounded-b-2xl flex flex-col lg:flex-row lg:justify-between lg:items-center"
        style={{
          backgroundImage: "url('/images/partners/hero.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-[#000]/30 lg:bg-[#000]/0 rounded-b-2xl" />
        <div className="container-wy flex flex-row lg:justify-between lg:items-center w-full z-10 mx-auto h-full py-8 lg:py-[80px]">
          <div className="flex flex-col items-center lg:items-start justify-between lg:justify-between h-full px-4 lg:px-8 text-left text-white lg:text-black w-full">
            <Link href="/" className="mb-4 text-2xl font-bold">
              <LogoPartners variant="white-with-black-text" className="hidden lg:flex" />
              <LogoPartners variant="white" className="lg:hidden" />
            </Link>
            <div className="flex flex-col gap-4">
              <h1 className="text-center lg:text-left font-semibold text-4xl lg:text-[80px] lg:leading-[70px] tracking-tight text-white lg:text-gray-700">
                Dodaj <br />
                ogłoszenie
                <span className="hidden lg:inline">
                  <br />
                  jogowe
                </span>
              </h1>
              <p className="mx-auto max-w-[260px] text-center text-lg font-medium leading-[22px] text-gray-100 lg:mx-0 lg:max-w-xl lg:text-left lg:text-2xl lg:leading-6 lg:text-gray-700">
                To zajmie tylko kilka minut, ale zwiększy Twoją widoczność
              </p>
              <Link href={"/profile"} className="lg:hidden">
                <Button
                  size="lg"
                  className="mt-2 h-12 w-full bg-white !text-[22px] !font-medium !leading-[30px] text-black duration-200 hover:bg-white/90 lg:w-auto"
                >
                  Zacznij
                </Button>
              </Link>
            </div>
            {/* <div className="hidden lg:block lg:h-[128px] lg:w-full" /> */}
            <div className="h-[20px] lg:h-[128px] w-full" />
          </div>

          <div className="hidden lg:flex flex-col gap-6 p-12 bg-white/80 rounded-xl shadow-lg ">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center lg:items-start flex-1 min-w-[300px]"
              >
                <div className="text-h-middle font-semibold text-gray-900">{stat.title}</div>
                <div className="text-sub_description text-gray-600 mt-1 text-center lg:text-left">
                  {stat.description}
                </div>
              </div>
            ))}
            <Link href={"/profile"}>
              <Button
                size="cta"
                variant="cta"
                className="w-full rounded-lg !text-[22px] !font-medium !leading-[30px]"
              >
                Zacznij
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Separator className="container-wy mx-auto my-6 lg:my-10" />

      {/* "Co możesz dodać" Section */}
      <section className="">
        <div className="container-wy mx-auto px-4 lg:px-8">
          <h2 className="mb-6 lg:mb-12 text-center lg:text-left text-[22px] leading-[30px] lg:text-h-big text-gray-600">
            Co możesz dodać
          </h2>
          <div className="grid gap-[22px] lg:gap-6 lg:grid-cols-4">
            {addableItems.map((item) => (
              <div key={item.desktopTitle} className="flex flex-col gap-[22px]">
                <div className="text-center text-[46px] leading-[50px]" aria-hidden="true">
                  {item.emoji}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[18px] font-medium leading-7 text-gray-800">
                    <span className="hidden lg:inline">{item.desktopTitle}</span>
                    <span className="lg:hidden">{item.mobileTitle}</span>
                  </h3>
                  <p className="text-[18px] font-medium leading-[22px] text-gray-500">
                    <span className="hidden lg:inline">{item.desktopDescription}</span>
                    <span className="lg:hidden">{item.mobileDescription}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Separator className="container-wy mx-auto my-6 lg:my-10" />
      {/* "Co dostaniesz we wspówpracy" Section */}
      <section className="">
        <div className="container-wy mx-auto px-0 lg:px-8">
          <h2 className="px-4 lg:px-0 mb-6 lg:mb-12 text-center lg:text-left text-h-small lg:text-h-big text-gray-600">
            Dlaczego warto mieć profil na{" "}
            <span className="text-nowrap">
              joga
              <span className="inline-block bg-gray-600 rounded-md leading-[100%] pl-[2px] pt-[2px] pb-[4px] pr-[6px] text-gray-50">
                .yoga
              </span>
            </span>
          </h2>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 rounded-xl bg-gray-100 p-8 border border-gray-50 ">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-4 w-full">
              <div className="w-full flex flex-col justify-between gap-8 lg:gap-4 lg:py-3">
                <div>
                  <h3 className="text-subheader">Więcej rezerwacji</h3>
                  <p className="text-sub-descript-18 text-gray-500">
                    Zwiększ liczbę rezerwacji bez dodatkowego nakładu pracy
                  </p>
                </div>
                <div>
                  <h3 className="text-subheader">Dodatkowy sygnał dla Google</h3>
                  <p className="text-sub-descript-18 text-gray-500">
                    Profil na joga.yoga pomaga budować obecność marki w wynikach wyszukiwania
                  </p>
                </div>
                <div>
                  <h3 className="text-subheader">Wszystkie wydarzenia razem</h3>
                  <p className="text-sub-descript-18 text-gray-500">
                    Warsztaty, kursy i wyjazdy dostępne pod jednym profilem
                  </p>
                </div>
              </div>
              <div className="relative min-w-[280px] w-full lg:h-auto order-first lg:order-1">
                <Image
                  src="/images/partners/meditation1.png"
                  alt="Meditation"
                  className="rounded-lg object-cover w-full lg:h-full"
                  width={280}
                  height={200}
                />
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full">
              <div className="rounded-lg pl-0 py-4 pr-4 lg:p-4 bg-white border border-gray-300">
                <div className="flex items-center">
                  <CustomPartnersComunityIcon className="mr-6 text-primary w-[96px] min-w-[96px] lg:w-[128px]" />
                  <div>
                    <h3 className="text-subheader">Siła wspólnoty</h3>
                    <p className="text-m-sunscript-font lg:text-sub-descript-18 text-gray-500">
                      Społeczność joga.yoga wspiera Twoje ogłoszenia jogowe
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row gap-6 w-full">
                <div className="gap-6 w-full h-full flex flex-col justify-around">
                  <div>
                    <h3 className="text-subheader">Aktualizacja bez programisty</h3>
                    <p className="text-sub-descript-18 text-gray-500">
                      Zmieniaj informacje samodzielnie, bez pomocy agencji i webmasterów
                    </p>
                  </div>
                  <div>
                    <h3 className="text-subheader">Link, który możesz wysłać wszędzie</h3>
                    <p className="text-sub-descript-18 text-gray-500">
                      Jeden adres do udostępniania w social mediach, mailach i komunikatorach
                    </p>
                  </div>
                  <div>
                    <h3 className="text-subheader">Wspólna misja</h3>
                    <p className="text-sub-descript-18 text-gray-500">
                      Razem szerzymy spokój i radość jogi
                    </p>
                  </div>
                </div>
                <div className="relative min-w-[212px] lg:h-[212px]">
                  <Image
                    src="/images/partners/asana-yoga.png"
                    alt="Community"
                    width={212}
                    height={212}
                    className="object-cover rounded-lg w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Separator className="container-wy mx-auto my-6 lg:my-10" />
      {/* "Intencja" Section */}
      <section className="pb-10">
        <div className="container-wy mx-auto px-4 lg:px-8">
          <h2 className="mb-6 lg:mb-12 text-center lg:text-left text-h-small lg:text-h-big text-gray-600">
            Intencja
          </h2>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-4 w-full rounded-2xl bg-white p-8 border border-gray-100 shadow-[0px_8px_16px_8px_#F2F2F3]">
              <LogoPartners variant="black" className="w-full" />
              <div className="space-y-6 w-full">
                <div className="flex text-gray-500 text-m-descript lg:text-listing-description">
                  <span className="mr-5 min-w-12 w-12 text-center font-serif text-2xl text-gray-700">
                    एकम
                  </span>
                  <span>Działaj z serca - reszta przyjdzie naturalnie</span>
                </div>
                <div className="flex text-gray-500 text-m-descript lg:text-listing-description">
                  <span className="mr-5 min-w-12 w-12 text-center font-serif text-2xl text-gray-700">
                    द्वे
                  </span>
                  <span>Najważniejsze dzieje się w trakcie</span>
                </div>
                <div className="flex text-gray-500 text-m-descript lg:text-listing-description">
                  <span className="mr-5 min-w-12 w-12 text-center font-serif text-2xl text-gray-700">
                    त्रीणि
                  </span>
                  <span>Możesz nie być doskonały, ale bądź prawdziwy</span>
                </div>
              </div>
            </div>
            <div className="flex flex-row lg:flex-col text-center lg:text-left gap-5">
              <div className="flex justify-center lg:justify-start lg:min-w-[370px]">
                <Image
                  src="/images/partners/cat.png"
                  alt="Cat on a yoga mat"
                  width={370}
                  height={175}
                  className="rounded-2xl hidden lg:block"
                />
                <Image
                  src="/images/partners/dog.png"
                  alt="Dog on a yoga mat"
                  width={205}
                  height={140}
                  className="rounded-2xl block lg:hidden"
                />
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex justify-between text-lg lg:max-w-[370px] w-full h-full">
                  <span className="mr-2 min-w-12 w-12 font-serif text-2xl text-gray-700 hidden lg:block">
                    चत्वारि
                  </span>
                  <span className="text-left lg:text-center text-subheader text-gray-500 lg:pr-5">
                    Nie musisz być wielki, by zacząć
                  </span>
                </div>
                <Link href={"/profile"}>
                  <Button
                    size="lg"
                    className="h-12 w-full bg-gray-600 !text-[22px] !font-medium !leading-[30px] text-white hover:bg-gray-600/90"
                    variant="secondary"
                  >
                    Zacznij
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Separator className="container-wy mx-auto my-6 lg:my-10" />
    </div>
  );
};
