"use client";

import { HelpCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import useIsMobile from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

import { useEventHelpBar } from "../contexts/EventHelpBarContext";

interface Tip {
  id: string;
  title: string;
  content: string;
  example?: string;
  details?: string[];
}

const tips: Tip[] = [
  {
    id: "title",
    title: "Tytuł wyjazdu",
    content: "Wprowadź krótki, wyrazisty tytuł, który przyciągnie uwagę uczestników.",
    example: "Weekend z jogą w górach lub Letni retreat z medytacją i pranajamą",
    details: ['Unikaj ogólników typu "Warsztat jogi". Dodaj czas, miejsce lub formę wyjazdu.'],
  },
  {
    id: "description",
    title: "Opis wyjazdu",
    content:
      "Wprowadzenie do wyjazdu w formie krótkiego streszczenia. Ma przyciągnąć uwagę, zaciekawić.",
    details: ["Zalecana długość: 4-5 linijek."],
    example:
      "Zapraszamy na weekendowy wyjazd z jogą i medytacją w sercu Beskidów. Czekają na Ciebie codzienne sesje jogi, wyciszenie i głęboki oddech w otoczeniu natury.",
  },
  {
    id: "main_attractions",
    title: "Najważniejsze atrakcje",
    content: "Wymień 3-6 rzeczy, które wyróżniają Twoje wyjazd. Krótko, hasłowo.",
    example: "Codzienna joga, medytacja, warsztat oddechowy, ziołowe SPA, wycieczka górska.",
  },
  {
    id: "language",
    title: "Język wyjazdu",
    content: "W jakim języku będzie prowadzony wyjazd?",
  },
  {
    id: "instructors",
    title: "Instruktorzy",
    content:
      "Wybierz instruktorów, którzy będą prowadzić wyjazd. Możesz dodać nowych lub wybrać z listy.",
  },
  {
    id: "skill_level",
    title: "Poziom zaawansowania",
    content: "Określ poziom uczestników. Możesz wybrać kilka opcji.",
    example: "Początkujący, Średniozaawansowany lub Dla każdego",
  },
  {
    id: "date",
    title: "Termin",
    content: "Podaj datę początkową i końcową wyjazdu. Upewnij się, że są zgodne z harmonogramem.",
  },
  {
    id: "program",
    title: "Plan i harmonogram",
    content: "Wymień, co dzieje się każdego dnia. Możesz napisać to jako listę.",
    example:
      "Dzień 1: Przyjazd uczestników od godziny 15:00, zakwaterowanie w pokojach, powitalne spotkanie o 17:30, następnie relaksacyjna sesja jogi i wspólna kolacja o 19:00.",
  },
  {
    id: "location_id",
    title: "Lokalizacja",
    content: "Podaj dokładną nazwę miejsca oraz lokalizację geograficzną.",
    example: "Centrum Odnowy Natura, Beskid Mały",
    details: ["Dobrze, by było to miejsce rozpoznawalne lub z linkiem do mapy."],
  },
  {
    id: "accommodation_description",
    title: "Nocleg",
    content: "Krótki opis miejsca noclegowego. Dodaj atmosferę i udogodnienia.",
    example:
      "Drewniane pokoje z widokiem na las. Każdy pokój z łazienką. Bliskość natury i cisza zapewniają komfortowy wypoczynek.",
  },
  {
    id: "guest_welcome_description",
    title: "Powitanie gości",
    content: "Co czeka na uczestników po przyjeździe?",
    example: "Od godziny 16:00 zakwaterowanie, o 18:00 wspólna kolacja i spotkanie organizacyjne.",
  },
  {
    id: "food_description",
    title: "Wyżywienie",
    content: "Jakie posiłki są wliczone? Czy jest opcja wege/wegan?",
    example:
      "Trzy posiłki dziennie w wersji wegetariańskiej. Dostępne opcje wegańskie i bezglutenowe.",
  },
  {
    id: "price",
    title: "Cena",
    content: "Podaj cenę za jedną osobę. Bez dodatkowych znaków, tylko liczba.",
  },
  {
    id: "price_includes",
    title: "Co jest wliczone w cenę",
    content: "Lista rzeczy zawartych w cenie pakietu.",
    example: "Zakwaterowanie, wyżywienie, joga, warsztaty, wycieczki.",
  },
  {
    id: "price_excludes",
    title: "Co nie jest wliczone w cenę",
    content: "Co uczestnik musi pokryć samodzielnie?",
    example: "Dojazd, ubezpieczenie, masaże.",
  },
  {
    id: "paid_attractions",
    title: "Dodatkowe atrakcje za dopłatą",
    content:
      "Jakie zabiegi są dostępne na miejscu? Czy są wliczone? Co można wykupić dodatkowo na miejscu?",
    example:
      "Sauna i masaże relaksacyjne dostępne za dodatkową opłatą. Masaże, warsztaty kosmetyczne, konsultacje indywidualne.",
  },
  {
    id: "cancellation_policy",
    title: "Zasady anulowania",
    content: "Jakie są warunki rezygnacji? Czy zadatek jest zwrotny?",
    example: "Zadatek bezzwrotny. Zwrot 50% przy rezygnacji do 14 dni przed wyjazdem.",
  },
  {
    id: "important_info",
    title: "Ważne informacje",
    content: "Co warto wiedzieć przed przyjazdem?",
    example: "Zabierz własną matę do jogi i wygodny strój. Na miejscu dostępne herbata i woda.",
  },
  {
    id: "images",
    title: "Zdjęcia",
    content: "Dodaj jasne, wysokiej jakości zdjęcia, które pokazują atmosferę wyjazdu.",
    details: [
      "✔ Przynajmniej jedno zdjęcie główne (1280x960 lub większe, bez znaków wodnych)",
      "✔ Dobrze, jeśli zdjęcia przedstawiają:",
      "- miejsce praktyki,",
      "- zakwaterowanie,",
      "- jedzenie,",
      "- ludzi w ruchu (np. joga w plenerze),",
      "- okolicę / naturę.",
      "Unikaj kolaży i białego tła. Dodawaj tylko zdjęcia, do których masz prawa.",
    ],
  },
];

const TipContent = ({ tip }: { tip: Tip }) => (
  <>
    <h3 className="font-semibold text-lg md:text-base mb-1.5 text-black">{tip.title}</h3>
    <p className="text-base md:text-sm md:text-muted-foreground whitespace-pre-line text-left">
      {tip.content}
    </p>
    {tip.example && (
      <p className="text-base md:text-sm md:text-primary/80 mt-1 whitespace-pre-line text-left">
        <span className="font-medium">Przykład:</span> {tip.example}
      </p>
    )}
    {tip.details && tip.details.length > 0 && (
      <ul className="list-none mt-1.5 space-y-0.5 text-left">
        {tip.details.map((detail, i) => (
          <li key={i} className="text-base md:text-xs text-muted-foreground/90 whitespace-pre-line">
            {detail}
          </li>
        ))}
      </ul>
    )}
  </>
);

export const EventHelpBarTipButton = ({ tipId }: { tipId: string }) => {
  const { openTip } = useEventHelpBar();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
      onClick={() => {
        openTip(tipId);
      }}
      aria-label="Pomoc dla sekcji instruktorzy"
    >
      <HelpCircle size={16} />
    </Button>
  );
};

export function EventHelpBar() {
  const {
    activeTipId,
    isMobileHelpModalOpen,
    isHelpBarOpen,
    setIsHelpBarOpen,
    setIsMobileHelpModalOpen,
  } = useEventHelpBar();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (activeTipId && !isMobile) {
      const tipElement = document.getElementById(`tip-${activeTipId}`);
      if (tipElement) {
        tipElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeTipId, isMobile]);

  if (isMobile) {
    const activeTip = tips.find((tip) => tip.id === activeTipId);
    return (
      <Drawer open={isMobileHelpModalOpen} onOpenChange={setIsMobileHelpModalOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="hidden">Pomoc</DrawerTitle>
            <DrawerDescription asChild>
              <div className="flex flex-col gap-1 pt-4 pb-10">
                {activeTip ? <TipContent tip={activeTip} /> : <p>Nie znaleziono podpowiedzi.</p>}
              </div>
            </DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );
  }

  if (!isHelpBarOpen) {
    return (
      <div className="hidden md:block fixed top-[80px] bottom-[48px] right-4 z-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsHelpBarOpen(!isHelpBarOpen)}
          aria-label={isHelpBarOpen ? "Zamknij pomoc" : "Otwórz pomoc"}
        >
          {isHelpBarOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden md:flex flex-col w-[360px] bg-card border-l border-border shadow-lg z-1 sticky top-[65px] h-[calc(100dvh-65px)] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
        <h2 className="text-lg font-semibold">Pomoc</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsHelpBarOpen(false)}
          aria-label="Zamknij pomoc"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-grow p-1">
        <div ref={scrollAreaRef} className="space-y-3 p-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              id={`tip-${tip.id}`}
              className={cn(
                "p-3 rounded-md border bg-muted/30 scroll-mt-4",
                tip.id === activeTipId && "border-2 border-brand-green animate-pulse-border",
              )}
            >
              <TipContent tip={tip} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
