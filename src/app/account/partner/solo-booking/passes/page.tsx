"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { PassModal } from "../../studio/[studioId]/edit/PassModal";
import type { StudioPass } from "../../studio/[studioId]/edit/types";

export default function OwnPassesPage() {
  const { capabilities } = usePartnerCapabilities();
  const studioId = capabilities?.soloStudioId;
  const { toast } = useToast();
  const [passes, setPasses] = useState<StudioPass[]>([]);
  const [editing, setEditing] = useState<StudioPass | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!studioId) return;
    axiosInstance
      .get<{ passes: StudioPass[] }>(`/studios/${studioId}`)
      .then(({ data }) => setPasses(data.passes))
      .catch(() =>
        toast({ description: "Nie udało się załadować karnetów.", variant: "destructive" }),
      );
  }, [studioId, toast]);

  async function remove(pass: StudioPass) {
    if (!studioId || !pass.id) return;
    try {
      await axiosInstance.delete(`/studios/${studioId}/passes/${pass.id}`);
      setPasses((rows) => rows.filter((row) => row.id !== pass.id));
    } catch {
      toast({ description: "Nie udało się usunąć karnetu.", variant: "destructive" });
    }
  }

  if (!studioId) return null;
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-semibold">Karnety</h1>
      <p className="text-sm text-muted-foreground">Opcjonalne karnety na moje zajęcia.</p>
      <div className="divide-y rounded-b2b border">
        {passes.map((pass) => (
          <div key={pass.id} className="space-y-2 p-4">
            <p className="font-semibold">{pass.name}</p>
            <p>
              {pass.price} {pass.currency} · {pass.session_count ?? "Bez limitu"} wejść
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(pass);
                  setOpen(true);
                }}
              >
                Edytuj
              </Button>
              <Button variant="outline" onClick={() => void remove(pass)}>
                Usuń z oferty
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="green"
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        Dodaj karnet
      </Button>
      <PassModal
        isOpen={open}
        onClose={() => setOpen(false)}
        studioId={studioId}
        dropInPrice={null}
        currency={editing?.currency ?? "PLN"}
        editPass={editing}
        onSaved={(pass) =>
          setPasses((rows) =>
            editing ? rows.map((row) => (row.id === pass.id ? pass : row)) : [...rows, pass],
          )
        }
      />
    </div>
  );
}
