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

/** Menu navigation only. The original business operation still commits the mode. */
export function useBusinessModeConfirmation() {
  const [pending, setPending] = useState<BusinessMode | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

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

  function confirmMode(mode: BusinessMode, trigger: HTMLElement): Promise<boolean> {
    if (resolveRef.current) return Promise.resolve(false);
    returnFocusRef.current = trigger;
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setPending(mode);
    });
  }

  const dialog = (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) finish(false);
      }}
    >
      <DialogContent closeLabel="Zamknij" className="sm:max-w-sm" finalFocus={returnFocusRef}>
        <DialogHeader>
          <DialogTitle className="pr-6">{pending ? copy[pending].title : ""}</DialogTitle>
          <DialogDescription>{pending ? copy[pending].body : ""}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => finish(false)}>
            Wróć
          </Button>
          <Button type="button" variant="green" onClick={() => finish(true)}>
            Potwierdź i kontynuuj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return { confirmMode, dialog };
}
