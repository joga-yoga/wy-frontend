import { useCallback, useEffect, useState } from "react";

import { PeriodSet } from "../types";
import { FilterInitialData } from "./useFilterInitialData";

export interface FiltersState {
  selectedCountryName: string | null;
  startDateFrom: string | null;
  startDateTo: string | null;
  priceMin: number | null;
  priceMax: number | null;
  selectedLanguageCode: string | null;
  selectedPeriodSet: PeriodSet | null;
}

export interface FiltersSetters {
  setSelectedCountryName: (value: string | null) => void;
  setStartDateFrom: (value: string | null) => void;
  setStartDateTo: (value: string | null) => void;
  setPriceMin: (value: number | null) => void;
  setPriceMax: (value: number | null) => void;
  setSelectedLanguageCode: (value: string | null) => void;
  setSelectedPeriodSet: (value: PeriodSet | null) => void;
}

export interface FiltersActions {
  clearAll: () => void;
  resetPriceToServer: () => void;
  resetPeriodToDefault: () => void;
}

export const useFiltersState = (
  initialData?: FilterInitialData | null,
  urlFilters?: Partial<FiltersState> | null,
) => {
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(
    urlFilters?.selectedCountryName || null,
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

  const [serverPriceMin, setServerPriceMin] = useState<number | null>(null);
  const [serverPriceMax, setServerPriceMax] = useState<number | null>(null);

  // Initialize values from URL parameters when they change
  useEffect(() => {
    if (urlFilters) {
      if (urlFilters.selectedCountryName !== undefined) {
        setSelectedCountryName(urlFilters.selectedCountryName);
      }
      if (urlFilters.startDateFrom !== undefined) {
        setStartDateFrom(urlFilters.startDateFrom);
      }
      if (urlFilters.startDateTo !== undefined) {
        setStartDateTo(urlFilters.startDateTo);
      }
      if (urlFilters.priceMin !== undefined) {
        setPriceMin(urlFilters.priceMin);
      }
      if (urlFilters.priceMax !== undefined) {
        setPriceMax(urlFilters.priceMax);
      }
      if (urlFilters.selectedLanguageCode !== undefined) {
        setSelectedLanguageCode(urlFilters.selectedLanguageCode);
      }
    }
  }, [urlFilters]);

  // Initialize price values from API data when available
  useEffect(() => {
    if (initialData) {
      setServerPriceMin(initialData.price_min);
      setServerPriceMax(initialData.price_max);

      // Only set price values from server if no URL parameters override them
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
    setSelectedCountryName(null);
    setStartDateFrom(null);
    setStartDateTo(null);
    setPriceMin(serverPriceMin);
    setPriceMax(serverPriceMax);
    setSelectedLanguageCode(null);
    setSelectedPeriodSet(null);
  }, [serverPriceMin, serverPriceMax]);

  return {
    filters: {
      selectedCountryName,
      startDateFrom,
      startDateTo,
      priceMin,
      priceMax,
      selectedLanguageCode,
      selectedPeriodSet,
    } as FiltersState,
    setters: {
      setSelectedCountryName,
      setStartDateFrom,
      setStartDateTo,
      setPriceMin,
      setPriceMax,
      setSelectedLanguageCode,
      setSelectedPeriodSet,
    } as FiltersSetters,
    actions: {
      clearAll,
      resetPriceToServer,
      resetPeriodToDefault,
    } as FiltersActions,
    serverData: {
      serverPriceMin,
      serverPriceMax,
    },
  };
};
