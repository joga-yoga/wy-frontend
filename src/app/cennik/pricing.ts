export type PlanId = "flex" | "balans" | "przestrzen";

export interface PricingPlan {
  id: PlanId;
  name: string;
  subscriptionNetGrosze: number;
  subscriptionGrossGrosze: number;
  commissionPercent: number;
  includedRegistrations: number | null;
  extraRegistrationNetGrosze: number;
}

export const VAT_PERCENT = 23;
// Flex: marketing FAQ (Figma 1556:3001). Balans: provisional parity with Flex,
// explicitly approved by the product owner until authoritative billing config exists.
export const ASSUMED_BALANS_EXTRA_REGISTRATION_NET_GROSZE = 25;

// Figma 1165:2605. The owner confirmed these subscriptions are NET, not gross.
// Ordering also defines the lower-tier preference when monthly totals tie.
export const PLANS: readonly PricingPlan[] = [
  {
    id: "flex",
    name: "Flex",
    subscriptionNetGrosze: 0,
    subscriptionGrossGrosze: 0,
    commissionPercent: 11,
    includedRegistrations: 100,
    extraRegistrationNetGrosze: 25,
  },
  {
    id: "balans",
    name: "Balans",
    subscriptionNetGrosze: 7073,
    subscriptionGrossGrosze: 8700,
    commissionPercent: 5,
    includedRegistrations: 500,
    extraRegistrationNetGrosze: ASSUMED_BALANS_EXTRA_REGISTRATION_NET_GROSZE,
  },
  {
    id: "przestrzen",
    name: "Przestrzeń",
    subscriptionNetGrosze: 14228,
    subscriptionGrossGrosze: 17500,
    commissionPercent: 0,
    includedRegistrations: null,
    extraRegistrationNetGrosze: 0,
  },
];

export const DEFAULT_CALCULATOR = { salesGrosze: 100_000, registrations: 250 } as const;
export const SALES_TICKS = [0, 1000, 3000, 5000] as const;
export const REGISTRATION_TICKS = [0, 50, 100, 250, 500, 750, 1000] as const;
export const STUDIO_ONBOARDING_HREF = "/studio/dodaj";

export function formatMoney(grosze: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: grosze % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(grosze / 100);
}

export function formatSubscriptionPrice(grosze: number): string {
  if (grosze === 0) return "0 zł";

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(grosze / 100);
}

// Round half-up in integer minor units. Gross components are rounded separately
// so their visible sum always equals the displayed monthly estimate.
function percentOf(grosze: number, percent: number): number {
  return Math.floor((grosze * percent + 50) / 100);
}

function grossFromNet(grosze: number): number {
  return grosze + percentOf(grosze, VAT_PERCENT);
}

export function monthlyCost(plan: PricingPlan, salesGrosze: number, registrations: number) {
  if (![salesGrosze, registrations].every((value) => Number.isSafeInteger(value) && value >= 0)) {
    throw new RangeError("Sales and registrations must be non-negative integers");
  }
  const excessRegistrations =
    plan.includedRegistrations === null
      ? 0
      : Math.max(0, registrations - plan.includedRegistrations);
  const registrationNetGrosze = excessRegistrations * plan.extraRegistrationNetGrosze;
  const commissionNetGrosze = percentOf(salesGrosze, plan.commissionPercent);
  const commissionGrossGrosze = grossFromNet(commissionNetGrosze);
  const registrationGrossGrosze = grossFromNet(registrationNetGrosze);
  const variableGrossGrosze = commissionGrossGrosze + registrationGrossGrosze;
  return {
    plan,
    excessRegistrations,
    registrationNetGrosze,
    registrationGrossGrosze,
    commissionNetGrosze,
    commissionGrossGrosze,
    variableGrossGrosze,
    totalGrossGrosze: plan.subscriptionGrossGrosze + variableGrossGrosze,
  };
}

export function calculatePlans(salesGrosze: number, registrations: number) {
  return PLANS.map((plan) => monthlyCost(plan, salesGrosze, registrations));
}

export function recommendPlan(results: ReturnType<typeof calculatePlans>) {
  return results.reduce((best, result) =>
    result.totalGrossGrosze < best.totalGrossGrosze ? result : best,
  );
}

export interface PricingFeature {
  id: string;
  icon: string;
  label: string;
  availableIn: readonly PlanId[];
  order: number;
}

const ALL_PLANS: readonly PlanId[] = ["flex", "balans", "przestrzen"];
const PAID_PLANS: readonly PlanId[] = ["balans", "przestrzen"];

export const FEATURES: readonly PricingFeature[] = [
  {
    id: "profile",
    icon: "profile",
    label: "Publiczny profil studia",
    availableIn: ALL_PLANS,
    order: 1,
  },
  { id: "ai", icon: "ai", label: "AI pomoc w tworzeniu oferty", availableIn: ALL_PLANS, order: 2 },
  {
    id: "events",
    icon: "events",
    label: "Publikacja wydarzeń, kursów i wyjazdów",
    availableIn: ALL_PLANS,
    order: 3,
  },
  { id: "schedule", icon: "schedule", label: "Grafik zajęć", availableIn: ALL_PLANS, order: 4 },
  { id: "registrations", icon: "registrations", label: "", availableIn: ALL_PLANS, order: 5 },
  {
    id: "email",
    icon: "email",
    label: "Zapytania e-mail od zainteresowanych",
    availableIn: ALL_PLANS,
    order: 6,
  },
  {
    id: "notifications",
    icon: "notifications",
    label: "Automatyczne powiadomienia",
    availableIn: ALL_PLANS,
    order: 7,
  },
  {
    id: "import",
    icon: "import",
    label: "Prosty import danych z innych platform",
    availableIn: ALL_PLANS,
    order: 8,
  },
  {
    id: "search",
    icon: "search",
    label: "Indeksacja profilu w wyszukiwarkach",
    availableIn: ALL_PLANS,
    order: 9,
  },
  {
    id: "short-url",
    icon: "short-url",
    label: "Krótki adres profilu",
    availableIn: PAID_PLANS,
    order: 10,
  },
  {
    id: "attendance",
    icon: "attendance",
    label: "Lista uczestników i obecność",
    availableIn: PAID_PLANS,
    order: 11,
  },
  {
    id: "statistics",
    icon: "statistics",
    label: "Statystyki zajęć i zapisów",
    availableIn: PAID_PLANS,
    order: 12,
  },
  {
    id: "studios",
    icon: "studios",
    label: "Zarządzanie kilkoma studiami",
    availableIn: PAID_PLANS,
    order: 13,
  },
  {
    id: "lotus",
    icon: "lotus",
    label: "Znak czarnego lotosu",
    availableIn: ["przestrzen"],
    order: 14,
  },
  {
    id: "waitlist",
    icon: "waitlist",
    label: "Nielimitowane zapisy online i lista rezerwowa",
    availableIn: ["przestrzen"],
    order: 15,
  },
  {
    id: "commission",
    icon: "commission",
    label: "0% prowizji od nowych klientów z joga.yoga",
    availableIn: ["przestrzen"],
    order: 16,
  },
];

export function includesFeature(plan: PricingPlan, feature: PricingFeature) {
  return feature.availableIn.includes(plan.id);
}

export function partitionFeatures(plan: PricingPlan) {
  const ordered = [...FEATURES].sort((left, right) => left.order - right.order);
  return {
    included: ordered.filter((feature) => includesFeature(plan, feature)),
    unavailable: ordered.filter((feature) => !includesFeature(plan, feature)),
  };
}
