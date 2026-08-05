"use client";

import {
  ArrowLeftRight,
  Bell,
  CalendarDays,
  ChevronRight,
  HelpCircle,
  LogOut,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PassCard } from "@/components/b2b/PassCard";
import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { SetLastMode } from "@/components/layout/SetLastMode";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { personInitials, personLabel } from "@/lib/personDisplay";
import { publicReturnHref } from "@/lib/publicReturn";

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
    // Always out to the public site — never to the partner panel. The panel is reached by
    // the pinned "Przełącz na konto partnera" button below, which is always on screen;
    // closing to it left a partner with no way out to joga.yoga at all.
    //
    // Not `router.back()`: by now the previous entry could be another account screen or an
    // auth bounce. The recorded public URL is the thing the user actually means.
    router.push(publicReturnHref());
  }

  async function handleBecomePartner() {
    try {
      await axiosInstance.post("/partner/instant");
      router.push("/konto/partner");
    } catch {
      toast({ description: "Nie udało się utworzyć konta partnera.", variant: "destructive" });
    }
  }

  const identity = personLabel(user?.name, user?.email ?? "");

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

      {/* F2 sets the title beside the X, not centred — same shape as every B2B inner
          screen, so crossing the B2B/B2C boundary does not feel like a different app. */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background px-4">
        <button
          onClick={handleClose}
          aria-label="Zamknij"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <X size={18} />
        </button>
        <h1 className="truncate text-xl font-bold text-gray-900">Profil</h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        <div className="flex items-center gap-3">
          <HashedAvatar
            seed={user?.id ?? identity.primary}
            name={identity.primary}
            initialsOverride={personInitials(user?.name, user?.email ?? "")}
            size={56}
          />
          {/* `personLabel` returns a secondary only when it differs from the primary, so
              a user with no name shows their email once rather than twice. */}
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-gray-900">{identity.primary}</p>
            {identity.secondary && (
              <p className="truncate text-sm text-gray-500">{identity.secondary}</p>
            )}
          </div>
        </div>

        <Link
          href="/konto/rezerwacje"
          className="flex items-center gap-3 rounded-b2b border bg-white px-4 py-3.5 transition-colors hover:bg-gray-50"
        >
          {/* Rounded square, not a circle: F2 reserves circles for people. */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <CalendarDays size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Twoje rezerwacje</p>
            <p className="text-xs text-gray-500">{bookingsSubtitle}</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-gray-400" />
        </Link>

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Twoje karnety
          </h2>
          {wallets.length === 0 ? (
            <div className="rounded-b2b border border-dashed bg-white px-4 py-4 text-center">
              <p className="text-sm text-gray-500">Nie masz jeszcze karnetu.</p>
              <Link href="/wyjazdy" className="text-sm font-semibold text-brand-green-700">
                Znajdź studio
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {wallets.map((w) => (
                // F2 puts the studio name *inside* the card where the partner-side card
                // puts the purchase line, and drops the state chip — on your own wallet,
                // a card being there already says it is usable.
                <PassCard
                  key={w.studio_id}
                  pass={w}
                  meta={w.studio_name}
                  showState={w.state !== "active"}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Konto
          </h2>
          <div className="rounded-b2b border bg-white overflow-hidden divide-y">
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
          className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-b2b-red-solid hover:text-b2b-red-solid"
        >
          <LogOut size={14} />
          Wyloguj się
        </button>
      </div>

      {/* Pinned, not scrolled with the content: B2C has no tab bar (it would collide
          with the public pages' own bottom bars), so this is the only way back and has to
          be always visible. Padded for the safe-area inset — part 1 shipped a FAB that
          overlapped the home indicator by 3px for exactly this reason. */}
      {isPartner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background px-4 pt-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto max-w-md">
            <Button size="action" variant="green" className="w-full gap-2" asChild>
              <Link href="/konto/partner">
                <ArrowLeftRight size={16} />
                Przełącz na konto partnera
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A Konto row with no destination yet.
 *
 * F2 draws chevrons on these, and the user asked for "chevrons on all buttons" — but
 * these three screens do not exist. A chevron is a promise the tap breaks, discovered
 * only by tapping. They carry the `Wkrótce` chip this codebase already uses for
 * `Dane rozliczeniowe` instead, and gain chevrons the day they gain destinations.
 */
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
        <p className="truncate text-xs text-gray-500">{subtitle}</p>
      </div>
      <StatusChip tone="gray">Wkrótce</StatusChip>
    </div>
  );
}
