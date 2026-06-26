"use client";

import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { ScheduleBlock } from "./components/ScheduleBlock";

interface OrderListItem {
  id: string;
  customer_name: string | null;
  email: string;
  event_title: string | null;
  type: string | null;
  created_at: string;
}

interface MessageListItem {
  id: string;
  email: string | null;
  message: string;
  event_id: string | null;
  event_title: string | null;
  instructor_id: string | null;
  instructor_name: string | null;
  created_at: string;
}

interface InvitationItem {
  id: string;
  instructor_id: string;
  instructor_name: string;
  event_title: string | null;
  expires_at: string;
  created_at: string;
}

interface InstructorListItem {
  id: string;
  name: string;
  image_id: string | null;
  short_bio: string | null;
  slug: string | null;
  is_owned?: boolean;
}

function getGreeting(name: string | undefined, email: string | undefined): string {
  const display = name?.split(" ")[0] || email?.split("@")[0] || "";
  return display ? `Dzień dobry, ${display} 👋` : "Dzień dobry 👋";
}

function avatarInitials(email: string | null | undefined): string {
  if (!email) return "?";
  return email.charAt(0).toUpperCase();
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: pl });
  } catch {
    return "";
  }
}

export default function AktywnoscPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorListItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get<OrderListItem[]>("/partner/orders")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));

    axiosInstance
      .get<MessageListItem[]>("/partner/messages")
      .then((r) => setMessages(r.data))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));

    axiosInstance
      .get<InvitationItem[]>("/users/me/invitations")
      .then((r) => setInvitations(r.data))
      .catch(() => setInvitations([]));

    Promise.all([
      axiosInstance.get<InstructorListItem[]>("/instructors").catch(() => ({ data: [] })),
      axiosInstance.get<InstructorListItem[]>("/instructor-roster").catch(() => ({ data: [] })),
    ])
      .then(([ownedResponse, rosterResponse]) => {
        const merged = new Map<string, InstructorListItem>();
        for (const instructor of rosterResponse.data) {
          merged.set(instructor.id, { ...instructor, is_owned: instructor.is_owned === true });
        }
        for (const instructor of ownedResponse.data) {
          merged.set(instructor.id, { ...instructor, is_owned: true });
        }
        setInstructors([...merged.values()]);
      })
      .finally(() => setLoadingInstructors(false));
  }, []);

  async function handleAccept(invitationId: string) {
    setAcceptingId(invitationId);
    try {
      await axiosInstance.post(`/users/me/invitations/${invitationId}/accept`);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      toast({ description: "Profil instruktora połączony z Twoim kontem!" });
    } catch {
      toast({ description: "Nie udało się zaakceptować zaproszenia.", variant: "destructive" });
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleDecline(invitationId: string) {
    setDecliningId(invitationId);
    try {
      await axiosInstance.post(`/users/me/invitations/${invitationId}/decline`);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      toast({ description: "Zaproszenie odrzucone." });
    } catch {
      toast({ description: "Nie udało się odrzucić zaproszenia.", variant: "destructive" });
    } finally {
      setDecliningId(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
      {/* Greeting */}
      <h1 className="text-xl font-semibold text-gray-900">
        {getGreeting(user?.name, user?.email)}
      </h1>

      {/* Schedule / Aktywność */}
      <ScheduleBlock />

      {/* Zaproszenia — only shown when there are pending invitations */}
      {invitations.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Zaproszenia
          </h2>
          <div className="divide-y rounded-xl border bg-white overflow-hidden">
            {invitations.map((inv) => (
              <div key={inv.id} className="px-4 py-3 space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Zaproszenie do profilu instruktora:{" "}
                    <span className="font-semibold">{inv.instructor_name}</span>
                  </p>
                  {inv.event_title && (
                    <p className="text-xs text-gray-500 mt-0.5">Wydarzenie: {inv.event_title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">Wygasa {timeAgo(inv.expires_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(inv.id)}
                    disabled={acceptingId === inv.id || decliningId === inv.id}
                  >
                    {acceptingId === inv.id ? "Akceptuję..." : "Zaakceptuj"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecline(inv.id)}
                    disabled={acceptingId === inv.id || decliningId === inv.id}
                  >
                    {decliningId === inv.id ? "Odrzucam..." : "Odrzuć"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rezerwacje */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Rezerwacje</h2>
        {loadingOrders ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border bg-gray-50 py-8 text-center">
            <p className="text-sm text-gray-400">Brak rezerwacji</p>
          </div>
        ) : (
          <div className="divide-y rounded-xl border bg-white overflow-hidden">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/profile/orders/${order.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.customer_name || order.email}
                  </p>
                  {order.event_title && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{order.event_title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(order.created_at)}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 shrink-0" />
              </Link>
            ))}
            {orders.length > 5 && (
              <div className="px-4 py-3">
                <span className="text-xs text-gray-400">
                  Zobacz wszystkie rezerwacje ({orders.length})
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Wiadomości */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Wiadomości</h2>
        {loadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border bg-gray-50 py-8 text-center">
            <p className="text-sm text-gray-400">Brak wiadomości</p>
          </div>
        ) : (
          <div className="divide-y rounded-xl border bg-white overflow-hidden">
            {messages.slice(0, 5).map((msg) => (
              <Link
                key={msg.id}
                href={`/profile/messages/${msg.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">
                    {avatarInitials(msg.email)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {msg.email || "Nieznany nadawca"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(msg.created_at)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Dziś w kalendarzu */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Dziś w kalendarzu
        </h2>
        <div className="rounded-xl border border-dashed bg-gray-50 py-8 text-center">
          <p className="text-sm text-gray-400">Kalendarz — wkrótce</p>
        </div>
      </section>
    </div>
  );
}
