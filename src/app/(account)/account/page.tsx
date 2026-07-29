import { Metadata } from "next";

import { SetLastMode } from "@/components/layout/SetLastMode";

export const metadata: Metadata = {
  title: "Konto | Joga.Yoga",
};

// Placeholder B2C account hub. T13 replaces this with the real hub
// (profile card, bookings list, pinned mode-switch button).
export default function AccountHubPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-2 px-6 text-center">
      <SetLastMode mode="b2c" />
      <h1 className="text-xl font-semibold">Konto</h1>
      <p className="text-sm text-muted-foreground">Ta sekcja jest w przygotowaniu.</p>
    </main>
  );
}
