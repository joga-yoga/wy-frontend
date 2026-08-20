"use client";

import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

import type {
  ProviderManifest,
  SaveCredentialsResponse,
  StudioPaymentConfig,
  StudioProviderState,
} from "./types";

/**
 * §10's configuration flow, reshaped around the fact that a studio can have **several**
 * providers configured at once.
 *
 * The backend has always kept superseded configurations rather than deleting them, so that
 * switching back needs no re-entry (`previous[]`, with `fields_set` per field). The first
 * version of this screen ignored that entirely: it showed one provider, and "Zmień operatora"
 * led to a blank credential form even for a provider whose credentials were already stored.
 * The data was there and the screen threw it away.
 *
 * So the shape is now a radio list of everything configured — selected means active — with
 * switching handled by `/activate`, which re-verifies the stored credentials and never asks
 * for them again. Providers that have *never* been configured are not in that list; they are
 * behind "Dodaj operatora", because "switch to" and "set up" are different actions and a
 * single list that silently does both is what produced the blank form.
 *
 * ⚠ **This file names no provider, and that is the acceptance criterion for the whole
 * abstraction** (§11.1). Every label, hint, field, documentation link and capability comes
 * from the manifest endpoint. If a fifth provider ever required an edit here, the design would
 * be wrong — so there is no per-provider field list, no per-provider validation, and no
 * `if (provider === ...)` anywhere below.
 *
 * ⚠ **Credentials are write-only** (§2). Secret inputs are never prefilled, not even for the
 * studio that typed them: the API returns per-field booleans saying whether *something* is
 * set, and replacing a value means entering it in full again. A "•••• 1234" affordance would
 * be friendlier and would also hand an attacker four characters.
 *
 * Copy note: **"operator płatności"**, never "bramka płatnicza" (§10, frozen glossary).
 */

type View = "loading" | "empty" | "configured" | "adding" | "form";

export function OnlinePaymentsSection({ studioId }: { studioId: string }) {
  const [config, setConfig] = useState<StudioPaymentConfig | null>(null);
  const [view, setView] = useState<View>("loading");
  const [selected, setSelected] = useState<ProviderManifest | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [result, setResult] = useState<SaveCredentialsResponse | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  /** Provider whose credentials were just saved, so its callback notice opens rather than
   *  sitting collapsed. Cleared on any other navigation — it describes a moment, not a state. */
  const [justSavedKey, setJustSavedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<StudioPaymentConfig>(
        `/studios/${studioId}/payment-providers`,
      );
      setConfig(data);
      const hasAny = Boolean(data.current) || data.previous.length > 0;
      setView(hasAny ? "configured" : "empty");
      setLoadError(null);
    } catch {
      setLoadError("Nie udało się wczytać ustawień płatności online.");
      setView("empty");
    }
  }, [studioId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Everything with stored credentials — the active one first, then the rest. */
  const configured: StudioProviderState[] = useMemo(() => {
    if (!config) return [];
    return [...(config.current ? [config.current] : []), ...config.previous];
  }, [config]);

  /** Providers that have never been configured here. These belong behind "Dodaj", not in the
   *  radio list — selecting one cannot activate anything, it can only open a blank form. */
  const unconfigured: ProviderManifest[] = useMemo(() => {
    if (!config) return [];
    const known = new Set(configured.map((c) => c.provider_key));
    return config.providers.filter((p) => !known.has(p.provider_key));
  }, [config, configured]);

  const manifestFor = useCallback(
    (providerKey: string) => config?.providers.find((p) => p.provider_key === providerKey) ?? null,
    [config],
  );

  const isOnline = config?.current?.state === "active";

  /** Which of the open form's fields already have a stored value. Empty for a provider being
   *  configured for the first time, which is what makes "Zapisane" mean something. */
  const editingFieldsSet: Record<string, boolean> =
    configured.find((c) => c.provider_key === selected?.provider_key)?.fields_set ?? {};
  const isEditingStored = Object.values(editingFieldsSet).some(Boolean);

  function openForm(provider: ProviderManifest) {
    setJustSavedKey(null);
    setSelected(provider);
    // Never prefilled — not even the non-secret fields, so the form has one rule rather than
    // two and nobody has to remember which half is safe to echo back.
    setValues(Object.fromEntries(provider.fields.map((f) => [f.key, ""])));
    setResult(null);
    setView("form");
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setResult(null);
    try {
      const { data } = await axiosInstance.post<SaveCredentialsResponse>(
        `/studios/${studioId}/payment-providers`,
        { provider_key: selected.provider_key, credentials: values },
      );
      setResult(data);
      if (data.verified) {
        // The notice for this provider opens on arrival. Saving is the one moment the studio
        // is already in the provider's panel with it in front of them, so a step they have to
        // do *there* should not be behind a disclosure triangle just then.
        setJustSavedKey(selected.provider_key);
        await load();
        setView("configured");
      }
    } catch {
      setResult({
        verified: false,
        state: "pending",
        error: "Nie udało się zapisać danych. Spróbuj ponownie.",
      });
    } finally {
      setSaving(false);
    }
  }

  /** Switch to a provider whose credentials are already stored. No form, by design. */
  async function activate(providerKey: string) {
    setBusyKey(providerKey);
    setSwitchError(null);
    try {
      const { data } = await axiosInstance.post<SaveCredentialsResponse>(
        `/studios/${studioId}/payment-providers/activate`,
        { provider_key: providerKey },
      );
      if (!data.verified) {
        // Stored credentials are not proof they still work — a key can be rotated in the
        // provider's panel while our row sits disabled. Say which provider failed and why,
        // and leave "Zmień dane" as the way out.
        setSwitchError(data.error ?? "Nie udało się zweryfikować zapisanych danych.");
      }
      await load();
    } catch {
      setSwitchError("Nie udało się przełączyć operatora. Spróbuj ponownie.");
    } finally {
      setBusyKey(null);
    }
  }

  async function disable() {
    setBusyKey("__off__");
    setSwitchError(null);
    try {
      await axiosInstance.post(`/studios/${studioId}/payment-providers/disable`);
      await load();
    } finally {
      setBusyKey(null);
    }
  }

  if (view === "loading") {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Płatności online
      </h2>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {view === "empty" && (
        <div className="space-y-4 rounded-b2b border bg-white p-4">
          {/* §10 calls the zero-commission statement a genuine differentiator that belongs
              here, stated plainly rather than buried in a help page. */}
          <p className="text-sm leading-relaxed text-gray-700">
            Możesz przyjmować płatności online przez <strong>własne konto</strong> u operatora
            płatności. Pieniądze trafiają <strong>bezpośrednio do Ciebie</strong>, a joga.yoga nie
            pobiera żadnej prowizji.
          </p>
          <p className="text-[13px] leading-snug text-gray-500">
            Płatność gotówką działa niezależnie — włączenie płatności online niczego w niej nie
            zmienia.
          </p>
          <Button variant="green" className="w-full" onClick={() => setView("adding")}>
            Podłącz operatora płatności
          </Button>
        </div>
      )}

      {view === "configured" && config && configured.length > 0 && (
        <div className="space-y-3">
          {/* The master switch, drawn like the cash row above it — same control, same place in
              the mental model. Unlike cash it is *not* locked: this one really is a choice. */}
          <div className="overflow-hidden rounded-b2b border bg-white">
            <div className={cn("flex items-center gap-3 px-4 py-3.5", !isOnline && "opacity-60")}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <Wallet size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Płatności online</p>
                <p className="text-xs text-gray-500">
                  {isOnline
                    ? `Przez ${config.current?.display_name}`
                    : "Wyłączone — klientki i klienci zapłacą tylko gotówką"}
                </p>
              </div>
              <Switch
                checked={isOnline}
                disabled={busyKey !== null}
                aria-label="Płatności online"
                className={cn(isOnline && "data-[state=checked]:bg-b2b-green-text")}
                onCheckedChange={(next) => {
                  if (!next) {
                    void disable();
                    return;
                  }
                  // Turning it back on means re-activating something already configured —
                  // whichever was last used, which is the first row in the list.
                  const target = config.current?.provider_key ?? configured[0]?.provider_key;
                  if (target) void activate(target);
                }}
              />
            </div>
          </div>

          {/* One row per configured provider. Selected = active, which is why this is a radio
              group and not a list of links: the control states the invariant that exactly one
              provider takes payments at a time. */}
          <div
            role="radiogroup"
            aria-label="Operator płatności"
            className={cn(
              "divide-y overflow-hidden rounded-b2b border bg-white transition-opacity",
              !isOnline && "opacity-60",
            )}
          >
            {configured.map((provider) => {
              const manifest = manifestFor(provider.provider_key);
              const active = isOnline && provider.provider_key === config.current?.provider_key;
              const busy = busyKey === provider.provider_key;
              return (
                // Two controls share this row, so the row itself is a plain element. A radio
                // wrapping an edit button would be a button inside a button: invalid, and it
                // leaves the inner one unreachable by keyboard.
                <div key={provider.provider_key} className="flex items-center">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={busyKey !== null}
                    onClick={() => {
                      if (active) return;
                      void activate(provider.provider_key);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 text-left transition-colors hover:bg-gray-50 disabled:cursor-default"
                  >
                    {/* Placeholder for the provider's logo. Neutral on purpose: a wrong or
                        half-right mark reads as a bug, while an obvious placeholder reads as
                        "not yet". Dropping in a real logo is a change to this span alone. */}
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <ImageIcon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {provider.display_name}
                        </p>
                        <StatusBadge state={active ? "active" : provider.state} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {manifest
                          ? manifest.capabilities.supported_methods
                              .map((m) => METHOD_LABELS[m] ?? m)
                              .join(" · ")
                          : " "}
                      </p>
                    </div>
                  </button>

                  {/* Per card, so it edits *this* provider. A single button outside the list
                      could only mean "the selected one" — the wrong provider exactly when it
                      matters, since the one you need to fix is the one that failed. */}
                  <button
                    type="button"
                    disabled={busyKey !== null}
                    aria-label={`Zmień dane — ${provider.display_name}`}
                    onClick={() => {
                      if (manifest) openForm(manifest);
                    }}
                    className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
                  >
                    <Pencil size={15} />
                  </button>

                  <span className="flex w-12 shrink-0 items-center justify-center">
                    {busy ? (
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                    ) : (
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                          active ? "border-brand-green-700" : "border-gray-300",
                        )}
                      >
                        {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-green-700" />}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Providers whose callback URL the studio has to paste in by hand. Driven entirely
              by `callback_url` being present, so this names no provider and a fifth one
              needing the same thing costs nothing here. */}
          {configured
            .filter((provider) => provider.callback_url)
            .map((provider) => (
              <CallbackUrlNotice
                key={provider.provider_key}
                providerName={provider.display_name}
                callbackUrl={provider.callback_url as string}
                instructions={manifestFor(provider.provider_key)?.callback_instructions}
                defaultOpen={provider.provider_key === justSavedKey}
              />
            ))}

          {switchError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-500" />
              <div className="text-[13px] leading-snug text-rose-900">
                <p className="font-semibold">Nie udało się włączyć tego operatora.</p>
                <p className="mt-0.5">{switchError}</p>
              </div>
            </div>
          )}

          {config.current?.last_verification_error && !switchError && (
            <p className="px-1 text-[13px] leading-snug text-rose-700">
              {config.current.last_verification_error}
            </p>
          )}

          {/* "Zmień dane" used to live here and always edited whichever provider was
              selected. Each card owns its own edit control now, so what is left out here is
              only the action that genuinely has no card yet. */}
          <div className="flex flex-wrap gap-2">
            {unconfigured.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={busyKey !== null}
                onClick={() => setView("adding")}
              >
                <Plus size={14} className="mr-1" />
                Dodaj operatora
              </Button>
            )}
          </div>

          <p className="px-1 text-xs leading-snug text-gray-500">
            Płatność gotówką działa niezależnie i pozostaje włączona. Dane wyłączonych operatorów
            zachowujemy — powrót do nich nie wymaga wpisywania ich ponownie.
          </p>
        </div>
      )}

      {view === "adding" && config && (
        <div className="space-y-2">
          <div className="divide-y overflow-hidden rounded-b2b border bg-white">
            {unconfigured.map((provider) => (
              <button
                key={provider.provider_key}
                type="button"
                onClick={() => openForm(provider)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{provider.display_name}</p>
                  <p className="text-xs text-gray-500">
                    {provider.capabilities.supported_methods
                      .map((m) => METHOD_LABELS[m] ?? m)
                      .join(" · ")}
                  </p>
                </div>
                <Plus size={16} className="shrink-0 text-gray-300" />
              </button>
            ))}
            {unconfigured.length === 0 && (
              <p className="px-4 py-3.5 text-sm text-gray-500">
                Wszyscy dostępni operatorzy są już skonfigurowani.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setView(configured.length > 0 ? "configured" : "empty")}
            className="px-1 text-sm text-gray-500 underline"
          >
            Anuluj
          </button>
        </div>
      )}

      {view === "form" && selected && (
        <div className="space-y-4 rounded-b2b border bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{selected.display_name}</p>
            {selected.documentation_url && (
              // §10: this is the exact step studios get stuck on, so the link is part of the
              // provider's manifest rather than something this screen knows per provider.
              <a
                href={selected.documentation_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 underline"
              >
                Gdzie znaleźć te dane
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          {isEditingStored && (
            <p className="rounded-xl bg-gray-50 px-3.5 py-3 text-[13px] leading-snug text-gray-600">
              Twoje dane są zapisane — nie pokazujemy ich ponownie ze względów bezpieczeństwa.
              <strong> Wypełnij tylko to, co chcesz zmienić</strong>; puste pola zostawiamy bez
              zmian.
            </p>
          )}

          {selected.fields.map((field) => {
            // ⚠ Autofill is actively harmful here and `autoComplete="off"` alone does not stop
            // it. A form containing a password input reads to browsers and password managers
            // as a *login* form, so they offer a saved email for the field above it and a
            // saved password for the field itself — which is how a shop identifier ended up
            // holding an email address. Three things together prevent that: `new-password`
            // (the one value Chrome honours for "do not offer a saved credential"), ids and
            // names that are namespaced so nothing matches a remembered field, and the opt-out
            // attributes the major managers look for.
            const inputId = `pp-${selected.provider_key}-${field.key}`;
            const stored = editingFieldsSet[field.key] === true;
            return (
              <div key={field.key}>
                <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <label className="text-sm font-semibold" htmlFor={inputId}>
                    {field.label}
                  </label>
                  {/* The whole point of this badge. The value cannot be shown — credentials
                      are write-only — so an empty box is all the studio sees, and an empty
                      box reads as "your data is gone, type it all again". `fields_set` is a
                      per-field "is something stored?" boolean the API has always returned and
                      this screen never used. */}
                  {stored && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                      <Check size={10} />
                      Zapisane
                    </span>
                  )}
                </div>
                {field.hint && <p className="mb-2 text-xs text-muted-foreground">{field.hint}</p>}
                <Input
                  id={inputId}
                  name={inputId}
                  type={field.is_secret ? "password" : "text"}
                  value={values[field.key] ?? ""}
                  placeholder={stored ? "Bez zmian" : undefined}
                  autoComplete={field.is_secret ? "new-password" : "off"}
                  data-1p-ignore
                  data-lpignore="true"
                  data-bwignore
                  data-form-type="other"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
              </div>
            );
          })}

          {result && !result.verified && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-500" />
              <div className="text-[13px] leading-snug text-rose-900">
                <p className="font-semibold">Nie udało się zweryfikować danych.</p>
                {result.error && <p className="mt-0.5">{result.error}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="green"
              className="flex-1"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Sprawdzam..." : isEditingStored ? "Zapisz zmiany" : "Zapisz i połącz"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setView(configured.length > 0 ? "configured" : "empty")}
              disabled={saving}
            >
              Anuluj
            </Button>
          </div>
          <p className="text-xs leading-snug text-gray-500">
            Sprawdzamy dane u operatora przed włączeniem płatności. Dopóki się nie powiedzie,
            klientki i klienci nie zobaczą płatności online.
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * The one step we cannot do for the studio.
 *
 * Most providers either take the callback URL with each payment or register it themselves when
 * credentials are saved. paynow does neither: it has no per-payment notification field and no
 * API to register one, so the destination is panel configuration a human has to enter.
 *
 * The failure it prevents is silent, which is why it is stated this plainly. A studio that
 * skips it sees payments succeed at the gateway and never settle here — no error, nothing in a
 * log, just bookings that stay unpaid. Nothing on our side can detect whether it was done, so
 * the notice stays put rather than disappearing after the first save.
 *
 * ⚠ Rendered from `callback_url` and `callback_instructions` alone. No provider name appears in
 * this file (§11.1), and that is the acceptance criterion for the whole provider abstraction.
 */
function CallbackUrlNotice({
  providerName,
  callbackUrl,
  instructions,
  defaultOpen,
}: {
  providerName: string;
  callbackUrl: string;
  instructions?: string | null;
  defaultOpen: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused, and an error here would be noise: the URL is on
      // screen and selectable, so the studio can still copy it the ordinary way.
    }
  }

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-b2b border border-amber-200 bg-amber-50/60"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
        <AlertTriangle size={15} className="shrink-0 text-amber-500" />
        <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-amber-900">
          Dokończ konfigurację — {providerName}
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-amber-700 group-open:hidden">
          Pokaż
        </span>
      </summary>

      <div className="space-y-3 px-3.5 pb-3.5">
        <p className="text-[13px] leading-snug text-amber-900">
          Wklej poniższy adres w panelu operatora. Bez tego płatności zostaną pobrane, ale
          rezerwacje pozostaną nieopłacone — i nie zobaczysz żadnego błędu.
        </p>

        {instructions && <p className="text-[13px] leading-snug text-amber-800">{instructions}</p>}

        <div className="flex items-stretch gap-2">
          {/* Read-only rather than plain text: it keeps select-all working on a long URL that
              has to be copied exactly, and makes it obvious this is a value, not prose. */}
          <input
            readOnly
            value={callbackUrl}
            aria-label="Adres powiadomień"
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-gray-700"
          />
          <button
            type="button"
            onClick={() => void copy()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          >
            {copied ? <ClipboardCheck size={13} /> : <Copy size={13} />}
            {copied ? "Skopiowano" : "Kopiuj"}
          </button>
        </div>
      </div>
    </details>
  );
}

function StatusBadge({ state }: { state: string }) {
  const copy: Record<string, { label: string; className: string }> = {
    active: { label: "Aktywny", className: "bg-brand-green-700/10 text-brand-green-700" },
    // Credentials are stored but did not verify — the studio has to fix them before this
    // provider can take anything, so it must not read as merely "off".
    pending: { label: "Wymaga poprawy", className: "bg-rose-50 text-rose-700" },
    disabled: { label: "Zapisany", className: "bg-gray-100 text-gray-500" },
  };
  const badge = copy[state] ?? copy.disabled;
  return (
    <span
      className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", badge.className)}
    >
      {badge.label}
    </span>
  );
}

/**
 * Method labels for the provider list. Keyed by the normalized method vocabulary the backend
 * declares — not by provider, so a new provider offering the same methods needs nothing here.
 */
const METHOD_LABELS: Record<string, string> = {
  blik: "BLIK",
  card: "Karta",
  wallet: "Google Pay / Apple Pay",
  transfer: "Przelew online",
};
