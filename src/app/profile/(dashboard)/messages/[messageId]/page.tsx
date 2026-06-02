"use client";

import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { axiosInstance } from "@/lib/axiosInstance";

interface MessageDetail {
  id: string;
  email: string | null;
  contact_info: string | null;
  message: string;
  event_id: string | null;
  event_title: string | null;
  instructor_id: string | null;
  instructor_name: string | null;
  created_at: string;
}

export default function MessageDetailPage() {
  const { messageId } = useParams<{ messageId: string }>();
  const [msg, setMsg] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosInstance
      .get<MessageDetail>(`/partner/messages/${messageId}`)
      .then(({ data }) => setMsg(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [messageId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !msg) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-sm text-gray-500">Nie znaleziono wiadomości.</p>
      </div>
    );
  }

  const sentAt = format(new Date(msg.created_at), "d MMM yyyy, HH:mm", { locale: pl });
  const sentAgo = formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: pl });

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      {/* Sender */}
      <div className="rounded-xl border bg-white px-4 divide-y">
        {msg.email && (
          <div className="flex flex-col gap-0.5 py-3 border-b">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Nadawca</span>
            <span className="text-sm text-gray-900">{msg.email}</span>
          </div>
        )}
        {msg.contact_info && (
          <div className="flex flex-col gap-0.5 py-3 border-b">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Dane kontaktowe</span>
            <span className="text-sm text-gray-900">{msg.contact_info}</span>
          </div>
        )}
        {msg.event_title && (
          <div className="flex flex-col gap-0.5 py-3 border-b">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Wydarzenie</span>
            <span className="text-sm text-gray-900">{msg.event_title}</span>
          </div>
        )}
        {msg.instructor_name && (
          <div className="flex flex-col gap-0.5 py-3 border-b">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Instruktor</span>
            <span className="text-sm text-gray-900">{msg.instructor_name}</span>
          </div>
        )}
        <div className="flex flex-col gap-0.5 py-3">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Wysłano</span>
          <span className="text-sm text-gray-900">{sentAt}</span>
          <span className="text-xs text-gray-400">{sentAgo}</span>
        </div>
      </div>

      {/* Message body */}
      <div className="rounded-xl border bg-white px-4 py-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Wiadomość</p>
        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
      </div>
    </div>
  );
}
