import { useCallback, useMemo } from "react";

export const useFilterValidation = (priceMin: number | null, priceMax: number | null) => {
  const hasValidationError = useMemo(
    () => priceMin !== null && priceMax !== null && priceMax < priceMin,
    [priceMin, priceMax],
  );

  const resetPricesIfInvalid = useCallback(
    (setPriceMin: (value: number | null) => void, setPriceMax: (value: number | null) => void) => {
      if (hasValidationError) {
        setPriceMin(null);
        setPriceMax(null);
      }
    },
    [hasValidationError],
  );

  return {
    hasValidationError,
    resetPricesIfInvalid,
  };
};
