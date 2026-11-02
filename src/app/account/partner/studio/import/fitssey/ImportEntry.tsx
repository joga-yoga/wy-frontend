"use client";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

import { MenuRow } from "@/components/menu/MenuRow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { importsApi } from "./api";

export function ImportEntry() {
  const [visible, setVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    let active = true;
    importsApi
      .menuPreference()
      .then((config) => {
        if (active) setVisible(config.enabled && config.visible);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function hide() {
    setBusy(true);
    try {
      await importsApi.hideMenu();
      setVisible(false);
    } catch {
      toast({
        description: "Nie udało się zapisać ustawienia. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }
  if (!visible) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Import danych
        </h2>
        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          aria-label="Ukryj import danych"
          onClick={() => setConfirming(true)}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="overflow-hidden rounded-b2b border bg-white">
        <MenuRow
          href="/account/partner/studio/import/fitssey"
          title="Przenieś studio z Fitssey"
          subtitle="Sprawdź dane przed importem"
          Icon={Download}
        />
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ukryć import danych?</AlertDialogTitle>
            <AlertDialogDescription>
              Opcja „Przenieś studio z Fitssey” zostanie trwale ukryta w menu tego konta. Zapisane
              importy pozostaną dostępne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void hide()}>
              Ukryj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
