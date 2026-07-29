"use client";

import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { axiosInstance } from "@/lib/axiosInstance";
import { formatDateRange } from "@/lib/formatDateRange";
import { InquiryItem } from "@/lib/inboxTypes";

function typeLabel(type: string | null): string {
  if (type === "retreat") return "Wyjazd";
  if (type === "workshop") return "Wyjazdy";
  return type ?? "—";
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<InquiryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosInstance
      .get<InquiryItem>(`/partner/inbox/${orderId}`)
      .then(({ data }) => setOrder(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-sm text-gray-500">Nie znaleziono rezerwacji.</p>
      </div>
    );
  }

  const eventDate = order.event_start_date
    ? formatDateRange(order.event_start_date, order.event_end_date ?? undefined)
    : null;

  const reservedAt = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: pl,
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      <div className="rounded-xl border bg-white px-4 divide-y">
        <Row label="Uczestnik" value={order.author?.email ?? null} />

        <Row label="Wydarzenie" value={order.event_title} />
        <Row label="Termin" value={eventDate} />
        <Row label="Typ" value={typeLabel(order.event_type)} />
        <Row label="Preferowany kontakt" value={order.preferred_contact} />
        <Row label="Notatka od uczestnika" value={order.message} />
        <Row label="Data rezerwacji" value={reservedAt} />
      </div>
    </div>
  );
}
