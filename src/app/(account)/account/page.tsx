"use client";

import { Bell, Calendar, HelpCircle, LogOut, User as UserIcon, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PassWalletCard } from "@/components/b2b/PassWalletCard";
import { SetLastMode } from "@/components/layout/SetLastMode";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import type { MyBookingsResponse, MyPassWalletOut } from "./types";

/**
 * B2C profile hub (spec-b2b §7) — no tab bar in B2C (would conflict with public
 * pages' own bottom bars); this is the one screen reached from the header avatar.
 * Element order is the committed scope: header → rezerwacje row → karnety wallet →
 * konto rows → wyloguj → pinned switch (partners only).
 */
export default function AccountHubPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<MyBookingsResponse | null>(null);
  const [wallets, setWallets] = useState<MyPassWalletOut[]>([]);
  const isPartner = Boolean(user?.partner);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/konto/logowanie?next=${encodeURIComponent("/konto")}`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    axiosInstance
      .get<MyBookingsResponse>("/users/me/bookings")
      .then((r) => setSummary(r.data))
      .catch(() => undefined);
    axiosInstance
      .get<MyPassWalletOut[]>("/users/me/passes")
      .then((r) => setWallets(r.data))
      .catch(() => undefined);
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  function handleClose() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  async function handleBecomePartner() {
    try {
      await axiosInstance.post("/partner/instant");
      router.push("/konto/partner");
    } catch {
      toast({ description: "Nie udało się utworzyć konta partnera.", variant: "destructive" });
    }
  }

  const bookingsSubtitle = summary
    ? [
        summary.upcoming_count > 0 ? `${summary.upcoming_count} nadchodzące` : null,
        summary.inquiry_count > 0 ? `${summary.inquiry_count} zapytanie` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Brak rezerwacji"
    : "";

  return (
    <div className="min-h-[100dvh] bg-background pb-28">
      <SetLastMode mode="b2c" />

      <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background px-4">
        <button
          onClick={handleClose}
          aria-label="Zamknij"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <X size={18} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-900">
          Profil
        </h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-semibold text-gray-600">
            {user?.email?.charAt(0).toUpperCase() ?? <UserIcon size={22} />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-900">{user?.email}</p>
          </div>
        </div>

        <Link
          href="/konto/rezerwacje"
          className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Calendar size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Twoje rezerwacje</p>
            <p className="text-xs text-gray-500">{bookingsSubtitle}</p>
          </div>
        </Link>

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Twoje karnety
          </h2>
          {wallets.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white px-4 py-4 text-center">
              <p className="text-sm text-gray-500">Nie masz jeszcze karnetu.</p>
              <Link href="/wyjazdy" className="text-sm font-semibold text-brand-green-700">
                Znajdź studio
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {wallets.map((w) => (
                <div key={w.studio_id} className="space-y-1">
                  <PassWalletCard
                    wallet={{
                      state: w.state,
                      pass_name: w.pass_name,
                      entries_total: w.entries_total,
                      entries_left: w.entries_left,
                      valid_until: w.valid_until,
                    }}
                  />
                  <p className="px-1 text-xs text-gray-400">{w.studio_name}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Konto
          </h2>
          <div className="rounded-xl border bg-white overflow-hidden divide-y">
            {/* Account settings sub-pages are out of this task's committed scope
                (spec-b2b §7: "detailed B2C design is deferred") — rows are visual
                only until a later plan builds their destinations. */}
            <StaticRow title="Dane konta" subtitle="Imię, e-mail, hasło" Icon={UserIcon} />
            <StaticRow title="Powiadomienia" subtitle="Przypomnienia o zajęciach" Icon={Bell} />
            <StaticRow title="Pomoc i kontakt" subtitle="Napisz do nas" Icon={HelpCircle} />
          </div>
        </section>

        {!isPartner && (
          <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              Prowadzisz zajęcia lub studio?{" "}
              <button
                onClick={handleBecomePartner}
                className="font-semibold text-brand-green-700 hover:underline"
              >
                Załóż konto partnera
              </button>
            </p>
          </div>
        )}

        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 hover:text-red-700"
        >
          <LogOut size={14} />
          Wyloguj się
        </button>
      </div>

      {isPartner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background px-4 py-3">
          <div className="max-w-md mx-auto">
            <Button variant="green" className="w-full" asChild>
              <Link href="/konto/partner">⇄ Przełącz na konto partnera</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StaticRow({
  title,
  subtitle,
  Icon,
}: {
  title: string;
  subtitle: string;
  Icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon size={18} className="text-gray-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
    </div>
  );
}
