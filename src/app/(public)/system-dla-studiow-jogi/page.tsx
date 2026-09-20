import type { Metadata } from "next";

import { StudioMarketingPage } from "./StudioMarketingPage";

export const metadata: Metadata = {
  title: "System do prowadzenia studia jogi",
  description: "Grafik, zapisy, uczestnicy oraz oferta studia jogi w jednym systemie joga.yoga.",
  alternates: { canonical: "/system-dla-studiow-jogi" },
};

export default function ForStudiosPage() {
  return <StudioMarketingPage />;
}
