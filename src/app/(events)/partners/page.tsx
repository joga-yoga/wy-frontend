import {
  Camera,
  CheckCheck,
  CheckCircle,
  Clock,
  FileText,
  ImagePlus,
  Megaphone,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import CustomPartnersComunityIcon from "@/components/icons/CustomPartnersComunityIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { LogoPartners } from "./components/LogoPartners";

export const revalidate = 300;

type PublicStats = {
  total_public_events: number;
  total_countries_with_public_events: number;
  total_public_events_in_poland: number;
  total_organizers: number;
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

async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_ENDPOINT;
    if (!base) return null;
    // We intentionally use fetch here (and not axiosInstance):
    // - This is a server component; axiosInstance adds a browser-only localStorage interceptor,
    //   which breaks on the server.
    // - fetch integrates with Next.js caching/ISR (see revalidate: 300) for better performance.
    const res = await fetch(`${base}/public/stats`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as PublicStats;
  } catch {
    return null;
  }
}

const PartnersPage = async () => {
  const statsData = await fetchPublicStats();
  const stats = statsData
    ? [
        {
          title: String(statsData.total_public_events),
          description: `${polishPlural(statsData.total_public_events, ["wyjazd", "wyjazdy", "wyjazdów"])} z jogą w kalendarzu`,
        },
        {
          title: String(statsData.total_countries_with_public_events),
          description: polishCountriesLocativePhrase(statsData.total_countries_with_public_events),
        },
        {
          title: String(statsData.total_public_events_in_poland),
          description: `${polishPlural(statsData.total_public_events_in_poland, ["wyjazd", "wyjazdy", "wyjazdów"])} z jogą w Polsce`,
        },
        {
          title: String(statsData.total_organizers),
          description: `${polishPlural(statsData.total_organizers, ["organizator", "organizatorzy", "organizatorów"])}`,
        },
      ]
    : [];
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section
        className="relative md:h-[700px] bg-cover bg-center rounded-b-2xl flex flex-col md:flex-row md:justify-between md:items-center"
        style={{
          backgroundImage: "url('/images/partners/hero.png')",
        }}
      >
        <div className="absolute inset-0 bg-[#000]/30 md:bg-[#000]/0 rounded-b-2xl" />
        <div className="container-wy flex flex-row md:justify-between md:items-end w-full z-10 mx-auto h-full py-8 md:py-[80px]">
          <div className="flex flex-col items-center md:items-start md:justify-between h-full px-4 md:px-8 text-left text-white w-full">
            <Link href="/" className="mb-4 text-2xl font-bold">
              <LogoPartners />
            </Link>
            <div className="flex flex-col gap-4">
              <h1 className="text-center md:text-left font-semibold text-4xl md:text-[92px] md:leading-[88px] tracking-tight">
                Współpraca <br />
                Partnerska
              </h1>
              <p className="max-w-xl text-sm font-medium md:text-descrip-under-header text-center md:text-left md:mb-[60px]">
                Publikacja gratis. <br />
                Podlinkuj nas w podziękowaniu.
              </p>
              <Link href="/dashboard" className="md:hidden">
                <Button
                  size="lg"
                  className="mt-2 text-black bg-white hover:bg-white/90 duration-200 w-full md:w-auto"
                >
                  Dołącz do nas
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-6 p-12 bg-white/95 rounded-xl shadow-lg ">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center md:items-start flex-1 min-w-[300px]"
              >
                <div className="text-h-middle font-semibold text-gray-900">{stat.title}</div>
                <div className="text-sub_description text-gray-600 mt-1 text-center md:text-left">
                  {stat.description}
                </div>
              </div>
            ))}
            <Link href="/dashboard">
              <Button size="cta" variant="cta" className="w-full rounded-lg">
                Dołącz do nas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* "Jak to wygląda krok po kroku" Section */}
      <section className="pt-10">
        <div className="container-wy mx-auto px-4 md:px-8">
          <h2 className="mb-6 md:mb-12 text-center md:text-left text-h-small md:text-h-big text-gray-800">
            Jak to wygląda krok po kroku
          </h2>
          <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-none flex flex-col justify-between">
              <div>
                <CardHeader className="px-0 pt-0 pb-2 flex-col gap-5 space-y-0">
                  <Sparkles className="h-8 w-8 text-primary mx-auto md:mx-0" />
                  <CardTitle className="text-subheader font-medium">
                    Dodaj szczegóły wyjazdu
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-4 md:pb-6">
                  <p className="text-gray-500 text-sub-descript-18">
                    Opisz swoje wydarzenie - AI pomoże automatycznie uzupełnić informacje o ofercie.
                  </p>
                </CardContent>
              </div>

              <CardFooter className="px-0 flex items-center text-m-sunscript-font text-gray-500">
                <Clock className="mr-2 h-6 w-6" /> 3 min
              </CardFooter>
            </Card>
            <Card className="border-0 shadow-none flex flex-col justify-between">
              <div>
                <CardHeader className="px-0 pt-0 pb-2 flex-col gap-5 space-y-0">
                  <ImagePlus className="h-8 w-8 text-primary mx-auto md:mx-0" />
                  <CardTitle className="text-subheader font-medium">Dodaj zdjęcia</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-4 md:pb-6">
                  <p className="text-gray-500 text-sub-descript-18">
                    Dodaj atrakcyjne zdjęcia, pokazujące atmosferę i najważniejsze elementy
                    programu.
                  </p>
                </CardContent>
              </div>

              <CardFooter className="px-0 flex items-center text-m-sunscript-font text-gray-500">
                <Clock className="mr-2 h-6 w-6" /> 1 min
              </CardFooter>
            </Card>
            <Card className="border-0 shadow-none flex flex-col justify-between">
              <div>
                <CardHeader className="px-0 pt-0 pb-2 flex-col gap-5 space-y-0">
                  <CheckCheck className="h-8 w-8 text-primary mx-auto md:mx-0" />
                  <CardTitle className="text-subheader font-medium">Sprawdź i zatwierdź</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-4 md:pb-6">
                  <p className="text-gray-500 text-sub-descript-18 md:min-h-[66px]">
                    Dokładnie sprawdź wszystkie dane i upewnij się, że wszystko jest gotowe.
                  </p>
                </CardContent>
              </div>
              <CardFooter className="px-0 flex items-center text-m-sunscript-font text-gray-500">
                <Clock className="mr-2 h-6 w-6" /> 1 min
              </CardFooter>
            </Card>
            <Card className="border-0 shadow-none flex flex-col justify-between">
              <div>
                <CardHeader className="px-0 pt-0 pb-2 flex-col gap-5 space-y-0">
                  <Megaphone className="h-8 w-8 text-primary mx-auto md:mx-0" />
                  <CardTitle className="text-subheader font-medium">Publikacja</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-4 md:pb-6">
                  <p className="text-gray-500 text-sub-descript-18">
                    Udostępnij swoją podróż i rozpocznij zapisy na praktykę.
                  </p>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>
      <Separator className="container-wy mx-auto my-6 md:my-10" />
      {/* "Co dostaniesz w spówpracy" Section */}
      <section className="">
        <div className="container-wy mx-auto px-0 md:px-8">
          <h2 className="px-4 md:px-0 mb-6 md:mb-12 text-center md:text-left text-h-small md:text-h-big text-gray-800">
            Co dostaniesz w spówpracy z wyjazdy
            <span className="inline-block bg-gray-600 rounded-md leading-[100%] pl-[2px] pt-[2px] pb-[4px] pr-[6px] text-gray-50">
              .yoga
            </span>
          </h2>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 rounded-xl bg-gray-100 p-8 border border-gray-50 ">
            <div className="flex flex-col md:flex-row gap-8 md:gap-4 w-full">
              <div className="w-full flex flex-col justify-between gap-8 md:gap-4 md:py-3">
                <div>
                  <h3 className="text-subheader">Więcej rezerwacji</h3>
                  <p className="text-sub-descript-18 text-gray-500">
                    Zwiększ liczbę rezerwacji bez dodatkowego nakładu pracy.
                  </p>
                </div>
                <div>
                  <h3 className="text-subheader">Transparentne warunki</h3>
                  <p className="text-sub-descript-18 text-gray-500">
                    Zero ukrytych kosztów, tylko prośba o link.
                  </p>
                </div>
                <div>
                  <h3 className="text-subheader">Szerszy zasięg marki</h3>
                  <p className="text-sub-descript-18 text-gray-500">
                    Twoja nazwa trafia jeszce dalej.
                  </p>
                </div>
              </div>
              <div className="relative min-w-[280px] w-full md:h-auto order-first md:order-1">
                <Image
                  src="/images/partners/meditation1.png"
                  alt="Meditation"
                  className="rounded-lg object-cover w-full md:h-full"
                  width={280}
                  height={200}
                />
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full">
              <div className="rounded-lg pl-0 py-4 pr-4 md:p-4 bg-white border border-gray-300">
                <div className="flex items-center">
                  <CustomPartnersComunityIcon className="mr-6 text-primary w-[96px] min-w-[96px] md:w-[128px]" />
                  <div>
                    <h3 className="text-subheader">Siła wspólnoty</h3>
                    <p className="text-m-sunscript-font md:text-sub-descript-18 text-gray-500">
                      Społeczność wyjazdy.yoga wspiera Twoje wyjazdy
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="gap-6 w-full h-full flex flex-col justify-around">
                  <div>
                    <h3 className="text-subheader">Zaufanie społeczności</h3>
                    <p className="text-sub-descript-18 text-gray-500">
                      Budujesz zaufanie wśród joginek i joginów
                    </p>
                  </div>
                  <div>
                    <h3 className="text-subheader">Wspólna misja</h3>
                    <p className="text-sub-descript-18 text-gray-500">
                      Razem szerzymy spokój i radość jogi.
                    </p>
                  </div>
                </div>
                <div className="relative min-w-[212px] md:h-[212px]">
                  <Image
                    src="/images/partners/meditation2.png"
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
      <Separator className="container-wy mx-auto my-6 md:my-10" />
      {/* "Intencja" Section */}
      <section className="pb-10">
        <div className="container-wy mx-auto px-4 md:px-8">
          <h2 className="mb-6 md:mb-12 text-center md:text-left text-h-small md:text-h-big text-gray-800">
            Intencja
          </h2>
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-4 w-full rounded-2xl bg-white p-8 border border-gray-100 shadow-[0px_8px_16px_8px_#F2F2F3]">
              <LogoPartners variant="black" className="w-full" />
              <div className="space-y-6 w-full">
                <div className="flex text-gray-800 text-m-descript md:text-listing-description">
                  <span className="mr-5 min-w-12 w-12 text-center font-serif text-2xl italic text-gray-700">
                    एकम
                  </span>
                  <span>Działaj z serca - reszta przyjdzie naturalnie</span>
                </div>
                <div className="flex text-gray-800 text-m-descript md:text-listing-description">
                  <span className="mr-5 min-w-12 w-12 text-center font-serif text-2xl italic text-gray-700">
                    द्वे
                  </span>
                  <span>Najważniejsze dzieje się w trakcie</span>
                </div>
                <div className="flex text-gray-800 text-m-descript md:text-listing-description">
                  <span className="mr-5 min-w-12 w-12 text-center font-serif text-2xl italic text-gray-700">
                    त्रीणि
                  </span>
                  <span>Możesz nie być doskonały, ale bądź prawdziwy</span>
                </div>
              </div>
            </div>
            <div className="flex flex-row md:flex-col text-center md:text-left gap-5">
              <div className="flex justify-center md:justify-start md:min-w-[370px]">
                <Image
                  src="/images/partners/cat.png"
                  alt="Cat on a yoga mat"
                  width={370}
                  height={175}
                  className="rounded-2xl hidden md:block"
                />
                <Image
                  src="/images/partners/dog.png"
                  alt="Dog on a yoga mat"
                  width={205}
                  height={140}
                  className="rounded-2xl block md:hidden"
                />
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex justify-between text-lg md:max-w-[370px] w-full h-full">
                  <span className="mr-2 min-w-12 w-12 font-serif text-2xl italic text-gray-700 hidden md:block">
                    चत्वारि
                  </span>
                  <span className="text-left md:text-center text-subheader text-gray-800 md:pr-5">
                    Nie musisz być wielki, by zacząć
                  </span>
                </div>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="w-full bg-gray-600 text-white hover:bg-gray-600/90"
                    variant="secondary"
                  >
                    Dołącz
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnersPage;
