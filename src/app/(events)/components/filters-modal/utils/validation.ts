import { FiltersState } from "../hooks/useFiltersState";

export const isDefaultFilterState = (
  filters: FiltersState,
  serverPriceMin: number | null,
  serverPriceMax: number | null,
): boolean => {
  // Non-price filters should all be null in default state
  const hasNonPriceFilters =
    filters.selectedCountryName !== null ||
    filters.selectedLanguageCode !== null ||
    filters.selectedPeriodSet !== null ||
    filters.startDateFrom !== null ||
    filters.startDateTo !== null;

  // Price filters should match server values in default state
  const hasPriceFilters =
    filters.priceMin !== serverPriceMin || filters.priceMax !== serverPriceMax;

  return !hasNonPriceFilters && !hasPriceFilters;
};

export const buildApiParams = (filters: FiltersState): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.selectedCountryName) {
    params.append("country", filters.selectedCountryName);
  }

  if (filters.startDateFrom) {
    params.append("start_date_from", filters.startDateFrom);
  }

  if (filters.startDateTo) {
    params.append("start_date_to", filters.startDateTo);
  }

  if (filters.priceMin !== null) {
    params.append("price_min", filters.priceMin.toString());
  }

  if (filters.priceMax !== null) {
    params.append("price_max", filters.priceMax.toString());
  }

  if (filters.selectedLanguageCode) {
    params.append("language", filters.selectedLanguageCode);
  }

  params.append("sortBy", "published_at");
  params.append("sortOrder", "desc");
  params.append("limit", "10");
  params.append("skip", "0");

  return params;
};

export const buildFilterUrl = (
  filters: FiltersState,
  serverPriceMin: number | null = null,
  serverPriceMax: number | null = null,
): string => {
  // Check if filters are in default state
  if (isDefaultFilterState(filters, serverPriceMin, serverPriceMax)) {
    return "/"; // Return clean URL without any parameters
  }

  // Build URL with parameters for non-default state
  const params = new URLSearchParams();

  // Only add filter parameters (exclude default sorting and pagination)
  if (filters.selectedCountryName) {
    params.append("country", filters.selectedCountryName);
  }

  if (filters.startDateFrom) {
    params.append("start_date_from", filters.startDateFrom);
  }

  if (filters.startDateTo) {
    params.append("start_date_to", filters.startDateTo);
  }

  // Only add price parameters if they differ from server values
  if (filters.priceMin !== null && filters.priceMin !== serverPriceMin) {
    params.append("price_min", filters.priceMin.toString());
  }

  if (filters.priceMax !== null && filters.priceMax !== serverPriceMax) {
    params.append("price_max", filters.priceMax.toString());
  }

  if (filters.selectedLanguageCode) {
    params.append("language", filters.selectedLanguageCode);
  }

  return params.toString() ? `/?${params.toString()}` : "/";
};

export const validatePriceRange = (min: number | null, max: number | null): boolean => {
  if (min === null || max === null) return true;
  return max >= min;
};
