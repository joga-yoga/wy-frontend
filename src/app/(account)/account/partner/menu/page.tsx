"use client";

import { ArrowLeftRight, LogOut, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MenuRow } from "@/components/menu/MenuRow";
import { StudioWorkspaceRows } from "@/components/menu/StudioWorkspaceRows";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

interface InvitationItem {
  id: string;
  kind: "instructor_claim" | "studio_claim";
  instructor_name?: string | null;
  studio_name?: string | null;
  event_title: string | null;
  expires_at: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{children}</h2>
  );
}

/**
 * Menu tab (spec-b2b §4): the studio workspace (flattened for 1 studio, grouped for
 * 2+), account rows, and the calm B2B→B2C switch card — the asymmetric counterpart
 * to T13's pinned B2C profile button.
 */
export default function MenuPage() {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { capabilities, isLoading } = usePartnerCapabilities();
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get<InvitationItem[]>("/users/me/invitations")
      .then((r) => setInvitations(r.data))
      .catch(() => setInvitations([]));
  }, []);

  async function respond(invitationId: string, action: "accept" | "decline") {
    setRespondingId(invitationId);
    try {
      await axiosInstance.post(`/users/me/invitations/${invitationId}/${action}`);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      toast({
        description:
          action === "accept"
            ? "Profil instruktora połączony z Twoim kontem!"
            : "Zaproszenie odrzucone.",
      });
    } catch {
      toast({ description: "Nie udało się zapisać odpowiedzi.", variant: "destructive" });
    } finally {
      setRespondingId(null);
    }
  }

  const managedStudios = capabilities?.managedStudios ?? [];
  const hasTeachingOnly = Boolean(
    capabilities && managedStudios.length === 0 && capabilities.teachingStudios.length > 0,
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Menu</h1>

      {invitations.length > 0 && (
        <section className="space-y-2">
          <SectionLabel>Zaproszenia</SectionLabel>
          <div className="divide-y rounded-xl border bg-white overflow-hidden">
            {invitations.map((inv) => (
              <div key={inv.id} className="px-4 py-3 space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {inv.kind === "studio_claim" ? (
                    <>
                      Zaproszenie do profilu studia:{" "}
                      <span className="font-semibold">{inv.studio_name}</span>
                    </>
                  ) : (
                    <>
                      Zaproszenie do profilu instruktora:{" "}
                      <span className="font-semibold">{inv.instructor_name}</span>
                    </>
                  )}
                </p>
                {inv.event_title && (
                  <p className="text-xs text-gray-500">Wydarzenie: {inv.event_title}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="green"
                    onClick={() => respond(inv.id, "accept")}
                    disabled={respondingId === inv.id}
                  >
                    Zaakceptuj
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respond(inv.id, "decline")}
                    disabled={respondingId === inv.id}
                  >
                    Odrzuć
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isLoading && managedStudios.length === 1 && (
        <StudioWorkspaceRows studioId={managedStudios[0].id} studioName={managedStudios[0].name} />
      )}

      {!isLoading && managedStudios.length >= 2 && (
        <section className="space-y-2">
          <SectionLabel>Twoje studia</SectionLabel>
          <div className="rounded-xl border bg-white overflow-hidden divide-y">
            {managedStudios.map((studio) => (
              <MenuRow
                key={studio.id}
                href={`/konto/partner/menu/studio/${studio.id}`}
                title={studio.name}
                subtitle="Profil, instruktorzy, klienci, płatności"
                Icon={Tag}
              />
            ))}
          </div>
        </section>
      )}

      {!isLoading && hasTeachingOnly && (
        <section className="space-y-2">
          <SectionLabel>Studio</SectionLabel>
          <Link
            href="/konto/partner/studio/create"
            className="flex items-center justify-center rounded-xl border border-dashed bg-white px-4 py-4 text-center hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm text-gray-500">Prowadzisz własne studio?</p>
              <p className="text-sm font-semibold text-brand-green-700">Utwórz studio</p>
            </div>
          </Link>
        </section>
      )}

      {!isLoading && managedStudios.length === 0 && !hasTeachingOnly && (
        <section className="space-y-2">
          <SectionLabel>Studio</SectionLabel>
          <Link
            href="/konto/partner/studio/create"
            className="flex items-center justify-center rounded-xl border border-dashed bg-white px-4 py-4 text-center hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm text-gray-500">Prowadzisz studio jogi?</p>
              <p className="text-sm font-semibold text-brand-green-700">Utwórz studio</p>
            </div>
          </Link>
        </section>
      )}

      <section className="space-y-2">
        <SectionLabel>Konto</SectionLabel>
        <div className="rounded-xl border bg-white overflow-hidden divide-y">
          <MenuRow
            href="/konto/partner/organizacja"
            title="Profil organizatora"
            subtitle="Publiczny profil, jako kogo organizujesz"
            Icon={Tag}
          />
          <MenuRow
            href="/konto/partner/konto"
            title="Dane konta"
            subtitle="Imię, e-mail, hasło"
            Icon={Tag}
          />
        </div>
      </section>

      {/* B2B→B2C switch — the calm counterpart to the pinned B2C button (T13);
          calm here because the tab bar already exists (spec-b2b §2). */}
      <Link
        href="/konto"
        className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-brand-green-700">
          <ArrowLeftRight size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Przełącz na konto osobiste</p>
          <p className="text-xs text-gray-500">Twoje rezerwacje, karnety, odkrywanie</p>
        </div>
      </Link>

      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 hover:text-red-700"
      >
        <LogOut size={14} />
        Wyloguj się
      </button>
    </div>
  );
}
