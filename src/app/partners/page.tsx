import { Camera, CheckCircle, Clock, FileText, Send, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PartnersPage = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section
        className="relative h-[70vh] bg-cover bg-center rounded-b-2xl"
        style={{
          backgroundImage: "url('/images/partners/hero.png')",
        }}
      >
        <div className="absolute inset-0 bg-[#000]/0" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-start justify-center px-4 md:px-8 text-left text-white">
          <Link href="/" className="mb-4 text-2xl font-bold">
            wyjazdy.yoga
          </Link>
          <h1 className="text-5xl font-extrabold md:text-7xl">
            Współpraca <br />
            Partnerska
          </h1>
          <p className="mt-4 max-w-xl text-lg md:text-xl">
            Publikacja gratis. Podlinkuj nas w podziękowaniu.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="mt-8 text-black bg-white hover:bg-white/90 duration-200">
              Dołącz do nas
            </Button>
          </Link>
        </div>
      </section>

      {/* "Jak to wygląda krok po kroku" Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="mb-12 text-center text-4xl font-bold">Jak to wygląda krok po kroku</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-none">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle>Dodaj szczegóły</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Opisz swoje wydarzenie - AI pomoże automatycznie uzupełnić informacje o ofercie.
                </p>
              </CardContent>
              <CardContent className="flex items-center text-sm text-gray-500">
                <Clock className="mr-2 h-4 w-4" /> 3 min
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <Camera className="h-8 w-8 text-primary" />
                <CardTitle>Dodaj zdjęcia</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Dodaj atrakcyjne zdjęcia, pokazujące atmosferę i najważniejsze elementy programu.
                </p>
              </CardContent>
              <CardContent className="flex items-center text-sm text-gray-500">
                <Clock className="mr-2 h-4 w-4" /> 1 min
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <CheckCircle className="h-8 w-8 text-primary" />
                <CardTitle>Sprawdź i zatwierdź</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Dokładnie sprawdź wszystkie dane i upewnij się, że wszystko jest gotowe.</p>
              </CardContent>
              <CardContent className="flex items-center text-sm text-gray-500">
                <Clock className="mr-2 h-4 w-4" /> 1 min
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <Send className="h-8 w-8 text-primary" />
                <CardTitle>Publikacja</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Udostępnij swoją podróż i rozpocznij zapisy na praktykę.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* "Co dostaniesz w spówpracy" Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="mb-12 text-left text-4xl font-bold">
            Co dostaniesz w spówpracy z wyjazdy.yoga
          </h2>
          <div className="flex flex-col md:flex-row md:gap-8 rounded-xl bg-white p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="space-y-8">
                <div>
                  <h3 className="mb-2 text-subheader">Więcej rezerwacji</h3>
                  <p className="text-sub-description">
                    Zwiększ liczbę rezerwacji bez dodatkowego nakładu pracy.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-subheader">Transparentne warunki</h3>
                  <p className="text-sub-description">
                    Zero ukrytych kosztów, tylko prośba o link.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-subheader">Szerszy zasięg marki</h3>
                  <p className="text-sub-description">Twoja nazwa trafia jeszce dalej.</p>
                </div>
              </div>
              <div className="relative min-w-[280px]">
                <Image
                  src="/images/partners/meditation1.png"
                  alt="Meditation"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full">
              <div className="rounded-lg border p-4">
                <div className="flex items-start">
                  <Users className="mr-4 h-8 w-8 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="mb-2 text-subheader">Siła wspólnoty</h3>
                    <p className="text-sub-description">
                      Społeczność wyjazdy.yoga wspiera Twoje wyjazdy.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="space-y-8 w-full">
                  <div>
                    <h3 className="mb-2 text-subheader">Zaufanie społeczności</h3>
                    <p className="text-sub-description">
                      Budujesz zaufanie wśród joginek i joginów.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-subheader">Wspólna misja</h3>
                    <p className="text-sub-description">Razem szerzymy spokój i radość jogi.</p>
                  </div>
                </div>
                <div className="relative min-w-[200px] h-[200px]">
                  <Image
                    src="/images/partners/meditation2.png"
                    alt="Community"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "Intencja" Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="mb-12 text-left text-4xl font-bold">Intencja</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full rounded-lg bg-gray-50 p-8">
              <div className="mb-8 text-center text-2xl font-bold w-full">wyjazdy.yoga</div>
              <div className="space-y-6 w-full">
                <div className="flex items-center text-lg">
                  <span className="mr-4 w-12 font-serif text-2xl italic text-gray-400">एकम</span>
                  <span>Działaj z serca - reszta przyjdzie naturalnie</span>
                </div>
                <div className="flex items-center text-lg">
                  <span className="mr-4 w-12 font-serif text-2xl italic text-gray-400">द्वे</span>
                  <span>Najważniejsze dzieje się w trakcie</span>
                </div>
                <div className="flex items-center text-lg">
                  <span className="mr-4 w-12 font-serif text-2xl italic text-gray-400">त्रीणि</span>
                  <span>Możesz nie być doskonały, ale bądź prawdziwy</span>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start">
                <Image
                  src="/images/partners/cat.png"
                  alt="Cat on a yoga mat"
                  width={350}
                  height={175}
                  className="rounded-lg"
                />
              </div>
              <div className="mt-8 flex items-center text-lg">
                <span className="mr-4 w-12 font-serif text-2xl italic text-gray-400">चत्वारि</span>
                <span>
                  Nie musisz być wielki, by zacząć. Zacznij teraz - to zajmie tylko chwilę
                </span>
              </div>
              <Link href="/dashboard">
                <Button size="lg" className="mt-8 w-full" variant="secondary">
                  Dołącz
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnersPage;
