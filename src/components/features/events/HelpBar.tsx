"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
    title: "Tytuł wydarzenia",
    content: "Wprowadź krótki, wyrazisty tytuł, który przyciągnie uwagę uczestników.",
    example: "Weekend z jogą w górach lub Letni retreat z medytacją i pranajamą",
    details: ['Unikaj ogólników typu "Warsztat jogi". Dodaj czas, miejsce lub formę wydarzenia.'],
  },
  {
    id: "description",
    title: "Opis wydarzenia",
    content:
      "Wprowadzenie do wydarzenia w formie krótkiego streszczenia. Ma przyciągnąć uwagę, zaciekawić.",
    details: ["Zalecana długość: 4–5 linijek."],
    example:
      "Zapraszamy na weekendowy wyjazd z jogą i medytacją w sercu Beskidów. Czekają na Ciebie codzienne sesje jogi, wyciszenie i głęboki oddech w otoczeniu natury.",
  },
  {
    id: "location_id",
    title: "Lokalizacja",
    content: "Podaj dokładną nazwę miejsca oraz lokalizację geograficzną.",
    example: "Centrum Odnowy Natura, Beskid Mały",
    details: ["Dobrze, by było to miejsce rozpoznawalne lub z linkiem do mapy."],
  },
  {
    id: "date",
    title: "Termin",
    content:
      "Podaj datę początkową i końcową wydarzenia. Upewnij się, że są zgodne z harmonogramem.",
  },
  {
    id: "price",
    title: "Cena",
    content: "Podaj cenę za jedną osobę. Bez dodatkowych znaków, tylko liczba.",
  },
  {
    id: "main_attractions",
    title: "Główne atrakcje",
    content: "Wymień 3–6 rzeczy, które wyróżniają Twoje wydarzenie. Krótko, hasłowo.",
    example: "Codzienna joga, medytacja, warsztat oddechowy, ziołowe SPA, wycieczka górska.",
  },
  {
    id: "skill_level",
    title: "Poziom zaawansowania",
    content: "Określ poziom uczestników. Możesz wybrać kilka opcji.",
    example: "Początkujący, Średniozaawansowany lub Dla każdego",
  },
  {
    id: "language",
    title: "Język zajęć",
    content: "W jakim języku będą prowadzone zajęcia?",
  },
  {
    id: "program",
    title: "Plan i harmonogram",
    content: "Wymień, co dzieje się każdego dnia. Możesz napisać to jako listę.",
    example:
      "Dzień 1: Przyjazd uczestników od godziny 15:00, zakwaterowanie w pokojach, powitalne spotkanie o 17:30, następnie relaksacyjna sesja jogi i wspólna kolacja o 19:00.",
  },
  {
    id: "accommodation_description",
    title: "Opis zakwaterowania",
    content: "Krótki opis miejsca noclegowego. Dodaj atmosferę i udogodnienia.",
    example:
      "Drewniane pokoje z widokiem na las. Każdy pokój z łazienką. Bliskość natury i cisza zapewniają komfortowy wypoczynek.",
  },
  {
    id: "food_description",
    title: "Wyżywienie",
    content: "Jakie posiłki są wliczone? Czy jest opcja wege/wegan?",
    example:
      "Trzy posiłki dziennie w wersji wegetariańskiej. Dostępne opcje wegańskie i bezglutenowe.",
  },
  {
    id: "guest_welcome_description",
    title: "Powitanie gości",
    content: "Co czeka na uczestników po przyjeździe?",
    example: "Od godziny 16:00 zakwaterowanie, o 18:00 wspólna kolacja i spotkanie organizacyjne.",
  },
  {
    id: "paid_attractions",
    title: "Zabiegi SPA / Dodatkowe atrakcje",
    content:
      "Jakie zabiegi są dostępne na miejscu? Czy są wliczone? Co można wykupić dodatkowo na miejscu?",
    example:
      "Sauna i masaże relaksacyjne dostępne za dodatkową opłatą. Masaże, warsztaty kosmetyczne, konsultacje indywidualne.",
  },
  {
    id: "included_trips",
    title: "Wliczone wycieczki",
    content: "Wymień wycieczki zawarte w pakiecie.",
    example: "Spacer z przewodnikiem po lesie, wycieczka nad jezioro, medytacja w plenerze.",
  },
  {
    id: "price_includes",
    title: "Co zawiera cena",
    content: "Lista rzeczy zawartych w cenie pakietu.",
    example: "Zakwaterowanie, wyżywienie, joga, warsztaty, wycieczki.",
  },
  {
    id: "price_excludes",
    title: "Czego nie zawiera cena",
    content: "Co uczestnik musi pokryć samodzielnie?",
    example: "Dojazd, ubezpieczenie, masaże.",
  },
  {
    id: "cancellation_policy",
    title: "Zasady anulowania",
    content: "Jakie są warunki rezygnacji? Czy zadatek jest zwrotny?",
    example: "Zadatek bezzwrotny. Zwrot 50% przy rezygnacji do 14 dni przed wydarzeniem.",
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
    content: "Dodaj jasne, wysokiej jakości zdjęcia, które pokazują atmosferę wydarzenia.",
    details: [
      "✔ Przynajmniej jedno zdjęcie główne (1280x960 lub większe, bez znaków wodnych)",
      "✔ Dobrze, jeśli zdjęcia przedstawiają:",
      "– miejsce praktyki,",
      "– zakwaterowanie,",
      "– jedzenie,",
      "– ludzi w ruchu (np. joga w plenerze),",
      "– okolicę / naturę.",
      "Unikaj kolaży i białego tła. Dodawaj tylko zdjęcia, do których masz prawa.",
    ],
  },
];

interface HelpBarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTipId?: string;
}

export function HelpBar({ isOpen, onClose, activeTipId }: HelpBarProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTipId) {
      const tipElement = document.getElementById(`tip-${activeTipId}`);
      if (tipElement) {
        tipElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeTipId]);

  return (
    <div className="w-[360px] bg-card border-l border-border shadow-lg z-1 flex flex-col sticky top-[65px] h-[calc(100vh-130px)] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
        <h2 className="text-lg font-semibold">Pomoc</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Zamknij pomoc">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-grow p-1">
        <div ref={scrollAreaRef} className="space-y-3 p-3">
          {tips.map((tip, index) => (
            <div
              key={tip.id}
              id={`tip-${tip.id}`}
              className={cn(
                "p-3 rounded-md border bg-muted/30 scroll-mt-4",
                tip.id === activeTipId && "border-2 border-brand-green animate-pulse-border",
              )}
            >
              <h3 className="font-semibold text-base mb-1.5">{tip.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{tip.content}</p>
              {tip.example && (
                <p className="text-sm text-primary/80 mt-1 whitespace-pre-line">
                  <span className="font-medium">Przykład:</span> {tip.example}
                </p>
              )}
              {tip.details && tip.details.length > 0 && (
                <ul className="list-none mt-1.5 space-y-0.5">
                  {tip.details.map((detail, i) => (
                    <li key={i} className="text-xs text-muted-foreground/90 whitespace-pre-line">
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
              {index < tips.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
