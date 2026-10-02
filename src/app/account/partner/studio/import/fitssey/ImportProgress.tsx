"use client";
import { CheckCircle2, Clock3, LoaderCircle, PauseCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

import { importError, importsApi } from "./api";
import type { ImportJob } from "./types";

export function ImportProgress({
  job,
  onJob,
}: {
  job: ImportJob;
  onJob: (job: ImportJob) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [key, setKey] = useState("");
  const [cancel, setCancel] = useState(false);
  async function action(operation: "cancel" | "retry" | "refresh") {
    setBusy(true);
    setError("");
    try {
      onJob(await importsApi.action(job.id, operation));
      setCancel(false);
    } catch (error) {
      setError(importError(error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reconnect(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onJob(await importsApi.reconnect(job.id, key));
      setKey("");
    } catch (error) {
      setError(importError(error).message);
    } finally {
      setBusy(false);
    }
  }
  const waiting = job.error_code === "api_allowance_wait";
  const terminal = ["cancelled", "expired"].includes(job.state);
  return (
    <section className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {waiting && (
        <Alert>
          <Clock3 />
          <AlertDescription>
            Fitssey ogranicza częstotliwość odczytu danych. Import wznowi się automatycznie
            {job.next_run_at
              ? ` po ${new Date(job.next_run_at).toLocaleString("pl-PL")}`
              : " po przerwie"}
            . Możesz bezpiecznie wrócić później.
          </AlertDescription>
        </Alert>
      )}
      {job.error_code === "temporary_retry" && (
        <Alert>
          <AlertDescription>
            Połączenie zostało przerwane. Ponowimy próbę automatycznie. Zapisane dane pozostają na
            miejscu.
          </AlertDescription>
        </Alert>
      )}
      {job.state === "importing" && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <LoaderCircle className="size-5 animate-spin" />
              <h2 className="font-semibold">
                {job.stage === "asset" ? "Przenosimy zdjęcia" : "Tworzymy prywatne studia"}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Przeniesiono {job.imported_count} z {job.selected_count} rekordów. Zdjęcia
              przetwarzamy osobno.
            </p>
            <Progress
              value={job.selected_count ? (job.imported_count / job.selected_count) * 100 : 0}
              aria-label="Postęp tworzenia rekordów"
            />
            <p className="text-sm text-gray-500">
              Możesz zamknąć stronę. Import będzie działał w tle.
            </p>
            <p className="text-xs text-gray-500">
              Ostatnia aktualizacja: {new Date(job.updated_at).toLocaleString("pl-PL")}
            </p>
          </CardContent>
        </Card>
      )}
      {job.state === "failed" && (
        <Alert variant="destructive">
          <AlertDescription>
            Import zatrzymał się. Zapisane rekordy i prywatne studia pozostają na miejscu. Ponów
            próbę; jeśli problem wraca, zachowaj ten link i skontaktuj się z obsługą.
          </AlertDescription>
        </Alert>
      )}
      {job.state === "reconnect_required" && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-semibold">Połącz ponownie Fitssey</h2>
            <p className="text-sm text-gray-500">
              Klucz wygasł lub został odrzucony. Podaj aktualny klucz dla tego samego konta —
              zachowamy Twój wybór.
            </p>
            <form onSubmit={reconnect} className="space-y-3">
              <Field>
                <FieldLabel htmlFor="reconnect-key">Nowy klucz API</FieldLabel>
                <Input
                  id="reconnect-key"
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  autoComplete="off"
                  required
                  minLength={10}
                />
              </Field>
              <Button variant="green" disabled={busy}>
                Połącz ponownie
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      {terminal && (
        <Alert>
          <PauseCircle />
          <AlertDescription>
            {job.state === "expired"
              ? "Import wygasł po okresie bezczynności. Klucz został usunięty. Rozpocznij nowy import, jeśli nadal chcesz przenieść dane."
              : "Import został zatrzymany. Utworzone studia pozostają prywatne i dostępne do edycji."}
          </AlertDescription>
        </Alert>
      )}
      {job.state === "completed" && (
        <Alert>
          <CheckCircle2 />
          <AlertDescription>
            Import zakończony. Sprawdź profile, grafik i zasady karnetów. Studia czekają na Twoją
            decyzję o publikacji.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        {job.state === "failed" && (
          <Button variant="green" disabled={busy} onClick={() => void action("retry")}>
            Ponów import
          </Button>
        )}
        {job.state === "review" && (
          <Button variant="outline" disabled={busy} onClick={() => void action("refresh")}>
            Odśwież dane z Fitssey
          </Button>
        )}
        {!["completed", "cancelled", "expired"].includes(job.state) && (
          <Button variant="outline" disabled={busy} onClick={() => setCancel(true)}>
            Zatrzymaj import
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link href="/account/partner/menu">Wróć do menu</Link>
        </Button>
      </div>
      <Dialog open={cancel} onOpenChange={setCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zatrzymać import?</DialogTitle>
            <DialogDescription>
              Klucz API zostanie usunięty. Dotychczas utworzone studia pozostaną prywatne i dostępne
              do edycji. Zatrzymanego importu nie można wznowić.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancel(false)}>
              Kontynuuj import
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => void action("cancel")}>
              Zatrzymaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
