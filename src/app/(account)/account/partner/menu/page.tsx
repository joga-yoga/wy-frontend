"use client";

import { Building2, ChevronRight, LogOut, Tag, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

function MenuRow({
  href,
  title,
  subtitle,
  Icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  Icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon size={18} className="text-gray-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{children}</h2>
  );
}

/**
 * Menu frame + empty/ghost states per the conditionality table (spec-b2b §3). Full
 * workspace design (Płatności i odwołania, notifications, help) is T09 — this ships
 * the grouped-sections/icon-square row pattern from the approved design mockups plus
 * enough real navigation that the tab is never a dead end. The B2B→B2C mode-switch
 * row card also belongs to T09 (it needs the B2C hub built in T13 to link to).
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

  const managedStudio = capabilities?.managedStudios[0];
  const hasTeachingOnly = Boolean(
    capabilities && !managedStudio && capabilities.teachingStudios.length > 0,
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

      {!isLoading && managedStudio && (
        <section className="space-y-2">
          <SectionLabel>{managedStudio.name} · Twoje studio</SectionLabel>
          <div className="rounded-xl border bg-white overflow-hidden divide-y">
            <MenuRow
              href={`/konto/partner/studio/${managedStudio.id}/edit`}
              title="Profil studia"
              subtitle="Podstawy, lokalizacja, cennik, zdjęcia"
              Icon={Building2}
            />
            <MenuRow
              href="/konto/partner/instruktorzy"
              title="Instruktorzy"
              subtitle="Zarządzaj zespołem studia"
              Icon={Users}
            />
            <MenuRow
              href="/konto/partner/klienci"
              title="Klienci"
              subtitle="Karnety i wizyty"
              Icon={Users}
            />
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

      {!isLoading && !managedStudio && !hasTeachingOnly && (
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
            Icon={Users}
          />
        </div>
      </section>

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
