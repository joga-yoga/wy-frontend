import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const FAQTravelersPageContent = ({ project }: { project: "retreats" | "workshops" }) => {
  const faqItems = [
    {
      question: "1. Jak działa wyjazdy.yoga?",
      answer:
        "Wyjazdy.yoga to prosta i przejrzysta platforma, która łączy osoby szukające wyjazdów jogowych z ich organizatorami. Nie sprzedajemy biletów ani nie pobieramy żadnych opłat – pokazujemy Ci wydarzenia, a następnie przekazujemy bezpośredni kontakt do organizatora. Dzięki temu możesz od razu zapytać o szczegóły i zarezerwować miejsce bez pośredników.",
    },
    {
      question: "2. Czy muszę zakładać konto albo podawać dane osobowe?",
      answer:
        "Nie. Nie zbieramy żadnych danych użytkowników – nie prosimy o imię, nazwisko, maila czy numer telefonu. Przeglądasz ofertę anonimowo, a gdy coś Cię zainteresuje, kontaktujesz się bezpośrednio z organizatorem.",
    },
    {
      question: "3. Czy platforma przechowuje moje dane albo wykorzystuje je marketingowo?",
      answer:
        "Nie. Nie gromadzimy i nie sprzedajemy danych. Nasza filozofia jest prosta: chcemy być miejscem inspiracji i przejrzystych informacji, a nie bazą marketingową. Twoja prywatność jest w pełni bezpieczna.",
    },
    {
      question: "4. Dlaczego publikacja i korzystanie z platformy jest darmowe?",
      answer:
        "Jesteśmy projektem w fazie rozwoju – budujemy społeczność, chcemy wspierać organizatorów i ułatwiać życie uczestnikom. W zamian prosimy jedynie, by organizatorzy dodali link zwrotny do naszej strony. Ty jako uczestnik nigdy nic nie płacisz.",
    },
    {
      question: "5. Kto odpowiada za rezerwacje i płatności?",
      answer:
        "Całość ustalasz bezpośrednio z organizatorem wyjazdu. To on przyjmuje zgłoszenia, pobiera opłaty i ustala zasady anulacji. Wyjazdy.yoga nie bierze udziału w transakcjach i nie odpowiada za rozliczenia – jesteśmy neutralnym łącznikiem.",
    },
    {
      question: "6. Jak mogę znaleźć odpowiedni wyjazd?",
      answer:
        "Użyj filtrów na stronie głównej: lokalizacja, termin, cena, typ wydarzenia. W ten sposób zawęzisz wyniki do ofert najlepiej pasujących do Twoich potrzeb.",
    },
    {
      question: "7. Na co zwracać uwagę w opisie wydarzenia?",
      answer:
        "Zwróć uwagę na:<ul class='list-disc list-inside pl-4 mt-2'><li>program dnia – czy pasuje do Twoich oczekiwań,</li><li>poziom zaawansowania – czy jest dla początkujących, czy raczej zaawansowanych,</li><li>cena i co obejmuje – nocleg, wyżywienie, zajęcia, dodatkowe atrakcje,</li><li>politykę anulacji – dobrze, jeśli organizator jasno opisuje zasady zwrotów.</li></ul>",
    },
    {
      question: "8. Czy wszystkie wydarzenia są w Polsce?",
      answer:
        "Nie. Znajdziesz tu zarówno wyjazdy krajowe, jak i zagraniczne – np. w Hiszpanii, we Włoszech czy w Indiach. Wszystkie opisy są jednak przygotowane po polsku, abyś mógł łatwo porównać oferty i zdecydować, czy to coś dla Ciebie.",
    },
    {
      question: "9. Jak wygląda kontakt z organizatorem?",
      answer:
        "Na stronie każdego wydarzenia znajdziesz dane kontaktowe: e-mail, telefon lub link do formularza rezerwacyjnego. Wystarczy, że wybierzesz dogodny sposób i skontaktujesz się bezpośrednio.",
    },
    {
      question: "10. Czy mogę mieć pewność, że oferta jest prawdziwa?",
      answer:
        "Każda oferta przed publikacją przechodzi podstawową weryfikację: sprawdzamy kompletność opisu, zdjęcia, przejrzystość informacji. Nie selekcjonujemy wydarzeń według jakości, ale dbamy, aby były rzetelne i legalne.",
    },
    {
      question: "11. Czy platforma ocenia organizatorów?",
      answer:
        "Nie wystawiamy ocen ani rankingów. Jesteśmy neutralni – prezentujemy wydarzenia, a decyzję pozostawiamy Tobie. Możesz zawsze poprosić organizatora o opinie poprzednich uczestników.",
    },
    {
      question: "12. Czy są wydarzenia dla początkujących?",
      answer:
        "Tak. Wiele ofert jest skierowanych właśnie do osób, które zaczynają przygodę z jogą. W opisach znajdziesz informacje o poziomie zaawansowania. Jeśli masz wątpliwości, napisz do organizatora.",
    },
    {
      question: "13. Czy mogę jechać sam/sama?",
      answer:
        "Oczywiście! Większość uczestników wyjazdów jogowych to osoby podróżujące solo. To świetna okazja, by poznać ludzi o podobnych zainteresowaniach i spędzić czas w inspirującym towarzystwie.",
    },
    {
      question: "14. Jak przygotować się do wyjazdu?",
      answer:
        "Przeczytaj dokładnie opis wydarzenia. Sprawdź, co jest w cenie, a co trzeba zabrać ze sobą (mata, wygodne ubranie, buty na trekking, jeśli przewidziane są wycieczki). W razie wątpliwości pytaj organizatora – on zna najlepiej szczegóły.",
    },
    {
      question: "15. Co z anulacją wyjazdu?",
      answer:
        "Zasady rezygnacji ustala organizator. Dlatego warto zwrócić uwagę na „Cancellation Policy” w opisie. Jeśli nie ma jej w ofercie – zapytaj organizatora przed rezerwacją.",
    },
    {
      question: "16. Czy muszę znać angielski na wyjazdach zagranicznych?",
      answer:
        "Niekoniecznie. Wiele wyjazdów zagranicznych prowadzonych jest po polsku albo w języku mieszanym (PL/EN). Zawsze sprawdzaj tę informację w opisie wydarzenia.",
    },
    {
      question: "17. Co z bezpieczeństwem zdrowotnym?",
      answer:
        "Wyjazdy jogowe to czas odpoczynku i regeneracji, ale pamiętaj, że nie zastępują porady lekarskiej. Jeśli masz kontuzje lub szczególne potrzeby zdrowotne, poinformuj organizatora i skonsultuj się z lekarzem.",
    },
    {
      question: "18. Czy są wyjazdy rodzinne albo dla par?",
      answer:
        "Tak, część wydarzeń ma charakter rodzinny albo przewiduje pokoje dla par. Warto zapytać organizatora o możliwość uczestnictwa z dziećmi lub o szczególne warunki dla par.",
    },
    {
      question: "19. Czy znajdę coś w moim budżecie?",
      answer:
        "Oferty są bardzo zróżnicowane – od weekendowych warsztatów w Polsce za kilkaset złotych po luksusowe wyjazdy zagraniczne. Dzięki filtrom łatwo znajdziesz coś w swoim przedziale cenowym.",
    },
    {
      question: "20. Co jeśli wydarzenie się nie odbędzie?",
      answer:
        "W takiej sytuacji wszystko ustalasz bezpośrednio z organizatorem – to on jest odpowiedzialny za informowanie uczestników, zwroty i zmiany terminów.",
    },
    {
      question: "21. Jakie są najczęstsze błędy uczestników?",
      answer:
        "<ul class='list-disc list-inside pl-4'><li>rezerwacja bez sprawdzenia, co obejmuje cena,</li><li>brak zapoznania się z polityką anulacji,</li><li>spakowanie się „na oko”, bez przeczytania listy rzeczy,</li><li>niepotwierdzenie szczegółów z organizatorem.</li></ul><p class='mt-2'>Warto o tym pamiętać, by uniknąć rozczarowań.</p>",
    },
    {
      question: "22. Czy wyjazdy.yoga organizuje wydarzenia?",
      answer:
        "Nie. My nie jesteśmy organizatorem. Łączymy tylko uczestników z osobami, które prowadzą wyjazdy jogowe.",
    },
    {
      question: "23. Dlaczego opisy są tak szczegółowe?",
      answer:
        "Bo wierzymy w transparentność. Chcemy, abyś przed kontaktem z organizatorem miał/miała już jasny obraz programu, miejsca i ceny.",
    },
    {
      question: "24. Co wyróżnia wyjazdy.yoga od innych stron?",
      answer:
        "<ul class='list-disc list-inside pl-4'><li>brak ukrytych opłat,</li><li>brak zbierania danych,</li><li>wszystkie opisy w języku polskim,</li><li>prostota i przejrzystość,</li><li>dbałość o kulturę i autentyczność jogi.</li></ul>",
    },
    {
      question: "25. Jak mogę być na bieżąco z nowymi wyjazdami?",
      answer:
        "Po prostu odwiedzaj stronę regularnie. Nie wysyłamy newsletterów, bo nie zbieramy Twojego maila. Możesz też dodać stronę do zakładek albo obserwować nas w mediach społecznościowych.",
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-8 px-2 sm:py-12 sm:px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center mb-6 pt-4">
            FAQ dla gości wyjazdy.yoga
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-700 dark:text-gray-300">
          <div className="space-y-8">
            {faqItems.map((item, index) => (
              <div key={index}>
                <h3 className="text-xl font-semibold">{item.question}</h3>
                <p
                  className="mt-2 text-gray-600 dark:text-gray-400"
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
