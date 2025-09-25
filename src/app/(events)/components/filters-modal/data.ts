import { Language, PeriodSet, Price } from "./types";

export const languages: Language[] = [
  {
    language_code: "PL",
    language_name: "Polski",
  },
  {
    language_code: "EN",
    language_name: "Angelski",
  },
];

export const prices: Price[] = [
  { min_price: 0, max_price: 1000 },
  { min_price: 1001, max_price: 2000 },
  { min_price: 2001, max_price: 4000 },
];

export const PeriodSets: PeriodSet[] = [
  {
    start_date: "2025-12-24",
    end_date: "2026-01-03",
    name: "Wigilia 2025",
  },
  {
    start_date: "2026-01-19",
    end_date: "2026-02-01",
    name: "Ferie 2026",
  },
  {
    start_date: "2026-04-05",
    end_date: "2026-04-06",
    name: "Wielkanoc 2026",
  },
  {
    start_date: "2026-04-25",
    end_date: "2026-05-10",
    name: "Majówka 2026",
  },
  {
    start_date: "2026-05-23",
    end_date: "2026-06-07",
    name: "Zielone Święta 2026",
  },
];
