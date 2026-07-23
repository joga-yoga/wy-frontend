"use client";

import { Banknote, Check } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CheckoutNav } from "@/app/book/class/[occurrenceId]/CheckoutNav";
import { PaymentMethodSection } from "@/app/book/class/[occurrenceId]/PaymentMethodSection";
import { BlockedState } from "@/components/booking/BlockedState";
import { PassDetailBody } from "@/components/page-contents/studio/PassDetailBody";
import { formatMoney } from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";

import type { PassDetail, PassPurchaseOut, PassPurchaseScreen } from "./types";

function extractErrorDetail(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || fallback;
}

function formatValidUntil(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// ── Checkout screen ─────────────────────────────────────────────────

function CheckoutScreen({
  detail,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  detail: PassDetail;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const price = formatMoney(detail.price, detail.currency || detail.studio.currency);

  return (
    <div className="mx-auto max-w-md p-4 pb-8">
      <CheckoutNav studioSlug={detail.studio.slug} title="Zakup karnetu" />

      <PassDetailBody
        pass={detail}
        dropInPrice={detail.studio.drop_in_price}
        currency={detail.studio.currency}
      />

      <PaymentMethodSection studio={{ accepts_stripe: detail.studio.accepts_stripe }} />

      {submitError && <p className="mt-4 text-sm text-destructive">{submitError}</p>}

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">
          <Banknote className="h-[18px] w-[18px] shrink-0 text-brand-green-700" />
          <span>{price} · płatność gotówką na miejscu</span>
        </div>
        <Button
          className="w-full"
          variant="green"
          size="cta"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? "Kupuję..." : `Kup karnet · ${price}`}
        </Button>
      </div>
    </div>
  );
}

// ── Confirmation screen ──────────────────────────────────────────────

function ConfirmationScreen({ purchase }: { purchase: PassPurchaseOut }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-md px-4 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-700/10">
        <Check className="h-7 w-7 text-brand-green-700" />
      </div>
      <h1 className="mt-4 text-2xl font-extrabold text-gray-900">Karnet kupiony!</h1>
      <p className="mt-1.5 text-sm text-gray-500">Karnet czeka na Ciebie w studiu.</p>

      <div className="mt-6 divide-y divide-gray-100 text-left">
        <DetailRow label="Karnet" value={purchase.pass_name} />
        <DetailRow
          label="Wejścia"
          value={purchase.entries_total == null ? "Bez limitu" : purchase.entries_total}
        />
        <DetailRow
          label="Ważność"
          value={purchase.valid_until ? formatValidUntil(purchase.valid_until) : "Bezterminowo"}
        />
        <DetailRow
          label="Do zapłaty na miejscu"
          value={formatMoney(purchase.amount_owed, purchase.currency)}
        />
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-left text-sm text-gray-600">
        Zapłać {formatMoney(purchase.amount_owed, purchase.currency)} gotówką w recepcji przed
        pierwszym wejściem.
      </div>

      <div className="mt-6">
        <Button
          className="w-full text-white"
          style={{ background: "#1a1a1a" }}
          size="cta"
          onClick={() =>
            router.push(purchase.studio_slug ? `/studio/${purchase.studio_slug}/schedule` : "/")
          }
        >
          Wróć do grafiku studia
        </Button>
      </div>
    </div>
  );
}

// ── Root content ─────────────────────────────────────────────────────

function BookPassContent() {
  const { passId } = useParams<{ passId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [screen, setScreen] = useState<PassPurchaseScreen>("checkout");
  const [detail, setDetail] = useState<PassDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PassPurchaseOut | null>(null);

  useEffect(() => {
    if (authLoading || user) return;
    router.replace(`/profile/login?next=${encodeURIComponent(pathname)}`);
  }, [authLoading, user, router, pathname]);

  // Next.js's client router cache can keep this page's component instance (and its React
  // state) alive across a client-side navigation to a different passId — e.g. buying pass A,
  // then tapping "Kup karnet" for pass B from the studio page — rather than remounting fresh.
  // Without resetting here, the confirmation screen / errors from pass A could still show while
  // pass B's detail loads underneath them.
  useEffect(() => {
    if (!passId) return;
    setScreen("checkout");
    setSubmitError(null);
    setIsSubmitting(false);
    setPurchase(null);
    setDetailLoading(true);
    setDetailError(null);
    axiosInstance
      .get<PassDetail>(`/public/passes/${passId}/detail`)
      .then((r) => setDetail(r.data))
      .catch(() => setDetailError("Nie udało się wczytać karnetu."))
      .finally(() => setDetailLoading(false));
  }, [passId]);

  async function submitPurchase() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await axiosInstance.post<PassPurchaseOut>(`/passes/${passId}/purchase`);
      setPurchase(data);
      setScreen("confirmation");
    } catch (err) {
      setSubmitError(extractErrorDetail(err, "Nie udało się kupić karnetu."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Ładowanie...
      </div>
    );
  }

  if (detailLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Ładowanie...
      </div>
    );
  }

  if (detailError || !detail) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-destructive">
        {detailError || "Nie znaleziono karnetu."}
      </div>
    );
  }

  if (screen === "confirmation" && purchase) {
    return <ConfirmationScreen purchase={purchase} />;
  }

  const noPaymentMethods = !detail.studio.accepts_cash && !detail.studio.accepts_stripe;
  const contactHref = detail.studio.slug ? `/studio/${detail.studio.slug}` : null;

  if (noPaymentMethods) {
    return (
      <BlockedState
        title="Zakup niedostępny"
        body="To studio nie udostępniło jeszcze płatności online. Kup karnet bezpośrednio w studiu."
        contactHref={contactHref}
      />
    );
  }

  return (
    <CheckoutScreen
      detail={detail}
      onSubmit={submitPurchase}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  );
}

export default function BookPassPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
          Ładowanie...
        </div>
      }
    >
      <BookPassContent />
    </Suspense>
  );
}
