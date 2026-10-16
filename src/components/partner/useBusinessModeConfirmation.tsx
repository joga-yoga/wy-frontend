"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { axiosInstance } from "@/lib/axiosInstance";

export type BusinessMode = "studio" | "solo";

const copy = {
  studio: {
    title: "Zarządzanie studiem",
    body: "Wybierasz zarządzanie studiem. Po zapisaniu to konto pozostanie w tym trybie. Aby prowadzić również własny grafik jako samodzielny instruktor, załóż osobne konto z innym adresem e-mail.",
  },
  solo: {
    title: "Własny grafik zajęć",
    body: "Wybierasz prowadzenie własnych zajęć. Po zapisaniu to konto pozostanie w tym trybie. Aby zarządzać również studiem, załóż osobne konto z innym adresem e-mail.",
  },
};

/** In-memory intent only. The original business operation commits the mode. */
export function useBusinessModeConfirmation(knownMode?: BusinessMode | null) {
  const [pending, setPending] = useState<{ mode: BusinessMode; label: string } | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const checkingRef = useRef(false);

  useEffect(
    () => () => {
      resolveRef.current?.(false);
    },
    [],
  );

  function finish(confirmed: boolean) {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setPending(null);
    resolve?.(confirmed);
  }

  async function confirmMode(mode: BusinessMode, label = "Potwierdź i zapisz"): Promise<boolean> {
    if (resolveRef.current || checkingRef.current) return false;
    checkingRef.current = true;
    try {
      // Public claim/inbox surfaces also reuse this hook outside the partner shell.
      const current =
        knownMode === undefined
          ? (
              await axiosInstance.get<{ business_mode: BusinessMode | null }>(
                "/partner/capabilities",
              )
            ).data.business_mode
          : knownMode;
      if (current) return true;
      return await new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setPending({ mode, label });
      });
    } finally {
      checkingRef.current = false;
    }
  }

  const dialog = (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) finish(false);
      }}
    >
      <DialogContent closeLabel="Zamknij">
        <DialogHeader>
          <DialogTitle>{pending ? copy[pending.mode].title : ""}</DialogTitle>
          <DialogDescription>{pending ? copy[pending.mode].body : ""}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => finish(false)}>
            Wróć
          </Button>
          <Button variant="green" onClick={() => finish(true)}>
            {pending?.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return { confirmMode, dialog };
}
