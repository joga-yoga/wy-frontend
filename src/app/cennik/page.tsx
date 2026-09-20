import type { Metadata } from "next";

import { PricingPage } from "./pricing-page";

export const metadata: Metadata = {
  title: "Cennik dla studiów jogi | joga.yoga",
  description:
    "Porównaj plany Flex, Balans i Przestrzeń. Sprawdź koszty prowadzenia studia jogi i wybierz sposób rozliczenia.",
  alternates: { canonical: "/cennik" },
};

export default function Page() {
  return <PricingPage />;
}
