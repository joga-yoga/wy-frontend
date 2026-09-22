/**
 * The text of the style pages — `/studia/{styl}` hubs and the intro of `/{miasto}/{styl}`.
 *
 * ⚠ **This text is the reason those pages are worth indexing.** Without it `/krakow/hatha` is
 * `/krakow` filtered — the thin page the directory's spec ruled out. Every style with a hub
 * (backend `services/style_pages.MIN_STUDIOS_PER_STYLE`) needs an entry here; a hub whose style
 * has no entry renders as a 404 rather than an empty page (see `getStyleCopy`).
 *
 * Status: **DRAFT — written by Claude on 2026-09-21, awaiting the owner's review.** Replace this
 * line with the review date once it has been read and edited.
 *
 * Writing rules (product-language skill, `wy-frontend/AGENTS.md` → Tone of Voice):
 * - Platform voice — these pages belong to no studio, so no "my / nas".
 * - Present tense when addressing the reader; Polish past tense is gendered.
 * - No medical promises. Describe what happens on a mat, never what it cures. Where health
 *   matters (pregnancy, aerial), point the reader to a doctor or the studio.
 * - Only well-established facts about a style's origin, and as few as possible.
 *
 * Keys are the canonical style slugs from `wy-backend/src/app/services/yoga_style_canon.py`.
 */
export interface YogaStyleCopy {
  /** How the style is named in a heading — the phrase people search for, in the nominative:
   *  "Hatha joga", "Joga metodą Iyengara". The catalog name ("Hatha", "Iyengar") is a chip
   *  label; it does not make a heading on its own. Followed directly by a locative on city
   *  pages ("Hatha joga w Krakowie"), so it must read as a complete noun phrase. */
  heading: string;
  /** One sentence, ≤ 155 characters — the hub's lead and the base of its meta description. */
  lead: string;
  /** Two or three short paragraphs — on the hub only. City pages show the lead and link up,
   *  so the full text exists once on the site. */
  body: string[];
}

export const YOGA_STYLE_COPY: Record<string, YogaStyleCopy> = {
  hatha: {
    heading: "Hatha joga",
    lead: "Hatha to spokojna, klasyczna forma jogi: pozycje utrzymywane przez kilka oddechów, praca z oddechem i relaksacja na koniec.",
    body: [
      "Hatha to najszersza nazwa w świecie jogi — większość stylów praktykowanych dziś na zajęciach wywodzi się właśnie z niej. Na zajęciach hatha pozycje (asany) buduje się spokojnie i utrzymuje przez kilka oddechów, zamiast płynnie przechodzić z jednej w drugą.",
      "Typowe zajęcia łączą asany, ćwiczenia oddechowe (pranajamę) i krótką relaksację na zakończenie. Tempo jest umiarkowane, a nauczyciel ma czas, żeby omówić ustawienie ciała w każdej pozycji.",
      "To dobry wybór na początek praktyki, ale nie tylko — spokojna hatha pozostaje podstawą dla wielu osób ćwiczących od lat. Poziom trudności zależy od prowadzącego, więc warto sprawdzić, dla kogo przeznaczone są konkretne zajęcia.",
    ],
  },
  vinyasa: {
    heading: "Joga vinyasa",
    lead: "Vinyasa łączy pozycje z oddechem w płynne sekwencje. Dynamiczna, rozgrzewająca praktyka, w której każda lekcja może wyglądać inaczej.",
    body: [
      "W vinyasie ruch podąża za oddechem: z jednej pozycji przechodzi się do kolejnej na wdechu albo wydechu, tworząc płynną sekwencję. Dzięki temu praktyka jest bardziej dynamiczna niż klasyczna hatha i szybko rozgrzewa ciało.",
      "Nie ma jednej ustalonej sekwencji — układ zajęć zależy od nauczyciela, więc dwie lekcje vinyasy mogą bardzo się od siebie różnić. Często spotkasz też nazwę vinyasa flow albo po prostu flow.",
      "Vinyasa sprawdzi się, jeśli lubisz ruch i chcesz się zmęczyć. Osoby zaczynające praktykę powinny szukać zajęć oznaczonych jako podstawowe albo dla początkujących.",
    ],
  },
  yin: {
    heading: "Yin joga",
    lead: "Yin joga to spokojna praktyka pozycji utrzymywanych przez kilka minut, głównie w siadzie i leżeniu. Wyciszająca przeciwwaga dla dynamicznego ruchu.",
    body: [
      "W yin jodze pozycje utrzymuje się długo — zwykle od trzech do pięciu minut — przy rozluźnionych mięśniach. Większość z nich wykonuje się w siadzie albo w leżeniu, często z użyciem wałków, klocków i koców.",
      "Tempo jest bardzo wolne, a zajęcia sprzyjają wyciszeniu i uważności. Długie utrzymanie pozycji to także ćwiczenie cierpliwości: uczy obserwowania odczuć w ciele bez pośpiechu.",
      "Yin dobrze uzupełnia praktyki dynamiczne, takie jak vinyasa czy ashtanga, i trening sportowy. Nie wymaga siły ani doświadczenia, ale warto powiedzieć prowadzącemu o urazach, żeby dopasował pozycje.",
    ],
  },
  "joga-w-ciazy": {
    heading: "Joga w ciąży",
    lead: "Joga w ciąży to zajęcia dopasowane do kolejnych etapów ciąży: łagodny ruch, praca z oddechem i relaksacja w bezpiecznym tempie.",
    body: [
      "Zajęcia jogi dla kobiet w ciąży są zaplanowane z myślą o zmianach, jakie zachodzą w ciele w kolejnych trymestrach. Pozycje są modyfikowane albo pomijane, a tempo jest spokojne.",
      "Dużo miejsca zajmuje oddech i relaksacja, a także ćwiczenia, które pomagają swobodniej się poruszać i odpocząć. Zajęcia bywają też okazją do poznania innych przyszłych mam.",
      "Przed rozpoczęciem praktyki porozmawiaj z lekarzem albo położną. Na pierwszych zajęciach powiedz prowadzącej lub prowadzącemu, w którym tygodniu ciąży jesteś — to pozwoli dopasować ćwiczenia.",
    ],
  },
  aerial: {
    heading: "Aerial joga",
    lead: "Aerial joga to praktyka z użyciem hamaka zawieszonego pod sufitem. Hamak podtrzymuje ciało i ułatwia pozycje odwrócone.",
    body: [
      "Na zajęciach aerial jogi każda osoba ćwiczy z własnym hamakiem z elastycznej tkaniny, zawieszonym nisko nad podłogą. Hamak podpiera ciało, dzięki czemu wiele pozycji — zwłaszcza odwróconych — staje się dostępnych bez obciążania głowy i karku.",
      "Praktyka łączy elementy klasycznej jogi, rozciągania i pracy nad siłą. Zajęcia są zwykle prowadzone w małych grupach, ograniczonych liczbą hamaków na sali.",
      "Aerial joga wymaga trochę odwagi, ale nie akrobatycznych umiejętności. Przed pierwszymi zajęciami zapytaj studio o przeciwwskazania do pozycji odwróconych i o to, jak się przygotować.",
    ],
  },
  iyengar: {
    heading: "Joga metodą Iyengara",
    lead: "Metoda Iyengara to joga, w której najważniejsza jest precyzja ustawienia ciała. Pozycje buduje się krok po kroku, z pomocą klocków, pasków i koców.",
    body: [
      "Metodę rozwinął indyjski nauczyciel B.K.S. Iyengar. Jej znakiem rozpoznawczym jest dokładność: nauczyciel szczegółowo omawia ustawienie każdej części ciała, a pozycje utrzymuje się dłużej niż na zajęciach dynamicznych.",
      "Na zajęciach używa się wielu pomocy — klocków, pasków, koców, wałków, a nawet krzeseł. Pozwalają one wykonać pozycję poprawnie niezależnie od gibkości i doświadczenia.",
      "Zajęcia są zwykle uporządkowane według poziomów. Metoda sprawdzi się, jeśli chcesz dobrze zrozumieć pozycje i lubisz praktykę uważną, a nie szybką.",
    ],
  },
  "joga-nidra": {
    heading: "Joga Nidra",
    lead: "Joga Nidra to prowadzona głęboka relaksacja w leżeniu. Głos nauczyciela prowadzi uwagę przez ciało i oddech — bez wysiłku fizycznego.",
    body: [
      "Joga Nidra, nazywana też snem jogina, to praktyka wykonywana w całości w leżeniu. Nauczyciel prowadzi słowami: kieruje uwagę na kolejne części ciała, oddech i wyobrażenia, a zadaniem ćwiczącej osoby jest po prostu słuchać.",
      "Nie wymaga żadnej sprawności ani doświadczenia. Wystarczy wygodne miejsce, koc i poduszka — w studiu zwykle wszystko to czeka na sali.",
      "Joga Nidra bywa osobnymi zajęciami albo częścią dłuższej praktyki, na przykład na jej zakończenie. To dobra propozycja, jeśli szukasz odpoczynku i wyciszenia.",
    ],
  },
  ashtanga: {
    heading: "Ashtanga joga",
    lead: "Ashtanga to dynamiczna joga ze stałymi sekwencjami pozycji, połączonymi oddechem. Wymagająca, systematyczna praktyka, w której postęp widać krok po kroku.",
    body: [
      "Ashtanga w formie praktykowanej dziś na całym świecie wywodzi się z nauczania K. Pattabhiego Joisa z Mysore. Opiera się na ustalonych seriach pozycji, zawsze w tej samej kolejności, połączonych oddechem i skupieniem wzroku.",
      "Zajęcia prowadzone są na dwa sposoby: wspólnie, gdy nauczyciel podaje tempo całej grupie, albo w stylu Mysore, gdy każda osoba ćwiczy we własnym rytmie, a nauczyciel pomaga indywidualnie. Kolejne pozycje dochodzą, gdy poprzednie są już opanowane.",
      "To praktyka wymagająca siły i regularności, ale sekwencję można zacząć od jej pierwszej części. Stałość układu sprawia, że łatwo zauważyć własne postępy.",
    ],
  },
  kundalini: {
    heading: "Kundalini joga",
    lead: "Kundalini joga łączy ruch, oddech, medytację i śpiew mantr w zestawy ćwiczeń zwane krija. Praktyka skupiona na oddechu i koncentracji.",
    body: [
      "Zajęcia kundalini jogi zbudowane są z zestawów ćwiczeń nazywanych krija. Każdy łączy powtarzalne ruchy, techniki oddechowe, pozycje utrzymywane przez określony czas i koncentrację.",
      "Ważną częścią praktyki jest medytacja, często połączona ze śpiewem albo recytacją mantr. Zajęcia wyglądają więc inaczej niż lekcje stylów skupionych na pozycjach.",
      "Kundalini nie wymaga szczególnej gibkości. Sprawdzi się, jeśli pociąga Cię praca z oddechem i medytacja, a nie tylko ćwiczenia fizyczne.",
    ],
  },
  "power-yoga": {
    heading: "Power Yoga",
    lead: "Power Yoga to dynamiczna, wzmacniająca praktyka inspirowana ashtangą i vinyasą. Szybsze tempo, więcej pracy nad siłą i wytrzymałością.",
    body: [
      "Power Yoga powstała na bazie ashtangi, ale bez jej stałej sekwencji — układ zajęć zależy od nauczyciela. Pozycje łączy się w dynamiczne przejścia, a duży nacisk kładzie się na siłę i stabilność.",
      "Zajęcia przypominają intensywny trening: szybko rozgrzewają, angażują całe ciało i pozwalają się porządnie zmęczyć. Często przyciągają osoby, które trenują też inne dyscypliny.",
      "Jeśli dopiero zaczynasz, szukaj zajęć oznaczonych jako podstawowe albo zacznij od spokojniejszej vinyasy lub hatha jogi.",
    ],
  },
};

/** The copy for a style, or `null` — a page with no copy must 404, never render bare. */
export function getStyleCopy(slug: string): YogaStyleCopy | null {
  return YOGA_STYLE_COPY[slug] ?? null;
}
