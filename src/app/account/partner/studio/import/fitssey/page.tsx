"use client";

import { ArrowLeft, ArrowRight, Download, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { importError, importsApi } from "./api";
import type { ImportJob } from "./types";

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export default function FitsseyConnectPage() {
  const router = useRouter();
  const [uuid, setUuid] = useState("");
  const [key, setKey] = useState("");
  const [start, setStart] = useState(() => localDate(new Date()));
  const [end, setEnd] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 89);
    return localDate(date);
  });
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([importsApi.config(), importsApi.list()])
      .then(([config, list]) => {
        if (active) {
          setEnabled(config.enabled);
          setJobs(list);
        }
      })
      .catch(() => {
        if (active) setError("Nie udało się wczytać importów. Odśwież stronę.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function connect(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const job = await importsApi.create({
        source_uuid: uuid.trim(),
        api_key: key.trim(),
        start_date: start,
        end_date: end,
        timezone: "Europe/Warsaw",
      });
      setKey("");
      router.push(`/account/partner/studio/import/fitssey/${job.id}`);
    } catch (error) {
      setError(importError(error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-28">
      <Link
        className="inline-flex items-center gap-2 text-sm text-gray-600"
        href="/account/partner/studio/create"
      >
        <ArrowLeft size={16} />
        Tworzenie studia
      </Link>
      <header className="space-y-2">
        <p className="text-sm font-medium text-brand-green-700">Przenieś konfigurację studia</p>
        <h1 className="text-2xl font-semibold">Zacznij od Fitssey</h1>
        <p className="text-gray-600">
          Najpierw zobaczysz dane i wybierzesz, co przenieść. Każda lokalizacja stanie się nowym,
          prywatnym studiem.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Lokalizacje i zespół", "Zajęcia i grafik", "Katalog karnetów"].map((label) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm"
          >
            <Download size={16} />
            {label}
          </div>
        ))}
      </div>
      <Alert>
        <ShieldCheck />
        <AlertDescription>
          Klienci, kontakty, rezerwacje i salda pozostają w Fitssey. Import działa w tle. Publikacja
          i uruchomienie rezerwacji wymagają osobnego potwierdzenia.
        </AlertDescription>
      </Alert>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Połącz konto Fitssey</CardTitle>
        </CardHeader>
        <CardContent>
          {enabled === false ? (
            <p className="text-gray-600">
              Nowe importy są chwilowo niedostępne. Możesz wrócić do zapisanych importów lub
              utworzyć studio ręcznie.
            </p>
          ) : (
            <form onSubmit={connect} className="space-y-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="fitssey-uuid">UUID konta Fitssey</FieldLabel>
                  <Input
                    id="fitssey-uuid"
                    value={uuid}
                    onChange={(e) => setUuid(e.target.value)}
                    required
                    pattern="[a-zA-Z0-9-]{1,80}"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Identyfikator widoczny w adresie konta lub ustawieniach API Fitssey.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="fitssey-key">Klucz API</FieldLabel>
                  <Input
                    id="fitssey-key"
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    required
                    minLength={10}
                    maxLength={300}
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Klucz jest szyfrowany na serwerze i usuwany po zaakceptowaniu importu. Nie
                    zapisujemy go w przeglądarce.
                  </FieldDescription>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="range-start">Grafik od</FieldLabel>
                    <Input
                      id="range-start"
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="range-end">Grafik do</FieldLabel>
                    <Input
                      id="range-end"
                      type="date"
                      value={end}
                      min={start}
                      onChange={(e) => setEnd(e.target.value)}
                      required
                    />
                  </Field>
                </div>
                <FieldDescription>
                  Domyślnie 90 dni, strefa Europe/Warsaw. Przenosimy konkretne terminy, bez
                  tworzenia powtarzalnych reguł.
                </FieldDescription>
              </FieldGroup>
              <Button
                type="submit"
                variant="green"
                size="action"
                disabled={busy || enabled === null}
              >
                {busy ? "Łączenie…" : "Połącz i sprawdź dane"}
                <ArrowRight size={16} />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      {jobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Zapisane importy</h2>
          {jobs.map((job) => (
            <Link
              key={job.id}
              className="flex justify-between gap-3 rounded-xl border bg-white p-4"
              href={`/account/partner/studio/import/fitssey/${job.id}`}
            >
              <span>
                Fitssey · {job.source_uuid}
                <span className="block text-sm text-gray-500">
                  {new Date(job.created_at).toLocaleDateString("pl-PL")}
                </span>
              </span>
              <span className="text-sm">
                {job.state === "completed"
                  ? "Sprawdź studia"
                  : job.state === "review"
                    ? "Wybierz dane"
                    : ["cancelled", "expired"].includes(job.state)
                      ? "Zobacz wynik"
                      : "Kontynuuj"}{" "}
                →
              </span>
            </Link>
          ))}
        </section>
      )}
      <Button asChild variant="outline">
        <Link href="/account/partner/studio/create">Utwórz studio ręcznie</Link>
      </Button>
    </main>
  );
}
