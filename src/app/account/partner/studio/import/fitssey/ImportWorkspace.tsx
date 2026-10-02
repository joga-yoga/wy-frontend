"use client";
import { ArrowLeft, Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PhoneVerificationDialog } from "@/components/partner/PhoneVerificationDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

import { importError, importsApi } from "./api";
import { ImportProgress } from "./ImportProgress";
import { ImportResults } from "./ImportResults";
import { ReviewRecords } from "./ReviewRecords";
import { issueLabels, kinds, type ReviewIssue } from "./types";
import { useImportJob } from "./useImportJob";

export function ImportWorkspace({ id }: { id: string }) {
  const { job, setJob, error: loadError, refresh } = useImportJob(id);
  const [phone, setPhone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [ack, setAck] = useState(false);
  async function start() {
    if (!job) return;
    setBusy(true);
    setError("");
    setIssues([]);
    try {
      setJob(await importsApi.start(id, job.revision));
      setConfirm(false);
    } catch (error) {
      const info = importError(error);
      setError(info.message);
      if (info.code === "phone_verification_required") setPhone(true);
      setIssues(info.issues);
      setConfirm(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  if (!job)
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p role="status">{loadError || "Wczytywanie importu…"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/account/partner/studio/import/fitssey">Zapisane importy</Link>
        </Button>
      </main>
    );
  const stages = ["Połączenie", "Analiza", "Wybór danych", "Import", "Sprawdź i opublikuj"];
  const active =
    job.state === "review" ? 2 : job.state === "importing" ? 3 : job.state === "completed" ? 4 : 1;
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-32">
      <Link
        className="inline-flex items-center gap-2 text-sm text-gray-600"
        href="/account/partner/studio/import/fitssey"
      >
        <ArrowLeft size={16} />
        Zapisane importy
      </Link>
      <header>
        <p className="text-sm font-medium text-brand-green-700">Fitssey · {job.source_uuid}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {job.state === "review"
            ? "Wybierz dane do przeniesienia"
            : job.state === "completed"
              ? "Studia są gotowe do sprawdzenia"
              : "Przenoszenie konfiguracji studia"}
        </h1>
        <p className="mt-2 text-gray-500">
          Grafik: {String(job.scope.start_date)} – {String(job.scope.end_date)} ·{" "}
          {String(job.scope.timezone || "Europe/Warsaw")}
        </p>
      </header>
      <ol aria-label="Etapy importu" className="grid grid-cols-5 gap-2">
        {stages.map((label, index) => (
          <li
            key={label}
            aria-current={index === active ? "step" : undefined}
            className="space-y-2"
          >
            <span
              className={`flex size-8 items-center justify-center rounded-full text-sm ${index <= active ? "bg-brand-green-700 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {index < active ? <Check size={16} /> : index + 1}
            </span>
            <span className="block text-xs sm:text-sm">{label}</span>
          </li>
        ))}
      </ol>
      <div aria-live="polite" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {kinds.map((kind) => (
          <div key={kind.key} className="rounded-xl border bg-white p-3">
            <p className="text-xl font-semibold">{job.counts[kind.key] ?? 0}</p>
            <p className="text-sm text-gray-500">{kind.label}</p>
          </div>
        ))}
      </div>
      {(loadError || error) && (
        <Alert variant="destructive">
          <AlertDescription>
            {error || loadError}
            {issues.length > 0 && (
              <ul className="mt-2 list-inside list-disc">
                {issues.map((issue, index) => (
                  <li key={index}>
                    {issue.name && `${issue.name}: `}
                    {issueLabels[issue.code] ?? "Sprawdź dane"}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
      {job.state === "analyzing" && (
        <Card>
          <CardContent className="flex gap-3 p-5">
            <LoaderCircle className="size-5 animate-spin shrink-0" />
            <div>
              <h2 className="font-semibold">Sprawdzamy konfigurację</h2>
              <p className="mt-1 text-sm text-gray-500">
                Liczby rosną w miarę odczytu danych. Możesz zamknąć tę stronę i wrócić z menu. Nie
                tworzymy jeszcze studiów.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Ostatnia aktualizacja: {new Date(job.updated_at).toLocaleTimeString("pl-PL")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {job.state === "review" && !(job.counts.location ?? 0) && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nie znaleziono lokalizacji w Fitssey</EmptyTitle>
            <EmptyDescription>
              Konto zostało sprawdzone. Dodaj lokalizacje w Fitssey i odśwież podgląd lub utwórz
              studio ręcznie.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="green">
              <Link href="/account/partner/studio/create">Utwórz studio ręcznie</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                void importsApi
                  .action(id, "refresh")
                  .then(setJob)
                  .catch((error) => setError(importError(error).message))
              }
            >
              Sprawdź ponownie
            </Button>
          </EmptyContent>
        </Empty>
      )}
      {job.state === "review" && (job.counts.location ?? 0) > 0 && (
        <>
          <Alert>
            <AlertDescription>
              Przenosimy konfigurację do nowych, prywatnych studiów. Pominięcie lokalizacji, zajęć
              lub prowadzącego wymaga też sprawdzenia powiązanych terminów.
            </AlertDescription>
          </Alert>
          <ReviewRecords job={job} onJob={setJob} refresh={refresh} />
          <footer className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <div>
              <p className="font-semibold">{job.selected_count} rekordów do importu</p>
              <p className="text-xs text-gray-500">
                Wybór jest zapisany. Publikacja będzie osobnym krokiem.
              </p>
            </div>
            <Button
              variant="green"
              disabled={busy || !job.branches.some((b) => b.selected)}
              onClick={() => {
                setConfirm(true);
                setAck(false);
              }}
            >
              Sprawdź podsumowanie
            </Button>
          </footer>
        </>
      )}
      <ImportProgress job={job} onJob={setJob} />
      {["completed", "cancelled"].includes(job.state) && (
        <ImportResults job={job} onJob={setJob} refresh={refresh} />
      )}
      <PhoneVerificationDialog
        open={phone}
        onOpenChange={setPhone}
        onVerified={() => void start()}
      />
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przenieść wybrane dane?</DialogTitle>
            <DialogDescription>
              Powstaną prywatne studia. Możesz edytować je przed publikacją.
            </DialogDescription>
          </DialogHeader>
          <p>
            {job.branches.filter((b) => b.selected).length} nowych studiów · {job.selected_count}{" "}
            rekordów
          </p>
          <p className="text-sm">
            Grafik: {String(job.scope.start_date)} – {String(job.scope.end_date)}. Bez klientów,
            rezerwacji i aktywnych karnetów.
          </p>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={ack} onCheckedChange={(value) => setAck(value === true)} />
            Sprawdzono wybór. Chcę utworzyć prywatne wersje studiów.
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Wróć do wyboru
            </Button>
            <Button variant="green" disabled={!ack || busy} onClick={start}>
              {busy ? "Uruchamianie…" : "Rozpocznij import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
