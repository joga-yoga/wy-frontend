"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { SessionDetailDrawer } from "./SessionDetailDrawer";
import type { SessionSurface } from "./types";

const OCCURRENCE_PARAM = "occurrence";

export function openSessionDetails(occurrenceId: string) {
  const url = new URL(window.location.href);
  if (url.searchParams.get(OCCURRENCE_PARAM) === occurrenceId) return;
  url.searchParams.set(OCCURRENCE_PARAM, occurrenceId);
  window.history.pushState(null, "", url);
}

interface Props {
  surface: SessionSurface;
  onBookingCancelled?: () => void;
}

function DrawerFromUrl({ surface, onBookingCancelled }: Props) {
  const occurrenceId = useSearchParams().get(OCCURRENCE_PARAM);

  function close() {
    const url = new URL(window.location.href);
    url.searchParams.delete(OCCURRENCE_PARAM);
    window.history.replaceState(null, "", url);
  }

  return (
    <SessionDetailDrawer
      occurrenceId={occurrenceId}
      surface={surface}
      onClose={close}
      onBookingCancelled={onBookingCancelled}
    />
  );
}

export function LinkedSessionDetailDrawer(props: Props) {
  return (
    <Suspense fallback={null}>
      <DrawerFromUrl {...props} />
    </Suspense>
  );
}
