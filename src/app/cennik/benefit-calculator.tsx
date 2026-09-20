import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import {
  type calculatePlans,
  formatMoney,
  formatSubscriptionPrice,
  type PlanId,
  PLANS,
  recommendPlan,
  REGISTRATION_TICKS,
  SALES_TICKS,
} from "./pricing";
import styles from "./pricing.module.css";

interface RangeControlProps {
  id: string;
  label: string;
  ticks: readonly number[];
  value: number;
  onChange: (value: number) => void;
  currency?: boolean;
}

// Figma uses evenly spaced, non-linear ticks. Interpolate between these anchors
// while exposing the actual amount (not its track position) to assistive tech.
function RangeControl({ id, label, ticks, value, onChange, currency = false }: RangeControlProps) {
  const lastIndex = ticks.length - 1;
  const segment = Math.max(0, ticks.findIndex((tick) => tick >= value) - 1);
  const position =
    value === ticks[lastIndex]
      ? lastIndex * 100
      : (segment + (value - ticks[segment]) / (ticks[segment + 1] - ticks[segment])) * 100;
  const displayValue = currency
    ? formatMoney(value * 100)
    : new Intl.NumberFormat("pl-PL").format(value);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm leading-[21px] font-medium">
        <label htmlFor={id}>{label}</label>
        {!currency && (
          <output htmlFor={id} className="text-gray-600">
            {displayValue}
          </output>
        )}
      </div>
      {currency && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-brand-green-700 px-3.5 py-3.5">
          <output htmlFor={id} className="text-lg leading-[27px] font-semibold">
            {displayValue}
          </output>
          <span className="text-sm text-gray-500">PLN / miesięcznie</span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={0}
        max={lastIndex * 100}
        step={1}
        value={position}
        aria-valuemin={ticks[0]}
        aria-valuemax={ticks[lastIndex]}
        aria-valuenow={value}
        aria-valuetext={`${displayValue}${currency ? " sprzedaży" : " zapisów"} miesięcznie`}
        className={styles.range}
        style={{ "--range-progress": `${position / lastIndex}%` } as CSSProperties}
        onChange={(event) => {
          const nextPosition = Number(event.target.value) / 100;
          const index = Math.min(lastIndex - 1, Math.floor(nextPosition));
          onChange(
            Math.round(ticks[index] + (ticks[index + 1] - ticks[index]) * (nextPosition - index)),
          );
        }}
      />
      <div
        aria-hidden="true"
        className="flex justify-between gap-1 text-[10px] leading-[15px] text-gray-500"
      >
        {ticks.map((tick, index) => (
          <span key={tick}>
            {currency ? formatMoney(tick * 100) : tick}
            {index === lastIndex ? "+" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

interface BenefitCalculatorProps {
  salesGrosze: number;
  registrations: number;
  onSalesChange: (grosze: number) => void;
  onRegistrationsChange: (count: number) => void;
  results: ReturnType<typeof calculatePlans>;
  selectedPlanId: PlanId;
  onSelectPlan: (planId: PlanId) => void;
}

export function BenefitCalculator({
  salesGrosze,
  registrations,
  onSalesChange,
  onRegistrationsChange,
  results,
  selectedPlanId,
  onSelectPlan,
}: BenefitCalculatorProps) {
  const recommended = recommendPlan(results);

  function keepResultVisible(button: HTMLButtonElement) {
    requestAnimationFrame(() => {
      const stickyFooter = document.querySelector<HTMLElement>("footer[data-pricing-cta]");
      const visibleBottom = stickyFooter?.getBoundingClientRect().top ?? window.innerHeight;
      const bounds = button.getBoundingClientRect();

      if (bounds.top < 0 || bounds.bottom > visibleBottom) {
        button.scrollIntoView({
          block: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }
    });
  }
  return (
    <section
      aria-labelledby="calculator-heading"
      className="rounded-2xl border border-[#e2e0d6] bg-white p-5"
    >
      <h2
        id="calculator-heading"
        className="mb-3 text-2xl leading-[30px] font-medium tracking-[-0.24px]"
      >
        Sprawdź, który plan opłaca się Twojemu studiu
      </h2>
      <div className="space-y-3">
        <RangeControl
          id="monthly-sales"
          label="Sprzedaż nowym klientom z joga.yoga / mies."
          value={salesGrosze / 100}
          onChange={(value) => onSalesChange(value * 100)}
          ticks={SALES_TICKS}
          currency
        />
        <p className="-mt-1 text-xs leading-[18px] text-gray-500">
          Tylko wydarzenia, kursy i wyjazdy kupione przez nowe osoby, które znalazły studio w
          joga.yoga.
        </p>
        <RangeControl
          id="monthly-registrations"
          label="Zapisów miesięcznie"
          value={registrations}
          onChange={onRegistrationsChange}
          ticks={REGISTRATION_TICKS}
        />
      </div>
      <p className="mt-5 mb-3 text-xs leading-[18px] text-gray-500">
        Podane ceny są cenami brutto. Podatek VAT jest już wliczony w cenę.
      </p>
      <ul aria-label="Miesięczny koszt planów" className="space-y-1.5">
        {results.map((result) => {
          const isRecommended = recommended.plan.id === result.plan.id;
          const isSelected = selectedPlanId === result.plan.id;
          return (
            <li key={result.plan.id}>
              <button
                type="button"
                data-testid={`result-${result.plan.id}`}
                aria-pressed={isSelected}
                onClick={(event) => {
                  onSelectPlan(result.plan.id);
                  keepResultVisible(event.currentTarget);
                }}
                className={cn(
                  "w-full rounded-xl border px-3.5 py-3 text-left text-[15px] leading-[22.5px] outline-none motion-safe:transition-[border-color,box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-brand-green-700 focus-visible:ring-offset-2",
                  isSelected
                    ? "border-gray-800 bg-white shadow-sm"
                    : isRecommended
                      ? "border-transparent bg-[#eaf0ea] text-[#2c4534]"
                      : "border-transparent bg-[#eeece4]/60 text-gray-700",
                )}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      isSelected ? "border-gray-800" : "border-gray-300",
                    )}
                  >
                    {isSelected && <span className="size-2 rounded-full bg-gray-800" />}
                  </span>
                  <span className="font-semibold">{result.plan.name}</span>
                  {isRecommended && (
                    <span className="rounded-full bg-[#3a5a44] px-2 py-0.5 text-[10px] leading-[15px] font-semibold text-white">
                      POLECANY
                    </span>
                  )}
                </span>

                <span className="mt-2 block">
                  <span className="block text-base font-semibold text-gray-800">
                    {formatSubscriptionPrice(result.plan.subscriptionGrossGrosze)} brutto / mies.
                  </span>
                  <span className="block text-[11px] leading-4 text-gray-500">Abonament stały</span>
                </span>

                <span className="mt-2 block border-t border-gray-200/80 pt-2">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-gray-500">+ Koszty zmienne</span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatMoney(result.variableGrossGrosze)}
                    </span>
                  </span>
                  <span className="mt-1 grid grid-cols-[1fr_auto] gap-x-3 text-[11px] leading-4 text-gray-500">
                    <span>Prowizja od nowych klientów z joga.yoga</span>
                    <span className="whitespace-nowrap">
                      {formatMoney(result.commissionGrossGrosze)}
                    </span>
                    <span>Dodatkowe zapisy</span>
                    <span className="whitespace-nowrap">
                      {formatMoney(result.registrationGrossGrosze)}
                    </span>
                  </span>
                  {result.excessRegistrations > 0 && (
                    <span className="mt-1 block text-[10px] text-gray-500">
                      {result.excessRegistrations} zapisów poza pakietem
                    </span>
                  )}
                </span>

                <span className="mt-2 flex items-baseline justify-between gap-3 border-t border-gray-200/80 pt-2">
                  <span className="text-xs font-medium">= Szacunkowo / mies.</span>
                  <span className="font-semibold whitespace-nowrap">
                    {formatMoney(result.totalGrossGrosze)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Polecany plan: {recommended.plan.name}, {formatMoney(recommended.totalGrossGrosze)} brutto
        miesięcznie.
      </p>
      <p className="mt-3 text-[11.5px] leading-[18.7px] text-gray-400">
        Abonament + prowizja od nowych klientów z joga.yoga + opłaty za zapisy poza pakietem. Limit
        zapisów:{" "}
        {PLANS.map((plan) => `${plan.name} ${plan.includedRegistrations ?? "bez limitu"}`).join(
          ", ",
        )}
        . Dodatkowy zapis w Flex i Balans: {formatMoney(PLANS[0].extraRegistrationNetGrosze)} netto.
        Do kosztów doliczamy 23% VAT.
      </p>
    </section>
  );
}
