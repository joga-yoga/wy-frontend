"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";

/**
 * Where the gateway sends the payer back.
 *
 * ⚠ **This page decides nothing.** Landing here is not proof of payment: the customer's
 * browser is not a trustworthy source, and a payer who closes the tab never arrives at all.
 * The provider's signed server-to-server callback is what actually settles a booking. This
 * screen only *reads* the state that callback produced, which is why it polls rather than
 * posting anything.
 *
 * Polling exists because the callback and the redirect race: a gateway often bounces the
 * browser back before its own webhook lands. Showing "nie zapłacono" for those two seconds
 * would be wrong and alarming, so an unresolved payment reads as "sprawdzamy" until it
 * settles or the attempts run out — at which point the honest answer is "we will email you",
 * because the callback will still arrive and the booking will still complete.
 *
 * **Where the buttons go is server-driven.** The payer arrives from the gateway with no
 * history behind them — the redirect replaced it — so "wróć" cannot mean `router.back()`,
 * and the query string carries only an id. `/payments/state` therefore also answers *where
 * this purchase came from*: the studio, and the class or pass that can be reopened. Every
 * one of those is optional, so each destination falls back to the home page rather than
 * constructing a URL out of a missing value.
 */

type Resolution = "checking" | "paid" | "pending" | "failed";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 10;

const HOME = "/";

interface PaymentStateResponse {
  state: "paid" | "pending" | "failed";
  studio_slug?: string | null;
  occurrence_id?: string | null;
  pass_id?: string | null;
}

function PaymentReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const bookingId = params.get("booking");
  const passId = params.get("pass");
  const orderId = params.get("order");

  const [resolution, setResolution] = useState<Resolution>("checking");
  // Where this purchase came from. Carried on *every* state response, including "pending",
  // so the destinations are known even when the payment never resolves while they wait.
  const [origin, setOrigin] = useState<PaymentStateResponse | null>(null);

  useEffect(() => {
    const query = bookingId
      ? `booking_id=${bookingId}`
      : passId
        ? `user_pass_id=${passId}`
        : orderId
          ? `order_id=${orderId}`
          : null;
    if (!query) {
      setResolution("failed");
      return;
    }

    let attempts = 0;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      attempts += 1;
      try {
        const { data } = await axiosInstance.get<PaymentStateResponse>(`/payments/state?${query}`);
        if (cancelled) return;
        setOrigin(data);
        if (data.state === "paid" || data.state === "failed") {
          setResolution(data.state);
          return;
        }
      } catch {
        // A failed poll is not a failed payment. Keep asking.
      }
      if (attempts >= MAX_ATTEMPTS) {
        setResolution("pending");
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [bookingId, passId, orderId]);

  // A studio with no slug has no public page, so every destination derived from it degrades
  // to the home page rather than routing to `/studio/undefined`.
  const studioHref = origin?.studio_slug ? `/studio/${origin.studio_slug}` : HOME;
  const studioLabel = origin?.studio_slug ? "Wróć do studia" : "Wróć na stronę główną";

  // Retry reopens the exact screen they paid from. A surcharge order is neither, and falls
  // back to the studio — the failure copy promises a retry is possible, not that it is here.
  const retryHref = origin?.occurrence_id
    ? `/book/class/${origin.occurrence_id}`
    : origin?.pass_id
      ? `/book/pass/${origin.pass_id}`
      : studioHref;

  // `/account/bookings` lists bookings only; a bought pass shows up in the wallet on
  // `/account`. Pointing a pass buyer at the bookings list would show them nothing.
  const account = origin?.occurrence_id
    ? { href: "/account/bookings", label: "Moje rezerwacje" }
    : origin?.pass_id
      ? { href: "/account", label: "Moje karnety" }
      : null;

  const content = {
    checking: {
      icon: <Clock className="h-10 w-10 text-gray-400" />,
      title: "Sprawdzamy płatność",
      body: "To potrwa chwilę — nie zamykaj tej strony.",
    },
    paid: {
      icon: <CheckCircle2 className="h-10 w-10 text-brand-green-700" />,
      title: "Zapłacono",
      body: "Potwierdzenie wysłaliśmy na Twój adres e-mail.",
    },
    pending: {
      icon: <Clock className="h-10 w-10 text-gray-400" />,
      title: "Czekamy na potwierdzenie",
      body: "Twój bank jeszcze nie potwierdził płatności. Damy znać e-mailem, gdy tylko to zrobi — nie musisz nic robić.",
    },
    failed: {
      icon: <XCircle className="h-10 w-10 text-destructive" />,
      title: "Płatność się nie powiodła",
      body: "Nic nie zostało pobrane. Możesz spróbować zarezerwować ponownie.",
    },
  }[resolution];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      {content.icon}
      <h1 className="mt-4 text-xl font-extrabold text-gray-900">{content.title}</h1>
      <p className="mt-2 text-sm text-gray-600">{content.body}</p>

      {resolution !== "checking" && (
        <>
          <Button
            className="mt-8 w-full"
            variant="green"
            size="cta"
            onClick={() => router.push(resolution === "failed" ? retryHref : studioHref)}
          >
            {resolution === "failed" ? "Spróbuj ponownie" : studioLabel}
          </Button>

          {resolution === "failed"
            ? // Only worth offering when it is not where the primary button already goes.
              retryHref !== studioHref && (
                <button
                  type="button"
                  className="mt-4 text-sm text-gray-500 underline underline-offset-4"
                  onClick={() => router.push(studioHref)}
                >
                  {studioLabel}
                </button>
              )
            : account && (
                <button
                  type="button"
                  className="mt-4 text-sm text-gray-500 underline underline-offset-4"
                  onClick={() => router.push(account.href)}
                >
                  {account.label}
                </button>
              )}
        </>
      )}
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
          Ładowanie...
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
