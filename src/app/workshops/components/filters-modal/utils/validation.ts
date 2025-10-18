import { WorkshopsFiltersState } from "../hooks/useFiltersState";

export const isDefaultFilterState = (
  filters: WorkshopsFiltersState,
  serverPriceMin: number | null,
  serverPriceMax: number | null,
): boolean => {
  const hasNonPriceFilters =
    filters.selectedCityName !== null ||
    filters.selectedLanguageCode !== null ||
    filters.selectedPeriodSet !== null ||
    filters.startDateFrom !== null ||
    filters.startDateTo !== null ||
    (filters.selectedTags && filters.selectedTags.length > 0) ||
    filters.format !== "all";

  const hasPriceFilters =
    filters.priceMin !== serverPriceMin || filters.priceMax !== serverPriceMax;

  return !hasNonPriceFilters && !hasPriceFilters;
};

export const buildFilterUrl = (
  filters: WorkshopsFiltersState,
  serverPriceMin: number | null = null,
  serverPriceMax: number | null = null,
): string => {
  if (isDefaultFilterState(filters, serverPriceMin, serverPriceMax)) {
    return "/workshops";
  }

  const params = new URLSearchParams();

  if (filters.selectedCityName) params.append("city", filters.selectedCityName);
  if (filters.startDateFrom) params.append("start_date_from", filters.startDateFrom);
  if (filters.startDateTo) params.append("start_date_to", filters.startDateTo);

  if (filters.priceMin !== null && filters.priceMin !== serverPriceMin) {
    params.append("price_min", filters.priceMin.toString());
  }
  if (filters.priceMax !== null && filters.priceMax !== serverPriceMax) {
    params.append("price_max", filters.priceMax.toString());
  }

  if (filters.selectedLanguageCode) params.append("language", filters.selectedLanguageCode);

  if (filters.selectedTags && filters.selectedTags.length) {
    params.append("tags", filters.selectedTags.join(","));
  }

  if (filters.format === "online") params.append("is_online", "true");
  if (filters.format === "onsite") params.append("is_onsite", "true");

  return params.toString() ? `/workshops?${params.toString()}` : "/workshops";
};
