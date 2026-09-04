"use client";

import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { useSetPageSubtitle, useSetPageTitle } from "@/context/PageHeaderContext";

/**
 * Criterion 6. `DashboardTopBar` reads `usePartnerCapabilities()` and three PageHeader hooks —
 * it cannot render outside its providers. Here it renders from the shell's fixture wrapper,
 * making no API call at all.
 */
export default function TopBar() {
  useSetPageTitle("Grafik");
  useSetPageSubtitle("Bodhi Yoga Shala");

  return (
    <div className="flex flex-col">
      <DashboardTopBar />
      <p className="px-4 py-6 text-sm text-gray-500">
        Nagłówek panelu wyrenderowany z danych testowych, bez zapytań do API.
      </p>
    </div>
  );
}
