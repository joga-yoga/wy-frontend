"use client";

import { CalendarPlus, ChevronRight, Inbox, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StatusChip } from "@/components/b2b/StatusChip";
import { HashedAvatar } from "@/components/common/HashedAvatar";
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
import { axiosInstance } from "@/lib/axiosInstance";
import {
  flattenInbox,
  InboxResponse,
  InquiryItem,
  InquiryKind,
  OrganizerInviteItem,
  UserInvitationItem,
} from "@/lib/inboxTypes";
import { cn } from "@/lib/utils";

const EVENT_TYPE_LABELS: Record<string, string> = {
  retreat: "Wyjazd",
  workshop: "Wydarzenie",
  course: "Kurs",
  class: "Zajęcia",
};

const FILTERS: { value: InquiryKind | "all"; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "reservation", label: "Rezerwacje" },
  { value: "question", label: "Pytania" },
];

function timeLabel(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

function dayGroupLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Dziś";
  if (sameDay(d, yesterday)) return "Wczoraj";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

type FeedRow =
  | { kind: "inquiry"; createdAt: string; data: InquiryItem }
  | { kind: "organizer_invite"; createdAt: string; data: OrganizerInviteItem }
  | { kind: "user_invitation"; createdAt: string; data: UserInvitationItem };

/**
 * Rezerwacje tab (spec-b2b §4 + instructors-clients §4) — aggregated, day-grouped
 * inbox over T05's inquiry entity, plus actionable invite rows merged in client-side
 * (there is no shared table to merge them server-side). This is also the fresh-partner
 * onboarding surface (empty state below); T07 built the frame and the populated list,
 * this task adds filter chips, source labels, handled state, and the invite rows.
 */
export default function BookingsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<InquiryKind | "all">("all");
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [showSourceLabels, setShowSourceLabels] = useState(false);
  const [organizerInvites, setOrganizerInvites] = useState<OrganizerInviteItem[]>([]);
  const [userInvitations, setUserInvitations] = useState<UserInvitationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const requests: Promise<unknown>[] = [
      axiosInstance
        .get<InboxResponse>("/partner/inbox", {
          params: filter === "all" ? undefined : { kind: filter },
        })
        .then((r) => {
          setItems(flattenInbox(r.data));
          setShowSourceLabels(r.data.show_source_labels);
        }),
    ];
    if (filter === "all") {
      requests.push(
        axiosInstance
          .get<OrganizerInviteItem[]>("/partner/organizer-invites")
          .then((r) => setOrganizerInvites(r.data))
          .catch(() => setOrganizerInvites([])),
        axiosInstance
          .get<UserInvitationItem[]>("/users/me/invitations")
          .then((r) => setUserInvitations(r.data))
          .catch(() => setUserInvitations([])),
      );
    } else {
      setOrganizerInvites([]);
      setUserInvitations([]);
    }
    Promise.all(requests)
      .catch(() =>
        toast({ description: "Nie udało się załadować rezerwacji.", variant: "destructive" }),
      )
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function respondToUserInvitation(id: string, action: "accept" | "decline") {
    setRespondingId(id);
    try {
      await axiosInstance.post(`/users/me/invitations/${id}/${action}`);
      setUserInvitations((prev) => prev.filter((i) => i.id !== id));
      toast({
        description: action === "accept" ? "Zaproszenie zaakceptowane." : "Zaproszenie odrzucone.",
      });
    } catch {
      toast({ description: "Nie udało się zapisać odpowiedzi.", variant: "destructive" });
    } finally {
      setRespondingId(null);
    }
  }

  async function respondToOrganizerInvite(
    invite: OrganizerInviteItem,
    action: "accept" | "decline",
  ) {
    setRespondingId(invite.id);
    try {
      await axiosInstance.post(`/events/${invite.event_id}/organizers/${invite.id}/${action}`);
      setOrganizerInvites((prev) => prev.filter((i) => i.id !== invite.id));
      toast({
        description:
          action === "accept" ? "Zostałeś współorganizatorem." : "Zaproszenie odrzucone.",
      });
    } catch {
      toast({ description: "Nie udało się zapisać odpowiedzi.", variant: "destructive" });
    } finally {
      setRespondingId(null);
    }
  }

  const groups = useMemo(() => {
    const rows: FeedRow[] = [
      ...items.map((data): FeedRow => ({ kind: "inquiry", createdAt: data.created_at, data })),
      ...organizerInvites.map(
        (data): FeedRow => ({ kind: "organizer_invite", createdAt: data.created_at, data }),
      ),
      ...userInvitations.map(
        (data): FeedRow => ({ kind: "user_invitation", createdAt: data.created_at, data }),
      ),
    ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const map = new Map<string, FeedRow[]>();
    for (const row of rows) {
      const label = dayGroupLabel(row.createdAt);
      const bucket = map.get(label);
      if (bucket) bucket.push(row);
      else map.set(label, [row]);
    }
    return [...map.entries()];
  }, [items, organizerInvites, userInvitations]);

  const isEmpty = groups.length === 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      <div className="flex gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === value
                ? "bg-gray-900 text-white"
                : "border bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : isEmpty ? (
        <div className="space-y-3">
          <div className="rounded-2xl border bg-white py-10 px-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Inbox size={22} className="text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-gray-900">
                {filter === "all" ? "Tu pojawią się rezerwacje" : "Brak wyników"}
              </p>
              {filter === "all" && (
                <p className="text-sm text-gray-500">
                  Zapytania i rezerwacje od uczestników Twoich wyjazdów, wydarzeń i kursów zobaczysz
                  w tym miejscu — gdy tylko coś opublikujesz.
                </p>
              )}
            </div>
            {filter === "all" && (
              <div className="flex flex-col items-center gap-3 pt-1">
                <Link href="/konto/partner/oferta" className="w-full">
                  <Button variant="green" className="w-full rounded-full">
                    Dodaj pierwsze wydarzenie
                  </Button>
                </Link>
                <Link
                  href="/konto/partner/instruktorzy/create"
                  className="text-sm font-semibold text-gray-900 hover:underline"
                >
                  Utwórz profil instruktora
                </Link>
              </div>
            )}
          </div>
          {filter === "all" && (
            <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3">
              <CalendarPlus size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <p className="text-xs text-gray-500">
                Prowadzisz studio lub zajęcia? Utwórz studio w Menu — wtedy pojawi się tab Grafik.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([label, groupRows]) => (
            <section key={label} className="space-y-2">
              <h2 className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {label}
              </h2>
              <div className="divide-y rounded-xl border bg-white overflow-hidden">
                {groupRows.map((row) => {
                  if (row.kind === "inquiry") {
                    return (
                      <InquiryRow
                        key={row.data.id}
                        item={row.data}
                        showSourceLabel={showSourceLabels}
                      />
                    );
                  }
                  if (row.kind === "organizer_invite") {
                    return (
                      <OrganizerInviteRow
                        key={row.data.id}
                        invite={row.data}
                        isResponding={respondingId === row.data.id}
                        onRespond={(action) => respondToOrganizerInvite(row.data, action)}
                      />
                    );
                  }
                  return (
                    <UserInvitationRow
                      key={row.data.id}
                      invitation={row.data}
                      isResponding={respondingId === row.data.id}
                      onRespond={(action) => respondToUserInvitation(row.data.id, action)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function InquiryRow({ item, showSourceLabel }: { item: InquiryItem; showSourceLabel: boolean }) {
  const displayName = item.author?.email ?? "Nieznany nadawca";
  const typeLabel = item.event_type ? EVENT_TYPE_LABELS[item.event_type] : null;
  return (
    <Link
      href={`/konto/partner/rezerwacje/${item.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <HashedAvatar seed={item.author?.id ?? item.id} name={displayName} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {!item.is_read && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green-700" />
          )}
          <p
            className={cn(
              "truncate text-sm",
              item.is_read ? "font-medium text-gray-700" : "font-semibold text-gray-900",
            )}
          >
            {displayName}
          </p>
        </div>
        {item.event_title && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{item.event_title}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {typeLabel && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {typeLabel}
            </span>
          )}
          {item.kind === "question" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              Pytanie
            </span>
          )}
          {showSourceLabel && item.source_label && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              jako: {item.source_label}
            </span>
          )}
          {item.status === "handled" ? (
            <StatusChip tone="green" className="text-[10px]">
              Odpowiedziano{item.handled_by_label ? ` · ${item.handled_by_label}` : ""}
            </StatusChip>
          ) : (
            !item.is_read && (
              <span className="rounded-full bg-b2b-green-bg px-2 py-0.5 text-[10px] font-medium text-brand-green-700">
                Nowa
              </span>
            )
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-gray-400">{timeLabel(item.created_at)}</span>
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </Link>
  );
}

function InviteRowShell({
  title,
  subtitle,
  isResponding,
  onRespond,
}: {
  title: string;
  subtitle: string | null;
  isResponding: boolean;
  onRespond: (action: "accept" | "decline") => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-b2b-green-bg text-brand-green-700">
          <UserPlus size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="truncate text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          <span className="mt-1 inline-block rounded-full bg-b2b-amber-bg px-2 py-0.5 text-[10px] font-medium text-b2b-amber-text">
            Zaproszenie
          </span>
        </div>
        <ChevronRight size={16} className="shrink-0 text-gray-400" />
      </button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {subtitle && <AlertDialogDescription>{subtitle}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setIsOpen(false);
              onRespond("decline");
            }}
            disabled={isResponding}
          >
            Odrzuć
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setIsOpen(false);
              onRespond("accept");
            }}
            disabled={isResponding}
            className="bg-brand-green-700 hover:bg-brand-green-700/90"
          >
            Zaakceptuj
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function OrganizerInviteRow({
  invite,
  isResponding,
  onRespond,
}: {
  invite: OrganizerInviteItem;
  isResponding: boolean;
  onRespond: (action: "accept" | "decline") => void;
}) {
  return (
    <InviteRowShell
      title={`Współorganizacja: ${invite.event_title ?? "wydarzenie"}`}
      subtitle={invite.organizer_name ? `jako ${invite.organizer_name}` : null}
      isResponding={isResponding}
      onRespond={onRespond}
    />
  );
}

function UserInvitationRow({
  invitation,
  isResponding,
  onRespond,
}: {
  invitation: UserInvitationItem;
  isResponding: boolean;
  onRespond: (action: "accept" | "decline") => void;
}) {
  const title =
    invitation.kind === "studio_claim"
      ? `Zaproszenie do profilu studia: ${invitation.studio_name ?? ""}`
      : `Zaproszenie do profilu instruktora: ${invitation.instructor_name ?? ""}`;
  return (
    <InviteRowShell
      title={title}
      subtitle={invitation.event_title ? `Wydarzenie: ${invitation.event_title}` : null}
      isResponding={isResponding}
      onRespond={onRespond}
    />
  );
}
