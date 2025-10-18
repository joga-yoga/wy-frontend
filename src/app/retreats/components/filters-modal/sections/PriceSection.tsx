"use client";

import FilterItem from "@/app/retreats/components/filters-modal/components/FilterItem";
import { prices } from "@/app/retreats/components/filters-modal/data";
import { formatPrice } from "@/app/retreats/components/filters-modal/helpers";

interface PriceSectionProps {
  priceMin: number | null;
  priceMax: number | null;
  serverPriceMin?: number | null;
  serverPriceMax?: number | null;
  onPriceSelect?: (min: number, max: number) => void;
  onPriceInputChange?: (min: number | null, max: number | null) => void;
  onResetToServer?: () => void;
}

export const PriceSection = ({
  priceMin,
  priceMax,
  serverPriceMin,
  serverPriceMax,
  onPriceSelect,
  onPriceInputChange,
  onResetToServer,
}: PriceSectionProps) => {
  // Check if current values match any existing price range
  const isExistingPriceRange = prices.some(
    (price) => priceMin === price.min_price && priceMax === price.max_price,
  );

  // Validation: check if max is less than min
  const hasValidationError = priceMin !== null && priceMax !== null && priceMax < priceMin;

  // Show custom filter when both values are set, don't match existing ranges, and no validation error
  const showCustomFilter =
    priceMin !== null && priceMax !== null && !isExistingPriceRange && !hasValidationError;

  // Format custom filter title
  const customFilterTitle = showCustomFilter ? `${priceMin} - ${priceMax} PLN` : "";

  return (
    <div className="mx-7 mt-11 mb-5">
      <p className="text-sub-descript-18 md:text-descr-under-big-head">Cena za jedną osobę</p>
      <div className="flex flex-wrap gap-x-[12px] gap-y-4 mt-5">
        {prices.map((price) => {
          const isSelected = priceMin === price.min_price && priceMax === price.max_price;
          return (
            <FilterItem
              key={`${price.max_price}${price.min_price}`}
              title={formatPrice(price)}
              isSelected={isSelected}
              onClick={() => {
                if (isSelected) {
                  onResetToServer?.();
                } else {
                  onPriceSelect?.(price.min_price, price.max_price);
                }
              }}
            />
          );
        })}
        {showCustomFilter && (
          <FilterItem
            key="custom-price"
            title={customFilterTitle}
            isSelected={true}
            onClick={() => {
              // Clear custom values when clicking on custom filter
              onPriceInputChange?.(null, null);
            }}
          />
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <div className="flex flex-col gap-1">
          <p className="text-gray-700 text-filter-subtitle">Od</p>
          <input
            type="number"
            name="priceMin"
            placeholder={serverPriceMin?.toString() || "670"}
            value={priceMin || ""}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : null;
              onPriceInputChange?.(value, priceMax);
            }}
            className={`w-[110px] h-[44px] rounded-[8px] border px-[12px] py-[10px] text-m-descript ${
              hasValidationError ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-gray-700 text-filter-subtitle">Do</p>
          <input
            type="number"
            name="priceMax"
            placeholder={serverPriceMax?.toString() || "18000"}
            value={priceMax || ""}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : null;
              onPriceInputChange?.(priceMin, value);
            }}
            className={`w-[110px] h-[44px] rounded-[8px] border px-[12px] py-[10px] text-m-descript ${
              hasValidationError ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
      </div>
      <p
        className={`text-red-500 text-sm mt-2 transition-opacity duration-200 ${
          hasValidationError ? "opacity-100" : "opacity-0"
        }`}
      >
        Maksymalna wartość powinna być większa niż minimalna
      </p>
    </div>
  );
};

export default PriceSection;
