import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const FAQTravelersPageContent = ({ project }: { project: "retreats" | "workshops" }) => {
  const retreatsFaqItems = [
    {
      question: "1. Jak działa joga.yoga?",
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
      question: "22. Czy joga.yoga organizuje wydarzenia?",
      answer:
        "Nie. My nie jesteśmy organizatorem. Łączymy tylko uczestników z osobami, które prowadzą wyjazdy jogowe.",
    },
    {
      question: "23. Dlaczego opisy są tak szczegółowe?",
      answer:
        "Bo wierzymy w transparentność. Chcemy, abyś przed kontaktem z organizatorem miał/miała już jasny obraz programu, miejsca i ceny.",
    },
    {
      question: "24. Co wyróżnia joga.yoga od innych stron?",
      answer:
        "<ul class='list-disc list-inside pl-4'><li>brak ukrytych opłat,</li><li>brak zbierania danych,</li><li>wszystkie opisy w języku polskim,</li><li>prostota i przejrzystość,</li><li>dbałość o kulturę i autentyczność jogi.</li></ul>",
    },
    {
      question: "25. Jak mogę być na bieżąco z nowymi wyjazdami?",
      answer:
        "Po prostu odwiedzaj stronę regularnie. Nie wysyłamy newsletterów, bo nie zbieramy Twojego maila. Możesz też dodać stronę do zakładek albo obserwować nas w mediach społecznościowych.",
    },
  ];

  const workshopsFaqItems = [
    {
      question: "1. Co to właściwie jest joga?",
      answer:
        "Joga to starożytna praktyka łącząca ciało, oddech i umysł. Pomaga odzyskać spokój, elastyczność, równowagę i wewnętrzne poczucie harmonii. Nie jest religią, lecz ścieżką świadomego życia i kontaktu ze sobą.",
    },
    {
      question: "2. Czy joga to tylko ćwiczenia fizyczne?",
      answer:
        "Nie. Asany (pozycje ciała) są tylko jednym z elementów jogi. Równie ważne są praca z oddechem, medytacja, relaksacja i rozwijanie uważności. Joga uczy, jak żyć w większym spokoju i obecności na co dzień.",
    },
    {
      question: "3. Co to znaczy Kundalini?",
      answer:
        "Kundalini to określenie subtelnej energii życiowej, która spoczywa w każdym z nas. Praktyka Jogi Kundalini łączy ruch, oddech, mantry i medytację, by tę energię obudzić i zharmonizować. Nie ma w tym nic mistycznego ani groźnego — chodzi o zwiększenie świadomości i przepływu życiowej energii w ciele.",
    },
    {
      question: "4. A czym jest Joga Nidra?",
      answer:
        "Joga Nidra to głęboka medytacja relaksacyjna, często nazywana „jogicznym snem”. Leżysz wygodnie na macie, a prowadzący głosem wprowadza Cię w stan pomiędzy jawą a snem. To metoda regeneracji i pracy z podświadomością — bardzo łagodna i dostępna dla każdego.",
    },
    {
      question: "5. Czy muszę być wysportowana/y, żeby przyjść na zajęcia?",
      answer:
        "Nie 🌸 Joga nie wymaga elastyczności ani kondycji. Wystarczy otwartość i chęć spróbowania. Każde ciało jest inne — praktykujesz w zgodzie ze sobą, bez porównań i ocen.",
    },
    {
      question: "6. Jak się przygotować do zajęć lub warsztatu?",
      answer:
        "Ubierz się wygodnie (najlepiej w strój sportowy lub dres), weź matę do jogi, butelkę z wodą i coś ciepłego na relaks. Nie jedz obfitego posiłku tuż przed zajęciami — lekki posiłek 1–2 godziny wcześniej w zupełności wystarczy.",
    },
    {
      question: "7. Co będziemy robić podczas takich wydarzeń?",
      answer:
        "Zazwyczaj praktykujemy jogę (ruch i oddech), medytację, czasem śpiewamy mantry lub uczestniczymy w warsztatach rozwojowych. Zawsze jest też przestrzeń na odpoczynek, rozmowę i refleksję.",
    },
    {
      question: "8. Czy muszę coś „umieć”, żeby dołączyć?",
      answer:
        "Nie. Wszystko, czego potrzebujesz, otrzymasz na miejscu — prowadzący tłumaczą każdy krok i wspierają w procesie. Nie ma złych ruchów ani błędnych pozycji — liczy się Twoje doświadczenie, nie perfekcja.",
    },
    {
      question: "9. Co jeśli poczuję emocje podczas zajęć?",
      answer:
        "To zupełnie naturalne. Praktyka jogi i oddechu często porusza emocje, które były ukryte w ciele. Możesz płakać, śmiać się, czuć ciepło lub drżenie — wszystko jest w porządku. Ważne, by pozwolić sobie po prostu być.",
    },
    {
      question: "10. Jak wygląda typowy dzień na warsztacie lub wyjeździe jogowym?",
      answer:
        "Dni są spokojnie ułożone: poranna joga lub medytacja, wspólne posiłki, czas wolny, popołudniowe zajęcia tematyczne, a wieczorem relaks lub krąg przy ognisku. Wszystko w rytmie natury i potrzeb grupy.",
    },
    {
      question: "11. Czy joga ma związek z religią?",
      answer:
        "Nie. Joga jest praktyką uniwersalną, niezależną od wiary czy światopoglądu. Możesz ją traktować jako sposób dbania o ciało, narzędzie do relaksu lub duchową ścieżkę — tak, jak czujesz.",
    },
    {
      question: "12. Co to są mantry i po co się je śpiewa?",
      answer:
        "Mantry to krótkie dźwięki lub słowa o wysokiej wibracji, które pomagają uspokoić umysł i otworzyć serce. Nie trzeba ich znać — wystarczy słuchać, oddychać i pozwolić dźwiękom działać.",
    },
    {
      question: "13. Czym różni się joga od medytacji?",
      answer:
        "Joga to cała ścieżka — obejmuje ciało, oddech i umysł. Medytacja jest jednym z jej elementów — to praktyka skupienia i obecności. Obie drogi prowadzą do tego samego celu: do wewnętrznego spokoju.",
    },
    {
      question: "14. Czy mogę przyjść sama/sam?",
      answer:
        "Oczywiście 💛 Większość osób przychodzi sama i właśnie tam poznaje bliskie, otwarte dusze. Wspólna praktyka naturalnie tworzy atmosferę wsparcia i bliskości.",
    },
    {
      question: "15. Czy wydarzenia są tylko dla młodych i sprawnych osób?",
      answer:
        "Nie 🌿 W jodze wiek nie ma znaczenia. Praktykują osoby w każdym wieku i z różną kondycją fizyczną. Ważniejsze od elastyczności jest otwartość i ciekawość.",
    },
    {
      question: "16. Czy mogę uczestniczyć, jeśli mam problemy zdrowotne?",
      answer:
        "Tak, ale warto wcześniej poinformować prowadzącego o swoich ograniczeniach. W jodze zawsze istnieją warianty pozycji, które można dopasować do potrzeb ciała. Jeśli masz poważne dolegliwości — skonsultuj się wcześniej z lekarzem.",
    },
    {
      question: "17. Co najważniejsze, gdy zaczynam?",
      answer:
        "Nie porównuj się z innymi. Nie oceniaj swojego ciała. Oddychaj, czuj, słuchaj siebie. Joga to nie rywalizacja, ale podróż — do własnego środka. Z każdym oddechem wracasz do domu, którym jesteś Ty 💫",
    },
  ];

  const faqItems = project === "workshops" ? workshopsFaqItems : retreatsFaqItems;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-8 px-2 sm:py-12 sm:px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center mb-6 pt-4">
            {project === "retreats"
              ? "FAQ dla Uczestników na joga.yoga"
              : "🌿 Najczęściej zadawane pytania (FAQ)"}
          </CardTitle>
          {project === "retreats" ? null : (
            <CardDescription className="text-xl text-gray-500 font-semibold text-center mb-6 pt-4">
              jeśli dopiero zaczynasz swoją przygodę z jogą i rozwojem
            </CardDescription>
          )}
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
