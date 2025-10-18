import { useCallback, useEffect, useState } from "react";

import { PeriodSet } from "@/app/retreats/components/filters-modal/types";

import { WorkshopsFilterInitialData } from "./useFilterInitialData";

export type WorkshopsFormat = "all" | "online" | "onsite";

export interface WorkshopsFiltersState {
  selectedCityName: string | null;
  startDateFrom: string | null;
  startDateTo: string | null;
  priceMin: number | null;
  priceMax: number | null;
  selectedLanguageCode: string | null;
  selectedPeriodSet: PeriodSet | null;
  selectedTags: string[];
  format: WorkshopsFormat;
}

export interface WorkshopsFiltersSetters {
  setSelectedCityName: (value: string | null) => void;
  setStartDateFrom: (value: string | null) => void;
  setStartDateTo: (value: string | null) => void;
  setPriceMin: (value: number | null) => void;
  setPriceMax: (value: number | null) => void;
  setSelectedLanguageCode: (value: string | null) => void;
  setSelectedPeriodSet: (value: PeriodSet | null) => void;
  setSelectedTags: (value: string[]) => void;
  setFormat: (value: WorkshopsFormat) => void;
}

export interface WorkshopsFiltersActions {
  clearAll: () => void;
  resetPriceToServer: () => void;
  resetPeriodToDefault: () => void;
}

export const useFiltersState = (
  initialData?: WorkshopsFilterInitialData | null,
  urlFilters?: Partial<WorkshopsFiltersState> | null,
) => {
  const [selectedCityName, setSelectedCityName] = useState<string | null>(
    urlFilters?.selectedCityName || null,
  );
  const [startDateFrom, setStartDateFrom] = useState<string | null>(
    urlFilters?.startDateFrom || null,
  );
  const [startDateTo, setStartDateTo] = useState<string | null>(urlFilters?.startDateTo || null);
  const [priceMin, setPriceMin] = useState<number | null>(urlFilters?.priceMin || null);
  const [priceMax, setPriceMax] = useState<number | null>(urlFilters?.priceMax || null);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string | null>(
    urlFilters?.selectedLanguageCode || null,
  );
  const [selectedPeriodSet, setSelectedPeriodSet] = useState<PeriodSet | null>(
    urlFilters?.selectedPeriodSet || null,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(urlFilters?.selectedTags || []);
  const [format, setFormat] = useState<WorkshopsFormat>((urlFilters as any)?.format ?? "all");

  const [serverPriceMin, setServerPriceMin] = useState<number | null>(null);
  const [serverPriceMax, setServerPriceMax] = useState<number | null>(null);

  useEffect(() => {
    if (urlFilters) {
      if (urlFilters.selectedCityName !== undefined)
        setSelectedCityName(urlFilters.selectedCityName);
      if (urlFilters.startDateFrom !== undefined) setStartDateFrom(urlFilters.startDateFrom);
      if (urlFilters.startDateTo !== undefined) setStartDateTo(urlFilters.startDateTo);
      if (urlFilters.priceMin !== undefined) setPriceMin(urlFilters.priceMin);
      if (urlFilters.priceMax !== undefined) setPriceMax(urlFilters.priceMax);
      if (urlFilters.selectedLanguageCode !== undefined)
        setSelectedLanguageCode(urlFilters.selectedLanguageCode);
      if (urlFilters.selectedTags !== undefined) setSelectedTags(urlFilters.selectedTags);
    }
  }, [urlFilters]);

  useEffect(() => {
    if (initialData) {
      setServerPriceMin(initialData.price_min);
      setServerPriceMax(initialData.price_max);

      if (
        priceMin === null &&
        priceMax === null &&
        !urlFilters?.priceMin &&
        !urlFilters?.priceMax
      ) {
        setPriceMin(initialData.price_min);
        setPriceMax(initialData.price_max);
      }
    }
  }, [initialData, priceMin, priceMax, urlFilters]);

  const resetPriceToServer = useCallback(() => {
    setPriceMin(serverPriceMin);
    setPriceMax(serverPriceMax);
  }, [serverPriceMin, serverPriceMax]);

  const resetPeriodToDefault = useCallback(() => {
    setStartDateFrom(null);
    setStartDateTo(null);
    setSelectedPeriodSet(null);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedCityName(null);
    setStartDateFrom(null);
    setStartDateTo(null);
    setPriceMin(serverPriceMin);
    setPriceMax(serverPriceMax);
    setSelectedLanguageCode(null);
    setSelectedPeriodSet(null);
    setSelectedTags([]);
    setFormat("all");
  }, [serverPriceMin, serverPriceMax]);

  return {
    filters: {
      selectedCityName,
      startDateFrom,
      startDateTo,
      priceMin,
      priceMax,
      selectedLanguageCode,
      selectedPeriodSet,
      selectedTags,
      format,
    } as WorkshopsFiltersState,
    setters: {
      setSelectedCityName,
      setStartDateFrom,
      setStartDateTo,
      setPriceMin,
      setPriceMax,
      setSelectedLanguageCode,
      setSelectedPeriodSet,
      setSelectedTags,
      setFormat,
    } as WorkshopsFiltersSetters,
    actions: {
      clearAll,
      resetPriceToServer,
      resetPeriodToDefault,
    } as WorkshopsFiltersActions,
    serverData: {
      serverPriceMin,
      serverPriceMax,
    },
  };
};
