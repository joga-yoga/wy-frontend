export type ScheduleAudience = "studio" | "participant";

export const scheduleContent: Record<
  ScheduleAudience,
  { tabLabel: string; heading: string; description: string; image: string; imageAlt: string }
> = {
  studio: {
    tabLabel: "Dla studia",
    heading: "Grafik i zapisy w jednym miejscu",
    description: "Dzisiejsze zajęcia, liczba zapisów i wolne miejsca są widoczne od razu",
    image: "/images/marketing/studios/studio-owner-view.webp",
    imageAlt: "Widok grafiku i zapisów w systemie studia",
  },
  participant: {
    tabLabel: "Dla uczestnika",
    heading: "Pełna informacja o zajęciach przed zapisem",
    description: "Ważne szczegóły zajęć są widoczne od razu",
    image: "/images/marketing/studios/reservation.webp",
    imageAlt: "Widok szczegółów zajęć i rezerwacji w telefonie",
  },
};

export const faqItems = [
  {
    question: "Czy przejście na joga.yoga nie utrudni zapisów moim klientom?",
    answer: [
      "Zmiana systemu jest trochę jak przeprowadzka do nowego mieszkania. Na początku może wymagać chwili uwagi, ale później wszystko staje się prostsze i wygodniejsze.",
      "Baza klientów może zostać automatycznie przeniesiona z obecnego systemu do joga.yoga, a uczestnicy mogą otrzymać e-mail z informacją o zmianie. Nowe osoby od razu widzą najważniejsze informacje o zajęciach i mogą wygodnie zapisać się online",
    ],
  },
  {
    question: "Kto pomoże mi uruchomić system, gdy utknę na migracji lub konfiguracji?",
    answer: [
      "Przez całą dobę dostępny jest asystent AI, który zna techniczne działanie joga.yoga i może szybko pomóc w konfiguracji, migracji oraz codziennej obsłudze systemu.",
      "Jeśli problem będzie nietypowy albo będzie wymagał wsparcia człowieka, pomoc techniczna jest dostępna codziennie w godzinach 10:00–22:00",
    ],
  },
  {
    question: "Kto pomoże mi uruchomić system, gdy utknę na migracji lub konfiguracji?",
    answer: [
      "Od 101 zapisu opłata wynosi 0,25 zł za każdą kolejną rejestrację. W planie Flex nie ma miesięcznego abonamentu, więc płatność pojawia się tylko wtedy, gdy liczba zapisów przekroczy bezpłatny limit 100.",
      "Faktura zostanie wystawiona dopiero po przekroczeniu 100 zł łącznych naliczonych opłat.",
      "Przy większej i bardziej regularnej liczbie zapisów można wybrać plan Balans za 70,73 zł netto miesięcznie, z pakietem 500 zapisów miesięcznie w cenie",
    ],
  },
  {
    question: "Nie korzystam jeszcze z systemu rezerwacji. Czy mogę zacząć od zera?",
    answer: [
      "Jak najbardziej. W joga.yoga możesz od podstaw utworzyć grafik zajęć, dodać terminy, prowadzących, sale i liczbę miejsc. Gdy wszystko będzie gotowe, wystarczy uruchomić zapisy i zacząć przyjmować pierwsze rezerwacje",
    ],
  },
  {
    question: "Czy można najpierw sprawdzić joga.yoga na kilku zajęciach?",
    answer: [
      "Absolutnie! Studio może dodać kilka terminów i przyjąć pierwsze zapisy, żeby sprawdzić, jak wygląda codzienna obsługa. Pierwsze 100 zapisów jest bezpłatne. To pozwala poznać system na rzeczywistych zajęciach przed przeniesieniem całego grafiku.",
    ],
  },
  {
    question: "Czy joga.yoga ma sens przy kilku zajęciach w tygodniu?",
    answer: [
      "Tak. Kameralne studio może zacząć od niewielkiego grafiku. Nie musi od razu dodawać zespołu ani rozbudowanej oferty. W planie Flex nie ma miesięcznego abonamentu, więc nie trzeba wybierać stałej opłaty tylko po to, żeby prowadzić kilka zajęć.",
    ],
  },
  {
    question: "Co zrobić, gdy zmienia się godzina zajęć lub prowadząca?",
    answer: [
      "W regularnym grafiku można zmienić pojedynczy termin, na przykład jego godzinę lub osobę prowadzącą. Pozostałe zajęcia w serii zostają bez zmian. Dzięki temu jednorazowa zmiana nie wymaga układania grafiku od początku.",
    ],
  },
  {
    question: "Czy można dodawać warsztaty, kursy i wyjazdy? Czy jest prowizja?",
    answer: [
      "Tak. Studio może publikować warsztaty, kursy i wyjazdy jogowe. Każda oferta ma własną stronę, którą można udostępnić uczestnikom.",
      "Jeśli nowy klient znajdzie ofertę przez joga.yoga i kupi udział, prowizja wynosi 11% w planie Flex lub 5% w planie Balans. W planie Przestrzeń wynosi 0%.",
      "Ta prowizja nie dotyczy klientów z własnych kanałów studia, np. strony internetowej, newslettera czy mediów społecznościowych. Nie obejmuje też regularnych zajęć ani karnetów. Opłaty operatora płatności są naliczane osobno.",
    ],
  },
  {
    question: "Czy przed zajęciami będzie wiadomo, kto jest zapisany?",
    answer: [
      "Przy danym terminie dostępna jest lista zapisanych osób i liczba zajętych miejsc. Osoba obsługująca zajęcia może sprawdzić listę i zaznaczyć obecność uczestników.",
    ],
  },
  {
    question: "Czy obsługą studia może zajmować się kilka osób?",
    answer: [
      "Tak. Właścicielka może zaprosić do studia osoby z zespołu i określić ich uprawnienia. Każda osoba korzysta z własnego konta, a właścicielka decyduje, do których narzędzi ma dostęp.",
    ],
  },
  {
    question: "Jak nowe osoby mogą znaleźć studio w joga.yoga?",
    answer: [
      "Publiczna strona przedstawia studio, jego nauczycieli i ofertę. Katalog według miast pomaga osobom szukającym jogi trafić do studiów w swojej okolicy. To dodatkowe miejsce, w którym można poznać studio przed pierwszą wizytą.",
    ],
  },
] as const;
