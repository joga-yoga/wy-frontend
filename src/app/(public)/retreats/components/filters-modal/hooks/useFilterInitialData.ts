import { useCallback, useEffect, useState } from "react";

import { axiosInstance } from "@/lib/axiosInstance";

export interface FilterInitialData {
  countries: { name: string; country_code: string }[];
  state_provinces: { name: string; state_province_code: string }[];
  price_min: number;
  price_max: number;
}

export const useFilterInitialData = (isOpen: boolean) => {
  const [data, setData] = useState<FilterInitialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get("/retreats/public/filters");
      const responseData = response.data;

      if (responseData && typeof responseData === "object") {
        setData({
          countries: responseData.countries || [],
          state_provinces: responseData.state_provinces || [],
          price_min: responseData.price_min || 0,
          price_max: responseData.price_max || 0,
        });
      } else {
        setError("Invalid response format");
      }
    } catch (err) {
      console.error("Failed to load filter initial data:", err);
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to load filter data: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return { data, loading, error };
};
