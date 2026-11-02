"use client";

import { Bell, Inbox } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { StatusChip } from "@/components/b2b/StatusChip";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import { actionUrls, describe, relativeDate, STATE_LABEL, summarize } from "./inboxCopy";
import type { InboxItem, InboxState, UnifiedInboxResponse } from "./types";

const CHIP_TONE: Record<InboxState, "green" | "amber" | "gray"> = {
  pending: "amber",
  accepted: "green",
  rejected: "gray",
  expired: "gray",
  info: "gray",
};

/**
 * WY-65 — the account-level notifications bell.
 *
 * **Account-level, not profile-level.** One account can hold several studios and an
 * instructor profile, and every row names which of them it concerns (`target_name`) —
 * "somebody wants to join your studio" is unanswerable when you have three.
 *
 * One source: `/partner/inbox/invitations`. This replaces the two duplicate invitation
 * feeds that used to live on Menu and Rezerwacje — rendering the same row through two code
 * paths is exactly how the contradictory statuses in WY-63 happened.
 */
export function NotificationsBell() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [isActing, setIsActing] = useState(false);
  // Absent until we know: a bell that flashes 0 before its first response is noise.
  const [hasPartner, setHasPartner] = useState<boolean | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<{ unread_count: number }>(
        "/partner/inbox/unread-count",
      );
      setUnread(data.unread_count);
      setHasPartner(true);
    } catch {
      // 401/403 simply means this account has no partner profile — no bell for them.
      setHasPartner(false);
    }
  }, []);

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  const loadItems = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<UnifiedInboxResponse>("/partner/inbox/invitations");
      setItems(data.items);
      setUnread(data.unread_count);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) void loadItems();
  }, [isOpen, loadItems]);

  async function respond(item: InboxItem, action: "accept" | "reject") {
    const urls = actionUrls(item);
    if (!urls) return;
    setIsActing(true);
    try {
      await axiosInstance.post(action === "accept" ? urls.accept : urls.reject);
      toast({
        description: action === "accept" ? "Zaakceptowano." : "Odrzucono.",
      });
      setSelected(null);
      // Refetch rather than patching locally: accepting one row can change others (a
      // claim materialises grants), and a hand-maintained copy would drift from the
      // server's own view of the same facts.
      await loadItems();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ description: detail || "Nie udało się wykonać akcji.", variant: "destructive" });
    } finally {
      setIsActing(false);
    }
  }

  if (hasPartner === false) return null;

  return (
    <>
      <button
        type="button"
        aria-label={unread > 0 ? `Powiadomienia (${unread})` : "Powiadomienia"}
        onClick={() => setIsOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-black transition-colors duration-200 hover:bg-gray-200"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-b2b-red-solid px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <Drawer open={isOpen} onOpenChange={setIsOpen} showSwipeHandle>
        <DrawerContent className="sm:mx-auto sm:max-w-md">
          <div className="px-4 pb-2 pt-2">
            <DrawerTitle className="text-base font-bold text-gray-900">Powiadomienia</DrawerTitle>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">
            {items === null ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y rounded-b2b border bg-white">
                {items.map((item) => (
                  <InboxRow
                    key={`${item.kind}-${item.id}-${item.target_id ?? ""}`}
                    item={item}
                    onOpen={() => setSelected(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <InboxDetailDrawer
        item={selected}
        open={selected !== null}
        onOpenChange={(next) => !next && setSelected(null)}
        onRespond={respond}
        isActing={isActing}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-b2b border border-dashed bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Inbox size={22} />
      </span>
      <p className="text-sm font-semibold text-gray-900">Brak powiadomień</p>
      <p className="text-xs leading-relaxed text-gray-500">
        Zaproszenia do studiów i zespołów pojawią się tutaj. Damy znać, gdy będzie coś do
        potwierdzenia.
      </p>
    </div>
  );
}

function InboxRow({ item, onOpen }: { item: InboxItem; onOpen: () => void }) {
  // Handled rows stay openable but recede — WY-65 asks for muted, not hidden.
  const muted = !item.actionable;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        muted ? "opacity-60" : ""
      }`}
    >
      {item.actionable ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-b2b-red-solid" aria-hidden />
      ) : (
        <span className="h-2 w-2 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{summarize(item)}</p>
        <p className="truncate text-xs text-gray-500">{relativeDate(item.created_at)}</p>
      </div>
      <StatusChip tone={CHIP_TONE[item.state]}>{STATE_LABEL[item.state]}</StatusChip>
      <IoChevronForward className="h-4 w-4 shrink-0 text-gray-300" />
    </button>
  );
}

function InboxDetailDrawer({
  item,
  open,
  onOpenChange,
  onRespond,
  isActing,
}: {
  item: InboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRespond: (item: InboxItem, action: "accept" | "reject") => Promise<void>;
  isActing: boolean;
}) {
  if (!item) return null;
  const urls = actionUrls(item);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="sm:mx-auto sm:max-w-md">
        <div className="space-y-4 px-4 pb-6 pt-2">
          <div className="flex items-start gap-2">
            <DrawerTitle className="min-w-0 flex-1 text-base font-bold text-gray-900">
              {summarize(item)}
            </DrawerTitle>
            <StatusChip tone={CHIP_TONE[item.state]}>{STATE_LABEL[item.state]}</StatusChip>
          </div>

          <p className="text-sm leading-relaxed text-gray-600">{describe(item)}</p>

          <dl className="space-y-1.5 rounded-b2b border bg-white px-4 py-3 text-xs">
            {item.target_name && (
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Dotyczy</dt>
                <dd className="truncate font-medium text-gray-900">{item.target_name}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Otrzymano</dt>
              <dd className="font-medium text-gray-900">{relativeDate(item.created_at)}</dd>
            </div>
            {item.handled_at && (
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Rozpatrzono</dt>
                <dd className="font-medium text-gray-900">{relativeDate(item.handled_at)}</dd>
              </div>
            )}
          </dl>

          {item.actionable && urls ? (
            <div className="space-y-2">
              <Button
                size="action"
                variant="green"
                className="w-full"
                disabled={isActing}
                onClick={() => onRespond(item, "accept")}
              >
                Akceptuj
              </Button>
              <button
                type="button"
                disabled={isActing}
                onClick={() => onRespond(item, "reject")}
                className="w-full py-2 text-center text-sm font-medium text-b2b-red-solid hover:underline disabled:opacity-50"
              >
                Odrzuć
              </button>
            </div>
          ) : (
            // Handled and announcement rows open onto the same view with the outcome in
            // place of the buttons, so nothing becomes unreadable once it is answered.
            <p className="rounded-b2b bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
              {item.state === "info"
                ? "To powiadomienie ma charakter informacyjny."
                : `Status: ${STATE_LABEL[item.state]}.`}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
