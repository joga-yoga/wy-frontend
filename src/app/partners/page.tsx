import { Camera, CheckCircle, FileText, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const PartnersPage = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section
        className="relative h-[60vh] bg-cover bg-center"
        style={{
          backgroundImage: "url('https://placehold.co/1920x1080/2c3e50/ffffff?text=Wielki+Las')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
          <Link href="/" className="mb-4 text-2xl font-bold">
            wyjazdy.yoga
          </Link>
          <h1 className="text-5xl font-extrabold md:text-7xl">Współpraca Partnerska</h1>
          <p className="mt-4 text-lg md:text-xl">
            Publikacja gratis. Podlinkuj nas w podziękowaniu.
          </p>
        </div>
      </section>

      {/* "Jak to wygląda krok po kroku" Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-12 text-4xl font-bold">Jak to wygląda krok po kroku</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle>Dodaj szczegóły wyjazdu</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Opisz swoje wydarzenie - AI pomoże automatycznie uzupełnić informacje o ofercie.
                </p>
              </CardContent>
              <CardFooter className="justify-center text-sm text-gray-500">
                <span>&#128337; 3 min</span>
              </CardFooter>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <Camera className="h-6 w-6" />
                </div>
                <CardTitle>Dodaj zdjęcia</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Dodaj atrakcyjne zdjęcia, pokazujące atmosferę, miejsce praktyki i najważniejsze
                  elementy programu.
                </p>
              </CardContent>
              <CardFooter className="justify-center text-sm text-gray-500">
                <span>&#128337; 1 min</span>
              </CardFooter>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <CardTitle>Sprawdź i zatwierdź</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Dokładnie sprawdź wszystkie dane i upewnij się, że wszystko jest gotowe przed
                  publikacją.
                </p>
              </CardContent>
              <CardFooter className="justify-center text-sm text-gray-500">
                <span>&#128337; 1 min</span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* "Co dostaniesz w spówpracy" Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-4xl font-bold">
            Co dostaniesz w spówprace z wyjazdy.yoga
          </h2>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-8">
              <div>
                <h3 className="mb-2 text-2xl font-semibold">Więcej rezerwacji</h3>
                <p>Zwiększ liczbę rezerwacji bez dodatkowego nakładu pracy.</p>
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-semibold">Transparentne warunki</h3>
                <p>Zero ukrytych kosztów, tylko prośba o link.</p>
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-semibold">Szerszy zasięg marki</h3>
                <p>Twoja nazwa trafia jeszce dalej.</p>
              </div>
            </div>
            <div className="relative h-96 w-full">
              <Image
                src="https://placehold.co/600x400/d1d5db/374151?text=Meditacja"
                alt="Meditation"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="mt-16 grid items-center gap-12 md:grid-cols-2">
            <div className="relative h-96 w-full md:order-last">
              <Image
                src="https://placehold.co/600x400/e5e7eb/4b5563?text=Społeczność"
                alt="Community"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-8 md:order-first">
              <div className="flex items-start">
                <Users className="mr-4 h-8 w-8 text-primary-600" />
                <div>
                  <h3 className="mb-2 text-2xl font-semibold">Siła wspólnoty</h3>
                  <p>Społeczność wyjazdy.yoga wspiera Twoje wyjazdy.</p>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-semibold">Zaufanie społeczności</h3>
                <p>Budujesz zaufanie wśród joginek i joginów.</p>
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-semibold">Wspólna misja</h3>
                <p>Razem szerzymy spokój i radość jogi.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "Intencja" Section */}
      <section className="py-20">
        <div className="container mx-auto flex flex-col items-center px-4 text-center">
          <h2 className="mb-12 text-4xl font-bold">Intencja</h2>
          <div className="mb-8 text-2xl font-bold">wyjazdy.yoga</div>
          <div className="space-y-6">
            <p className="text-lg">
              <span className="font-serif italic">ekam</span> — Działaj z serca - reszta przyjdzie
              naturalnie
            </p>
            <p className="text-lg">
              <span className="font-serif italic">dve</span> — Najważniejsze dzieje się w trakcie
            </p>
            <p className="text-lg">
              <span className="font-serif italic">trīṇi</span> — Możesz nie być doskonały, ale bądź
              prawdziwy
            </p>
          </div>
          <div className="my-12">
            <Image
              src="https://placehold.co/400x300/e0e0e0/555555?text=Kot+na+macie"
              alt="Cat on a yoga mat"
              width={400}
              height={300}
              className="rounded-lg"
            />
          </div>
          <p className="mb-8 text-lg">
            <span className="font-serif italic">catvāri</span> — Nie musisz być wielki, by zacząć.
            Zacznij teraz - to zajmie tylko chwilę
          </p>
          <Button size="lg">Dołącz</Button>
        </div>
      </section>
    </div>
  );
};

export default PartnersPage;
