import { NextResponse } from "next/server";

export async function GET() {
  // Mock data - replace with actual AI generation later
  const mockEventData = {
    title: "Wyprawa w Alpy - Wiosenny trekking",
    description:
      "Wyjątkowa wyprawa w Alpy, gdzie połączymy trekking z obserwacją dzikiej przyrody i nauką podstaw alpinizmu.",
    start_date: "2024-05-15",
    end_date: "2024-05-22",
    price: 2999,
    currency: "PLN",
    main_attractions: [
      "Trekking w Alpach",
      "Nauka podstaw alpinizmu",
      "Obserwacja dzikiej przyrody",
      "Wspinaczka na szczyt",
      "Noclegi w górskich schroniskach",
      "Profesjonalny przewodnik",
    ],
    language: "pl",
    skill_level: ["beginner", "intermediate"],
    accommodation_description:
      "Noclegi w górskich schroniskach z pełnym wyżywieniem. Wszystkie schroniska są wygodne i oferują ciepłe prysznice oraz wspólne przestrzenie do relaksu.",
    guest_welcome_description:
      "Spotykamy się w dniu przyjazdu o godzinie 14:00 w głównym schronisku. Wymeldowanie następnego dnia do godziny 10:00.",
    food_description:
      "Pełne wyżywienie w cenie (śniadania, obiady, kolacje). Uwzględniamy diety wegetariańskie i wegańskie. Prosimy o wcześniejsze zgłoszenie specjalnych wymagań dietetycznych.",
    price_includes: [
      "Noclegi w schroniskach",
      "Pełne wyżywienie",
      "Profesjonalny przewodnik",
      "Sprzęt wspinaczkowy",
      "Ubezpieczenie",
      "Transfer z lotniska",
    ],
    price_excludes: ["Bilety lotnicze", "Wydatki własne", "Opcjonalne atrakcje", "Alkohol"],
    included_trips: [
      "Dzienny trekking do jeziora górskiego",
      "Wspinaczka na szczyt",
      "Wycieczka do jaskini",
    ],
    paid_attractions: ["Paralotniarstwo", "Wypożyczenie dodatkowego sprzętu", "Masaż relaksacyjny"],
    cancellation_policy:
      "Rezygnacja do 30 dni przed wyjazdem - zwrot 100% wpłaty. Rezygnacja 15-30 dni przed wyjazdem - zwrot 50% wpłaty. Rezygnacja późniejsza - brak zwrotu.",
    important_info:
      "Wymagany podstawowy stan zdrowia i kondycja fizyczna. Zalecane wcześniejsze przygotowanie kondycyjne. Konieczne zabranie odpowiedniego obuwia i odzieży górskiej.",
    program: [
      "Dzień 1: Przyjazd, zakwaterowanie, spotkanie organizacyjne",
      "Dzień 2: Aklimatyzacja, krótki trekking, nauka podstaw alpinizmu",
      "Dzień 3: Trekking do jeziora górskiego, obserwacja dzikiej przyrody",
      "Dzień 4: Wspinaczka na szczyt, podziwianie panoramy Alp",
      "Dzień 5: Wycieczka do jaskini, nauka technik wspinaczkowych",
      "Dzień 6: Wolny dzień na odpoczynek lub opcjonalne atrakcje",
      "Dzień 7: Ostatni trekking, pożegnalna kolacja",
      "Dzień 8: Śniadanie, wymeldowanie, wyjazd",
    ],
    instructor_ids: [],
    is_public: false,
    location_id: null,
    image_ids: [],
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json(mockEventData);
}
