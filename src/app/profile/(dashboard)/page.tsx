"use client";

import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";

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
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

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
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
      {/* Greeting */}
      <h1 className="text-xl font-semibold text-gray-900">
        {getGreeting(user?.name, user?.email)}
      </h1>

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
