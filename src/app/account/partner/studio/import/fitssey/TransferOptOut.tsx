"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { importError, importsApi } from "./api";

export function TransferOptOut({
  studioId,
  jobId,
  onClosed,
}: {
  studioId?: string;
  jobId?: string;
  onClosed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2 border-t pt-4">
      <p className="text-sm text-gray-500">
        Jeśli nie potrzebujesz importu, możesz trwale wyłączyć tę propozycję dla tego studia. Nadal
        możesz edytować studio i dodawać inne studia.
      </p>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await importsApi.optOut(studioId, jobId);
            onClosed();
          } catch (error) {
            setError(importError(error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Zapisywanie…" : "Nie potrzebuję przenoszenia"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
