import type { ArticleDetail, ArticleList } from "./types";

// Synthetic local development examples, not publication content. Only api.ts may enable
// these in the application; tests can also serve them through a local HTTP contract stub.
export const articleFixtures: ArticleDetail[] = [
  {
    slug: "lokalna-praktyka",
    title: "Spokojna praktyka — przykład lokalny",
    description: "Lokalny przykład artykułu o codziennej praktyce.",
    lead: "Przykładowy tekst do sprawdzenia widoku codziennej praktyki.",
    canonical_url: "https://joga.yoga/blog/lokalna-praktyka",
    updated_at: "2026-09-01T12:00:00Z",
    published_at: null,
    author: null,
    seo_metadata: {
      title: "Spokojna praktyka — przykład lokalny",
      description: "Lokalny przykład artykułu o codziennej praktyce.",
    },
    content: {
      format: "structured_sections",
      lead: "Przykładowy tekst do sprawdzenia widoku codziennej praktyki.",
      headline: "Chwila na praktykę",
      sections: [
        {
          title: "Miejsce na odpoczynek",
          body: "Przykładowy akapit o spokojnym miejscu.\n\nDrugi akapit pozwala sprawdzić odstępy między fragmentami tekstu.",
        },
      ],
      faq: [],
    },
    citations: [],
  },
  {
    slug: "lokalny-dlugi-artykul",
    title: "Przygotowanie do praktyki — długi przykład lokalny",
    description: "Przykład kilku sekcji, list i formatowania tekstu.",
    lead: "Ten lokalny przykład służy do sprawdzenia dłuższej lektury na telefonie i komputerze.",
    canonical_url: "https://joga.yoga/blog/lokalny-dlugi-artykul",
    updated_at: "2026-09-02T12:00:00Z",
    published_at: null,
    seo_metadata: {
      title: "Przygotowanie do praktyki — przykład lokalny",
      description: "Przykład kilku sekcji, list i formatowania tekstu.",
    },
    content: {
      format: "structured_sections",
      lead: "Ten lokalny przykład służy do sprawdzenia dłuższej lektury na telefonie i komputerze.",
      headline: "Przygotowanie krok po kroku",
      sections: [
        {
          title: "Przestrzeń",
          body: "Przykładowy akapit z **wyróżnieniem** i *kursywą*.\n\n- Mata\n- Wygodne ubranie\n- Miejsce na ruch\n\nPo liście następuje kolejny akapit.",
        },
        {
          title: "Kolejność",
          body: "1. Przygotuj miejsce.\n2. Usiądź wygodnie.\n3. Zakończ chwilą odpoczynku.\n\n### Dodatkowa uwaga\nTo przykład podtytułu w sekcji, a nie nowe H1.",
        },
        {
          title: "Czas",
          body: "Przykładowy dłuższy fragment opisuje przestrzeń na codzienną praktykę. Spokojny układ tekstu pozwala przeczytać go na ekranie o różnej szerokości.\n\nKolejny akapit pomaga sprawdzić długość wiersza i rytm tekstu. Każda sekcja zachowuje nagłówek dostarczony przez API.",
        },
        {
          title: "Powrót do lektury",
          body: "Przykładowy [link do innego artykułu](/blog/lokalna-praktyka).\n\n> Przykładowy cytat do sprawdzenia formatowania.",
        },
      ],
      faq: [],
    },
    citations: [],
  },
  {
    slug: "lokalne-faq",
    title: "Pytania o praktykę — przykład lokalny",
    description: "Lokalny przykład FAQ, cytowań i dostarczonej informacji medycznej.",
    lead: "Przykład pokazuje opcjonalne elementy dostarczone przez backend.",
    canonical_url: "https://joga.yoga/blog/lokalne-faq",
    updated_at: "2026-09-03T12:00:00Z",
    published_at: "2026-08-30T12:00:00Z",
    author: { name: "Autor przykładu lokalnego" },
    seo_metadata: {
      title: "Pytania o praktykę — przykład lokalny",
      description: "Lokalny przykład FAQ, cytowań i dostarczonej informacji medycznej.",
    },
    content: {
      format: "structured_sections",
      lead: "Przykład pokazuje opcjonalne elementy dostarczone przez backend.",
      headline: "Pytania i źródła",
      sections: [
        {
          title: "Lektura",
          body: "To **tekst testowy**, który nie jest artykułem przeznaczonym do publikacji.",
        },
      ],
      faq: [
        {
          question: "Czy to treść do publikacji?",
          answer:
            "Nie. To przykład do **lokalnej weryfikacji**.\n\n- Sprawdza formatowanie.\n- Sprawdza listy.",
        },
      ],
      medical_disclaimer:
        "Przykładowa informacja medyczna dostarczona w danych testowych. Ten tekst nie zastępuje indywidualnej konsultacji.",
    },
    citations: ["https://www.who.int/", "Przykładowa pozycja bibliograficzna bez adresu URL."],
  },
];

export function articleFixtureList(): ArticleList {
  return {
    total: articleFixtures.length,
    items: articleFixtures.map(
      ({ slug, title, description, lead, canonical_url, updated_at, published_at }) => ({
        slug,
        title,
        description,
        lead,
        canonical_url,
        updated_at,
        published_at,
      }),
    ),
  };
}
