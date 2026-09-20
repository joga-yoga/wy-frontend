"use client";

import { ChevronDown, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BenefitCalculator } from "./benefit-calculator";
import {
  calculatePlans,
  DEFAULT_CALCULATOR,
  formatMoney,
  formatSubscriptionPrice,
  partitionFeatures,
  type PlanId,
  PLANS,
  type PricingFeature,
  STUDIO_ONBOARDING_HREF,
} from "./pricing";

function FeatureRows({
  features,
  plan,
  available,
}: {
  features: readonly PricingFeature[];
  plan: (typeof PLANS)[number];
  available: boolean;
}) {
  return features.map((feature) => {
    const label =
      feature.id === "registrations"
        ? plan.includedRegistrations === null
          ? "Zapisy na zajęcia miesięcznie bez limitu"
          : `${plan.includedRegistrations} zapisów na zajęcia miesięcznie free`
        : feature.label;

    return (
      <li
        key={feature.id}
        className={cn(
          "flex items-start gap-2.5 px-4 py-[7px] text-[15px] leading-6",
          !available && "text-gray-400",
        )}
      >
        <Image
          src={`/images/pricing/${feature.icon}.svg`}
          width={24}
          height={24}
          alt=""
          className={cn("shrink-0", !available && "opacity-50")}
        />
        <span
          className={cn(
            !available && "decoration-gray-300 underline decoration-dotted underline-offset-4",
          )}
        >
          {label}
          <span className="sr-only">
            {available ? " — w planie" : " — niedostępne w tym planie"}
          </span>
        </span>
      </li>
    );
  });
}

export function PricingPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<PlanId>("flex");
  const [salesGrosze, setSalesGrosze] = useState<number>(DEFAULT_CALCULATOR.salesGrosze);
  const [registrations, setRegistrations] = useState<number>(DEFAULT_CALCULATOR.registrations);
  const [isExplanationOpen, setIsExplanationOpen] = useState(true);
  const selectedPlan = PLANS.find((plan) => plan.id === selectedId)!;
  const results = calculatePlans(salesGrosze, registrations);
  const featureGroups = partitionFeatures(selectedPlan);

  function closePage() {
    // App Router pushes preserve history. A direct entry with no previous page
    // must still have a useful close action, as in the existing checkout shell.
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <div className="min-h-dvh bg-gray-50 text-gray-800">
      <header className="mx-auto grid max-w-xl grid-cols-[40px_1fr_40px] items-center px-5 pt-6 pb-[13px]">
        <Link
          href="/"
          className="col-start-2 justify-self-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green-700"
          aria-label="joga.yoga — strona główna"
        >
          <Image src="/images/pricing/logo.svg" width={40} height={40} alt="joga.yoga" priority />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full text-gray-500"
          aria-label="Zamknij cennik"
          onClick={closePage}
        >
          <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-5 px-5 pb-[calc(180px+env(safe-area-inset-bottom))] md:gap-6 md:pt-4">
        <section aria-labelledby="pricing-heading" className="text-center">
          <h1
            id="pricing-heading"
            className="text-[30px] leading-[1.1] font-semibold tracking-[-0.75px]"
          >
            Wybierz sposób rozliczenia
          </h1>
          <p className="mx-auto mt-3 max-w-[356px] text-[15px] leading-[24.375px] text-gray-600">
            Płać miesięcznie. Cena abonamentu jest gwarantowana przez 12 miesięcy od momentu
            podpisania umowy
          </p>
          <p className="mt-5 text-xs leading-[1.4] text-gray-500">
            Podane ceny są cenami netto. Do kwoty należy doliczyć VAT 23%
          </p>
        </section>

        <fieldset className="flex min-w-0 flex-col gap-2.5">
          <legend className="sr-only">Wybierz plan dla studia</legend>
          {PLANS.map((plan) => (
            <label
              key={plan.id}
              className={cn(
                "flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-2 rounded-2xl border bg-white/60 px-4 py-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-green-700 min-[400px]:flex-nowrap",
                selectedId === plan.id
                  ? "border-gray-800 bg-white shadow-[0_8px_8px_0_var(--gray-100)]"
                  : "border-gray-200",
              )}
            >
              <input
                type="radio"
                name="pricing-plan"
                value={plan.id}
                checked={selectedId === plan.id}
                onChange={() => setSelectedId(plan.id)}
                className="size-4 shrink-0 accent-gray-800"
                aria-labelledby={`plan-${plan.id}`}
              />
              <span id={`plan-${plan.id}`} className="mr-auto text-base leading-6 font-semibold">
                {plan.name}
              </span>
              <span className="flex flex-wrap gap-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap",
                    plan.commissionPercent === 0
                      ? "bg-brand-green-700/10 text-brand-green-700"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  {plan.commissionPercent}% od nowych klientów
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap",
                    plan.includedRegistrations === null
                      ? "bg-brand-green-700/10 text-brand-green-700"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  {plan.includedRegistrations === null
                    ? "∞ zapisów"
                    : `${plan.includedRegistrations} zapisów free`}
                </span>
              </span>
              <span className="ml-auto shrink-0 text-right">
                <span className="block text-base leading-4 font-semibold whitespace-nowrap">
                  {formatMoney(plan.subscriptionNetGrosze)}
                </span>
                {plan.subscriptionNetGrosze > 0 && (
                  <span className="block text-[11px] leading-[13px] text-gray-400">
                    netto / mies.
                  </span>
                )}
              </span>
            </label>
          ))}
        </fieldset>

        <section
          aria-label={`Funkcje planu ${selectedPlan.name}`}
          className="rounded-2xl border border-gray-200 bg-white p-1.5"
        >
          <ul aria-label="Funkcje dostępne w planie">
            <FeatureRows features={featureGroups.included} plan={selectedPlan} available />
          </ul>
          {featureGroups.unavailable.length > 0 && (
            <>
              <ul aria-label="Funkcje niedostępne w planie">
                <FeatureRows
                  features={featureGroups.unavailable}
                  plan={selectedPlan}
                  available={false}
                />
              </ul>
              <p className="px-4 pt-1 pb-2 text-[11px] text-gray-500">
                Kropkowane podkreślenie oznacza funkcję niedostępną w wybranym planie.
              </p>
            </>
          )}
        </section>

        <section
          aria-label="Zasady prowizji"
          className="rounded-2xl border border-gray-200 bg-white p-1.5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-3.5 sm:flex-nowrap">
            <div className="min-w-0 flex-1 basis-40">
              <h2 className="text-sm leading-5 font-medium">Twój klient. Twoja sprzedaż</h2>
              <p className="mt-1 text-xs leading-[16.5px] text-gray-400">
                Twój link, strona studia, newsletter i social media
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-brand-green-700">
              0% prowizji joga.yoga
            </span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 p-3.5 sm:flex-nowrap">
            <div className="min-w-0 flex-1 basis-40">
              <h2 className="text-sm leading-5 font-medium">Klient przez joga.yoga</h2>
              <p className="mt-1 text-xs leading-[16.5px] text-gray-400">
                Prowizja dotyczy tylko klientów pozyskanych przez joga.yoga
              </p>
            </div>
            <span className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600">
              Prowizja zależna od planu
            </span>
          </div>
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between rounded-lg px-3.5 text-left text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-brand-green-700"
            aria-expanded={isExplanationOpen}
            aria-controls="commission-explanation"
            onClick={() => setIsExplanationOpen((open) => !open)}
          >
            Jak to działa?
            <ChevronDown
              className={cn(
                "size-4 motion-safe:transition-transform",
                isExplanationOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
          <div
            id="commission-explanation"
            hidden={!isExplanationOpen}
            className="px-3.5 pt-1 pb-3.5 text-[13px] leading-[21.125px] text-gray-600"
          >
            Prowizję joga.yoga pobieramy tylko wtedy, gdy nowy klient trafił do Ciebie przez
            joga.yoga i kupił wydarzenie, kurs lub wyjazd. Nie dotyczy ona zajęć regularnych,
            karnetów ani klientów z Twoich własnych kanałów.
          </div>
        </section>

        <BenefitCalculator
          salesGrosze={salesGrosze}
          registrations={registrations}
          onSalesChange={setSalesGrosze}
          onRegistrationsChange={setRegistrations}
          results={results}
          selectedPlanId={selectedId}
          onSelectPlan={setSelectedId}
        />
      </main>

      <footer
        data-pricing-cta
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-gray-50/95 px-5 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))] backdrop-blur-sm"
      >
        <div className="mx-auto max-w-[536px]">
          <Button
            asChild
            variant="green"
            size="action"
            className="h-auto min-h-[55px] w-full rounded-full py-3 text-base whitespace-normal shadow-[0_10px_15px_-3px_rgba(44,69,52,0.35)] motion-reduce:transition-none"
          >
            <Link href={STUDIO_ONBOARDING_HREF}>
              Wybieram {selectedPlan.name} za{" "}
              {formatSubscriptionPrice(selectedPlan.subscriptionGrossGrosze)} brutto / mies.
            </Link>
          </Button>
          <p className="mt-3 text-center text-[11.5px] leading-[17.25px] text-gray-400">
            Opłaty operatora płatności są naliczane osobno.
          </p>
        </div>
      </footer>
    </div>
  );
}
