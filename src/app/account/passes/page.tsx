"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";

import type { MyPassWalletOut } from "../types";
import { PassTicketCard } from "./PassTicketCard";

/**
 * Every pass the customer holds (WY-71 item 3).
 *
 * This screen could not have existed before the backend change: `GET /users/me/passes`
 * returned one wallet per studio, so a second pass at the same studio was never sent. The
 * "Zarządzaj karnetami" row on the hub points here.
 *
 * Split active from the rest rather than sorting one list: "what can I use" and "what did I
 * have" are different questions, and a spent pass sitting between two usable ones makes the
 * first question harder to answer.
 */
export default function MyPassesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [passes, setPasses] = useState<MyPassWalletOut[] | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/account/login?next=${encodeURIComponent("/account/passes")}`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    axiosInstance
      .get<MyPassWalletOut[]>("/users/me/passes")
      .then((r) => setPasses(r.data))
      .catch(() => setPasses([]));
  }, [user]);

  if (loading || !user || passes === null) {
    return (
      <div className="flex min-h-[100dvh] justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const active = passes.filter((p) => p.state === "active");
  const rest = passes.filter((p) => p.state !== "active");

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background px-4">
        <button
          onClick={() => router.push("/account")}
          aria-label="Wróć"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="truncate text-xl font-bold text-gray-900">Karnety</h1>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-4 py-5">
        {passes.length === 0 && (
          <div className="rounded-b2b border border-dashed bg-white px-4 py-6 text-center">
            <p className="text-sm text-gray-500">Nie masz jeszcze karnetu.</p>
            <Link href="/wyjazdy" className="text-sm font-semibold text-brand-green-700">
              Znajdź studio
            </Link>
          </div>
        )}

        {active.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Aktywne
            </h2>
            {active.map((p) => (
              <PassTicketCard
                key={p.id}
                pass={p}
                onClick={() => router.push(`/account/passes/${p.id}`)}
              />
            ))}
          </section>
        )}

        {rest.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Historia
            </h2>
            {rest.map((p) => (
              <PassTicketCard
                key={p.id}
                pass={p}
                onClick={() => router.push(`/account/passes/${p.id}`)}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
