"use client";
import Link from "next/link";
import { useState } from "react";

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
import { axiosInstance } from "@/lib/axiosInstance";

import { importError, importsApi } from "./api";
import { ReviewRecords } from "./ReviewRecords";
import type { ImportJob, ImportRecord } from "./types";

interface StudioPreview {
  name: string;
  description: string | null;
  address: string | null;
  currency: string | null;
  rooms: { id: string; name: string }[];
  passes: {
    id: string;
    name: string;
    price: number;
    currency: string | null;
  }[];
  migration_pending: boolean;
}
export function ImportResults({
  job,
  onJob,
  refresh,
}: {
  job: ImportJob;
  onJob: (job: ImportJob) => void;
  refresh: () => Promise<ImportJob | null>;
}) {
  const [branch, setBranch] = useState<ImportRecord | null>(null);
  const [preview, setPreview] = useState<StudioPreview | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [bookings, setBookings] = useState(false);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showRecords, setShowRecords] = useState(false);
  async function open(record: ImportRecord) {
    setBusy(true);
    setError("");
    setReviewed(false);
    setBookings(false);
    setAck(false);
    try {
      const { data } = await axiosInstance.get<StudioPreview>(
        `/studios/${record.targets.studio_id}`,
      );
      setPreview(data);
      setBranch(record);
    } catch (error) {
      setError(importError(error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (!branch) return;
    setBusy(true);
    setError("");
    try {
      onJob(await importsApi.publish(job.id, branch.id, bookings));
      setBranch(null);
    } catch (error) {
      setError(importError(error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Sprawdź studia</h2>
      <p className="text-sm text-gray-600">
        Grafik obejmuje wyłącznie {String(job.scope.start_date)} – {String(job.scope.end_date)}.
        Rezerwacje i aktywne karnety z Fitssey nie zostały przeniesione.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {job.asset_failed_count > 0 && (
        <Alert>
          <AlertDescription>
            {job.asset_failed_count} zdjęć nie zostało przeniesionych. Możesz dodać je w edytorze
            lub ponowić próbę.
            {job.state === "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void importsApi
                    .action(job.id, "retry-assets")
                    .then(onJob)
                    .catch((error) => setError(importError(error).message))
                    .finally(() => setBusy(false));
                }}
              >
                Ponów przenoszenie zdjęć
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {job.branches
          .filter((record) => record.targets.studio_id)
          .map((record) => (
            <Card key={record.id}>
              <CardContent className="space-y-3 p-5">
                <h3 className="font-semibold">{String(record.overrides.name ?? record.name)}</h3>
                {record.targets.summary &&
                  typeof record.targets.summary === "object" &&
                  !Array.isArray(record.targets.summary) && (
                    <p className="text-sm text-gray-600">
                      Przeniesiono: {String(record.targets.summary.imported)} · Pominięto:{" "}
                      {String(record.targets.summary.excluded)} · Pozostało:{" "}
                      {String(record.targets.summary.pending)} · Brakujące zdjęcia:{" "}
                      {String(record.targets.summary.image_failed)}
                    </p>
                  )}
                <p className="text-sm text-gray-500">
                  {record.targets.published ? "Opublikowano" : "Prywatny szkic"} ·{" "}
                  {record.targets.booking_enabled ? "Rezerwacje włączone" : "Rezerwacje wyłączone"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/account/partner/studio/${record.targets.studio_id}/edit`}>
                      Edytuj profil i karnety
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/account/partner/schedule">Sprawdź grafik</Link>
                  </Button>
                  <Button
                    variant="green"
                    size="sm"
                    disabled={busy}
                    onClick={() => void open(record)}
                  >
                    {record.targets.published ? "Sprawdź ustawienia" : "Sprawdź i opublikuj"}
                  </Button>
                  {record.targets.published && (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/studio/${record.targets.slug}`}>Strona publiczna</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
      <Button variant="outline" onClick={() => setShowRecords((value) => !value)}>
        {showRecords ? "Zwiń dane" : "Zobacz przeniesione i pominięte dane"}
      </Button>
      {showRecords && <ReviewRecords job={job} onJob={onJob} refresh={refresh} readOnly />}
      <Dialog
        open={Boolean(branch)}
        onOpenChange={(open) => {
          if (!open && !busy) setBranch(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Sprawdź studio przed publikacją</DialogTitle>
            <DialogDescription>
              Podgląd zapisanej wersji. Zmiany w profilu i grafiku zapisz w edytorze przed
              publikacją.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <>
              <div className="rounded-xl border p-4 space-y-2">
                <h3 className="text-lg font-semibold">{preview.name}</h3>
                <p className="text-sm">
                  {preview.address || "Uzupełnij adres w edytorze"} ·{" "}
                  {preview.currency || "Uzupełnij walutę"}
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-600">
                  {preview.description || "Brak opisu — możesz uzupełnić go w edytorze."}
                </p>
                <p className="text-sm">
                  Sale: {preview.rooms.map((room) => room.name).join(", ") || "brak"}
                </p>
                <h4 className="pt-2 text-sm font-semibold">Katalog karnetów</h4>
                {preview.passes.length ? (
                  preview.passes.map((product) => (
                    <p key={product.id} className="text-sm">
                      {product.name} · {product.price} {product.currency || preview.currency}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Brak karnetów</p>
                )}
              </div>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={reviewed}
                  onCheckedChange={(value) => setReviewed(value === true)}
                />
                Sprawdzono profil, zespół, karnety oraz grafik. Chcę opublikować stronę tego studia.
              </label>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={bookings}
                  onCheckedChange={(value) => setBookings(value === true)}
                />
                Włącz rezerwacje w WY dla zaimportowanych terminów.
              </label>
              {bookings && (
                <label className="flex items-start gap-3 rounded-lg border bg-amber-50 p-3 text-sm">
                  <Checkbox checked={ack} onCheckedChange={(value) => setAck(value === true)} />
                  Potwierdzam limity miejsc i dostępność. Rezerwacje z Fitssey nie zostały
                  przeniesione, więc obłożenie w WY zaczyna się od zera.
                </label>
              )}
              <p className="text-sm text-gray-500">
                Publikacja nie wysyła zaproszeń do zespołu. Karnety pojawią się na opublikowanym
                profilu studia.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBranch(null)} disabled={busy}>
                  Wróć do sprawdzania
                </Button>
                <Button
                  variant="green"
                  disabled={
                    busy || !reviewed || (bookings && !ack) || !preview.address || !preview.currency
                  }
                  onClick={publish}
                >
                  {busy ? "Zapisywanie…" : "Opublikuj studio"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
