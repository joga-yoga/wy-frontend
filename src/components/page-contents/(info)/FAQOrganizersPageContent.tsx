import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const FAQOrganizersPageContent = ({ project }: { project: "retreats" | "workshops" }) => {
  const retreatsFaqItems = [
    {
      question: "1) Czy publikacja jest płatna?",
      answer:
        "Nie. Publikacja jest bez opłat. Jesteśmy w fazie rozwoju i stawiamy na wartość dla społeczności: chcemy pomóc polskim joginom szybciej znaleźć dobre wyjazdy. W zamian prosimy tylko o link zwrotny do wyjazdy.yoga (np. w stopce strony wydarzenia lub studia). To uczciwy „give & get”: Ty zyskujesz zasięg wśród polskich odbiorców, my – widoczność SEO i wiarygodność ekosystemu.",
    },
    {
      question: "2) Jakie wydarzenia można dodać?",
      answer:
        "Retreaty, wyjazdy, warsztaty (1–2 dni), festiwale, TT (Teacher Training), wyjazdy rozwojowe z komponentem jogi/medytacji/oddechu/wellness. Wydarzenia muszą być legalne w miejscu realizacji, bez obietnic medycznych i treści wątpliwych etycznie.",
    },
    {
      question: "3) Co mam wpisać w Tytule?",
      answer:
        "Najlepsza struktura: [liczba dni] + [styl/przewodni motyw] + [lokalizacja] Np. „4-dniowy reset z jogą i pranajamą – Bieszczady”. Krótko, informacyjnie, bez krzyczących CAPS i emotek.",
    },
    {
      question: "4) Jak napisać Opis?",
      answer:
        "W 3–5 zdaniach powiedz: dla kogo jest wyjazd, jaki efekt da (odpoczynek, reset, wzmocnienie praktyki), co jest unikatowe (np. sauna/ognisko/trekking). Następnie dodaj 1–2 akapity szczegółów: styl zajęć, prowadzący, klimat miejsca.",
    },
    {
      question: "5) Najważniejsze atrakcje – co wyróżnić?",
      answer:
        "Wypisz 3–6 punktów, np.: „2 praktyki dziennie”, „joga nidra”, „wegetariańskie posiłki”, „widoki na Tatry”, „ceremonia ognia”. To jest sekcja „na skróty” – działa jak magnes.",
    },
    {
      question: "6) Język prowadzenia",
      answer:
        "Wybierz język lub kombinację (np. „PL/EN”). Jeśli część materiałów będzie po angielsku, napisz to od razu – minimalizuje to rozczarowania.",
    },
    {
      question: "7) Instruktorzy – co dodać?",
      answer:
        "Imię i nazwisko, krótka bio (1–2 zdania), styl praktyki, zdjęcie portretowe i link (www/IG). Ludzie jadą do konkretnych osób – to podnosi zaufanie.",
    },
    {
      question: "8) Poziom zaawansowania",
      answer:
        "Wskaż realnie: „dla początkujących”, „łagodny mix”, „dla praktykujących 6+ miesięcy”. Zbyt szeroka obietnica obniża satysfakcję po wyjeździe.",
    },
    {
      question: "9) Termin wyjazdu i multi-terminy",
      answer:
        "Wybierz zakres dat. Jeśli masz kilka terminów, utwórz oddzielne oferty (lub sklonuj istniejącą i zmień daty). Dzięki temu każda oferta ma własne zdjęcia, cenę i opis.",
    },
    {
      question: "10) Program (dzień po dniu) – jak szczegółowo?",
      answer:
        "Wystarczy ramowy rytm dnia: poranna praktyka, śniadanie, warsztat popołudniowy, czas wolny, wieczorna praktyka. Dodaj godziny orientacyjnie (np. „ok. 7:30–9:00”).",
    },
    {
      question: "11) Lokalizacja – jak to opisać?",
      answer:
        "Użyj rozpoznawalnej nazwy miejscowości/regionu (np. „Karkonosze, okolice Szklarskiej Poręby”), a dokładny adres podaj uczestnikom po zapisie. W opisie dodaj: dojazd (auto/pociąg), parking, najbliższy dworzec.",
    },
    {
      question: "12) Nocleg",
      answer:
        "Krótko opisz standard (pokoje 2–4 os., łazienki, sauna), zdjęcia pokoi i części wspólnych. Jeśli jest kilka wariantów, wypisz każdy z osobna.",
    },
    {
      question: "13) Powitanie gości",
      answer:
        "Tu stwórz klimat: kto i jak wita, jak wygląda pierwsze spotkanie, gdzie przekazujecie informacje organizacyjne. To ociepla wizerunek i buduje bezpieczeństwo.",
    },
    {
      question: "14) Wyżywienie",
      answer:
        "Napisz, co wchodzi w pakiet (np. 2 posiłki dziennie), jaki styl (wegetariańskie/weg.), czy istnieją opcje bezglutenowe/laktozowe. Dodaj informację o wodzie/herbacie między posiłkami.",
    },
    {
      question: "15) Cena – czy muszę ją podawać, skoro nie ma płatności przez platformę?",
      answer:
        "Tak – transparentność to podstawa. U nas cena ma charakter informacyjny, a rezerwacje i płatności odbywają się bezpośrednio u Ciebie (mail/telefon/formularz). Dzięki temu uczestnik od razu wie, na co się pisze i jak się z Tobą skontaktować.",
    },
    {
      question: "16) Co jest wliczone w cenę",
      answer:
        "Wypisz konkretnie: noclegi, wyżywienie, zajęcia, sauna/bania, transport z dworca (jeśli jest). Im mniej „niespodzianek”, tym wyższe zaufanie.",
    },
    {
      question: "17) Co nie jest wliczone w cenę",
      answer:
        "Napisz wprost: dojazd, ubezpieczenie, masaże, skipassy, podatki lokalne, opłata klimatyczna itp. Jasność = mniej pytań i rezygnacji.",
    },
    {
      question: "18) Dodatkowe atrakcje za dopłatą",
      answer:
        "Wymień opcjonalne usługi (masaże, konsultacje ajurwedyjskie, wycieczki). Podaj przybliżone ceny lub zakres („od… do…”), jeśli możesz.",
    },
    {
      question: "19) Zasady anulowania rezerwacji – po co?",
      answer:
        "Jasna polityka rezygnacji obniża lęk przed przedpłatą i wyraźnie podnosi skłonność do zapisu. Podaj czarno na białym: do kiedy pełny zwrot, kiedy częściowy, kiedy zamiana na inny termin, czy jest możliwość przekazania miejsca innej osobie.",
    },
    {
      question: "20) Przykładowy szablon Cancellation Policy",
      answer:
        "<ul class='list-disc list-inside pl-4'><li>do 30 dni przed przyjazdem: 95% zwrotu</li><li>29–14 dni: 50% zwrotu lub przeniesienie na inny termin</li><li>&lt;14 dni: brak zwrotu, możliwa odsprzedaż miejsca / przekazanie znajomemu</li></ul><p class='mt-2'>Dopasuj do realiów Twojego miejsca – ważne, żeby było krótko i czytelnie.</p>",
    },
    {
      question: "21) Warto wiedzieć przed wyjazdem",
      answer:
        "Lista „praktyków”: co zabrać (mata, ciepła bluza), obuwie, poziom kondycji, ewentualne przeciwskazania, godzina zameldowania, cisza nocna, zasady zdjęć/telefonów, regulamin sali.",
    },
    {
      question: "22) Zdjęcia wyjazdu – ile i jakie?",
      answer:
        "Minimum 6–10 zdjęć: sala, pokoje, jedzenie, okolica, ludzie w ruchu (za zgodą). Preferowane poziome, jasne, 1600 px+, bez ciężkiego filtra. Autentyczność > stock.",
    },
    {
      question: "23) Jak działa kontakt z uczestnikiem?",
      answer:
        "Publikujemy Twoje dane kontaktowe i/lub link do formularza. Nie pośredniczymy w płatnościach – wszystko ustalasz bezpośrednio z uczestnikiem.",
    },
    {
      question: "24) Dlaczego prosimy o link zwrotny?",
      answer:
        "Bo to zwiększa widoczność Twojej oferty w Google (SEO) i realnie podnosi liczbę wejść. Link możesz dodać w opisie wydarzenia, na stronie studia lub w wpisie blogowym „Gdzie nas znaleźć”.",
    },
    {
      question: "25) Jak szybko publikujemy ofertę?",
      answer:
        "Każda oferta przechodzi ręczną weryfikację (spójność, jakość zdjęć, kompletność pól). Zwykle zajmuje to kilka dni roboczych. Nie publikujemy wątpliwych treści.",
    },
    {
      question: "26) Co najczęściej opóźnia publikację?",
      answer:
        "Brak zdjęć, niejasna cena/zakres świadczeń, brak zasad anulacji, obietnice „cudów” lub treści sprzeczne z prawem/etyką.",
    },
    {
      question: "27) Czy mogę edytować ofertę po publikacji?",
      answer:
        "Tak. Uaktualnienia treści i cen są mile widziane; większe zmiany (daty, struktura) mogą wymagać ponownego sprawdzenia przez redakcję.",
    },
    {
      question: "28) Jakie linki mogę dodać?",
      answer:
        "Strona wydarzenia, formularz zapisu, IG/FB, strona studia, mapy dojazdu. Unikamy linków do innych agregatorów o tej samej funkcji (żeby nie rozpraszać użytkowników).",
    },
    {
      question: "29) Prawa do zdjęć i RODO",
      answer:
        "Publikuj tylko te zdjęcia, do których posiadasz prawa. Jeśli widać twarze uczestników – miej ich zgodę. Nie publikuj danych wrażliwych. Na prośbę usuwamy zdjęcia, które naruszają prywatność.",
    },
    {
      question: "30) Zdrowie i bezpieczeństwo",
      answer:
        "Wyjazdy nie zastępują porady medycznej. Zachęcaj do konsultacji z lekarzem przy kontuzjach/ciąży. Napisz w opisie, jak modyfikujesz praktykę dla osób początkujących.",
    },
    {
      question: "31) Czy publikować wydarzenia jednodniowe?",
      answer:
        "Tak – warsztaty jednodniowe, weekendy i dłuższe retrity są mile widziane. W tytule podaj długość („1-dniowy warsztat yin”).",
    },
    {
      question: "32) Czy można dodać kilku prowadzących?",
      answer:
        "Tak. Dla każdego dodaj mini-bio i zdjęcie. Jeśli role są różne (np. joga/oddech/muzyka), opisz to w 1–2 zdaniach.",
    },
    {
      question: "33) Jak zwiększyć konwersję z karty wydarzenia?",
      answer:
        "Kompletne pola, wyraźne zdjęcie główne, klarowna cena i polityka rezygnacji, konkretna sekcja „Warto wiedzieć”, aktywny link do formularza, plus 1-2 „atrakcje premium” (np. bania/ognisko).",
    },
    {
      question: "34) Jak promować wydarzenie po publikacji?",
      answer:
        "Udostępnij link w socialach, dodaj go w bio na IG, poproś ambasadorów/absolwentów o share, zamieść krótką relację live lub reelsy z miejsca. W aktualizacjach oferty dopisuj nowe szczegóły (np. „zostały 3 miejsca”).",
    },
    {
      question: "35) Jak zgłosić nadużycie albo poprosić o zmiany?",
      answer:
        "Napisz do nas przez formularz kontaktowy lub mail. Reagujemy na zgłoszenia dot. niejasnych cen, nieetycznych praktyk, naruszeń praw autorskich.",
    },
    {
      question: "36) Czy mogę dodać wydarzenie zagraniczne dla polskiej grupy?",
      answer:
        "Tak. Pisz po polsku, dodaj informacje o lotnisku/dojeździe, transferach i dokumentach (np. ubezpieczenie).",
    },
  ];

  const workshopsFaqItems = [
    {
      question: "1. Od czego zacząć organizację wydarzenia jogowego?",
      answer:
        "Zacznij od intencji – co chcesz, by uczestnicy poczuli, czego doświadczyli. Potem wybierz miejsce zgodne z tą energią (spokojne, naturalne, sprzyjające uważności) i ustal strukturę programu: praktyki, czas na posiłki, odpoczynek i integrację.",
    },
    {
      question: "2. Jak dobrać miejsce na warsztat lub retreat?",
      answer:
        "Szukaj przestrzeni z dobrą energią i prostotą – nie musi być luksusowo, ważne, by było czysto, cicho i z dostępem do natury. Idealne są kameralne pensjonaty, agroturystyki lub ośrodki z salą do praktyki, roślinnym jedzeniem i możliwością wyłączności dla grupy.",
    },
    {
      question: "3. Ile osób to dobra liczba uczestników?",
      answer:
        "Optymalnie 10–20 osób. Taka grupa pozwala zachować intymność, indywidualne podejście i dobrą atmosferę. Przy większej liczbie warto mieć asystenta lub drugą osobę prowadzącą.",
    },
    {
      question: "4. Jak zaplanować program wydarzenia?",
      answer:
        "Zadbaj o równowagę: praktyka, posiłki, odpoczynek, integracja. Poranki przeznacz na intensywniejsze zajęcia (asana, pranajama), popołudnia – na warsztaty tematyczne lub relaks. Nie wypełniaj dnia po brzegi — zostaw przestrzeń na ciszę i naturę.",
    },
    {
      question: "5. Jak ustalić cenę?",
      answer:
        "Policz wszystkie koszty (noclegi, sala, posiłki, transport, wynagrodzenie prowadzących, materiały) i dodaj uczciwe wynagrodzenie za swoją pracę. Cena powinna być równowagą między dostępnością a wartością. Dobrym standardem jest przedpłata (zaliczka) dla potwierdzenia rezerwacji.",
    },
    {
      question: "6. Jak komunikować wydarzenie w sposób autentyczny?",
      answer:
        "Mów z serca 💚 Nie sprzedawaj — zapraszaj. Opisuj nie tylko plan, ale energię wydarzenia, jego intencję i to, jak może się poczuć uczestnik. Używaj zdjęć natury, przestrzeni, ludzi w autentycznych momentach.",
    },
    {
      question: "7. Jak zadbać o bezpieczeństwo uczestników?",
      answer:
        "Upewnij się, że przestrzeń jest czysta i bezpieczna (np. maty, świece, sprzęt). Zbierz od uczestników informacje o zdrowiu (np. kontuzje, przeciwwskazania). Zawsze przypominaj, by słuchali swojego ciała i mogli odpuścić w każdej chwili.",
    },
    {
      question: "8. Czy potrzebuję ubezpieczenia lub zgody prawnej?",
      answer:
        "Warto mieć regulamin uczestnictwa i krótką zgodę uczestnika, że bierze udział na własną odpowiedzialność. Przy większych wydarzeniach możesz wykupić ubezpieczenie grupowe lub OC organizatora.",
    },
    {
      question: "9. Jak promować wydarzenie?",
      answer:
        "Najskuteczniejsze są: media społecznościowe, mailing, współpraca z lokalnymi studiami jogi, a przede wszystkim — rekomendacje uczestników. Zadbaj o spójną estetykę i prostą stronę zapisów (formularz, Calendly, e-mail).",
    },
    {
      question: "10. Co to znaczy „prowadzić wydarzenie w uważności”?",
      answer:
        "To znaczy być obecnym, a nie tylko zarządzać. Zamiast kontrolować — towarzysz. Daj grupie strukturę, ale też przestrzeń na spontaniczność. Obserwuj energię i reaguj z delikatnością.",
    },
    {
      question: "11. Jak współpracować z innymi prowadzącymi?",
      answer:
        "Ustalcie wcześniej wspólną intencję, zakres odpowiedzialności i komunikację. Dobrze, gdy każda osoba prowadząca ma swoją przestrzeń na praktykę, ale też wspólne momenty, które łączą całość wydarzenia.",
    },
    {
      question: "12. Co zrobić, gdy ktoś zrezygnuje w ostatniej chwili?",
      answer:
        "W opisie wydarzenia jasno określ zasady rezygnacji i bezzwrotność zaliczki. Możesz zaproponować przekazanie miejsca innej osobie. To pomaga zachować płynność organizacyjną i dobrą energię w grupie.",
    },
    {
      question: "13. Jak radzić sobie z trudnymi emocjami w grupie?",
      answer:
        "Zachowaj spokój i empatię. Nie próbuj „naprawiać” emocji — stwórz przestrzeń, w której uczestnik może je przeżyć bez oceny. Jeśli sytuacja tego wymaga, zaproponuj rozmowę indywidualną lub krótką przerwę.",
    },
    {
      question: "14. Jak dbać o siebie jako prowadząca/organizator?",
      answer:
        "To kluczowe 🌸 Zadbaj o sen, jedzenie, czas w naturze i momenty ciszy także dla siebie. Nie możesz podtrzymywać innych, jeśli Twoja własna energia jest wyczerpana. Bądź dla siebie tak samo łagodna, jak dla uczestników.",
    },
    {
      question: "15. Czy warto dokumentować wydarzenie?",
      answer:
        "Tak, ale z poszanowaniem prywatności. Zawsze zapytaj o zgodę na zdjęcia lub nagrania. Dobrze wykonane zdjęcia z naturalnymi emocjami pomagają budować autentyczny przekaz o Twojej pracy.",
    },
    {
      question: "16. Co daje organizowanie takich wydarzeń?",
      answer:
        "To nie tylko praca — to służba i droga serca. Każde spotkanie jest procesem także dla prowadzącego. Daje radość, wdzięczność i poczucie sensu. Uczy zaufania do życia i ludzi.",
    },
    {
      question: "17. Jak utrzymać kontakt z uczestnikami po zakończeniu wydarzenia?",
      answer:
        "Wyślij im wiadomość z podziękowaniem, zdjęciami i inspiracją do dalszej praktyki. Możesz zaprosić ich do newslettera lub grupy społecznościowej. Relacja nie kończy się po wyjeździe — często to początek wspólnej drogi 🌞",
    },
  ];

  const faqItems = project === "workshops" ? workshopsFaqItems : retreatsFaqItems;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-8 px-2 sm:py-12 sm:px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center mb-6 pt-4">
            {project === "retreats"
              ? "FAQ dla Organizatorów na wyjazdy.yoga"
              : "🌸 Najczęściej zadawane pytania (FAQ) dla organizatorów wydarzeń jogowych i rozwojowych"}
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
