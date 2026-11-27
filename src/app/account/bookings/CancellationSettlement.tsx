import Link from "next/link";

const OUTCOME_COPY = {
  unknown: "Brak potwierdzonych danych o rozliczeniu tej rezerwacji.",
  no_charge: "Nie pobrano opłaty za te zajęcia.",
  charge_voided: "Anulowano płatność. Opłata nie została pobrana.",
  payment_unresolved:
    "Rozpoczęta płatność czeka na potwierdzenie. Nie opłacaj tej rezerwacji ponownie.",
  pass_purchase_voided: "Anulowano zakup karnetu. Opłata nie została pobrana.",
  pass_entry_restored: "Przywrócono 1 wejście na karnet.",
  unlimited_pass_unchanged: "Karnet bez limitu wejść zachowuje dotychczasowe warunki.",
  refund_processing: "Zwrot jest w trakcie realizacji.",
  refund_settled: "Potwierdzono zwrot płatności.",
  refund_review: "Rozliczenie oczekuje na sprawdzenie przez organizatora.",
  refund_status_unknown: "Organizator sprawdza status zwrotu.",
  late_payment_review:
    "Płatność wpłynęła po odwołaniu zajęć. Sprawa oczekuje na działanie organizatora.",
  onsite_reimbursement_due: "Organizator ma do zwrotu opłatę pobraną na miejscu.",
};

export interface CancellationFinance {
  state: keyof typeof OUTCOME_COPY;
  currency: string | null;
  paid_amount: number;
  settled_amount: number;
  reserved_amount: number;
  pass_valid_until: string | null;
  pass_expired: boolean;
  organizer_contact_path: string | null;
}

export function CancellationSettlement({
  finance,
  organizer,
}: {
  finance?: CancellationFinance | null;
  organizer?: string | null;
}) {
  const state = finance?.state ?? "unknown";
  const money = (amount: number) =>
    `${amount.toFixed(2).replace(".", ",")}${finance?.currency ? ` ${finance.currency}` : ""}`;
  const validity = finance?.pass_valid_until
    ? new Date(finance.pass_valid_until).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Warsaw",
      })
    : null;

  return (
    <section className="space-y-2 border-t border-gray-100 px-4 py-5">
      <h3 className="text-[18px] font-semibold text-[#222222]">Rozliczenie po odwołaniu</h3>
      <p className="text-sm text-gray-700">{OUTCOME_COPY[state] ?? OUTCOME_COPY.unknown}</p>
      {finance && (
        <div className="space-y-1 text-sm text-gray-700">
          {finance.settled_amount > 0 && <p>Zwrócona kwota: {money(finance.settled_amount)}</p>}
          {state === "refund_processing" && finance.reserved_amount > 0 && (
            <p>Kwota zwrotu w realizacji: {money(finance.reserved_amount)}</p>
          )}
          {state === "refund_status_unknown" && finance.reserved_amount > 0 && (
            <p>Sprawdzana kwota: {money(finance.reserved_amount)}</p>
          )}
          {state === "late_payment_review" && <p>Otrzymana kwota: {money(finance.paid_amount)}</p>}
          {state === "onsite_reimbursement_due" && (
            <p>Do zwrotu: {money(finance.paid_amount - finance.settled_amount)}</p>
          )}
          {validity && <p>Pierwotna ważność karnetu: do {validity}</p>}
          {finance.pass_expired && state === "pass_entry_restored" && (
            <p>
              Ważność karnetu już upłynęła.{" "}
              {finance.organizer_contact_path ? (
                <Link className="font-medium underline" href={finance.organizer_contact_path}>
                  Kontakt z organizatorem{organizer ? ` · ${organizer}` : ""}
                </Link>
              ) : (
                `Skontaktuj się z organizatorem${organizer ? ` · ${organizer}` : ""}.`
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
