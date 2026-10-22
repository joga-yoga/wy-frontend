"use client";

import { useEffect, useState } from "react";

import type { RoomOption } from "@/app/account/partner/class-schedules/types";
import { axiosInstance } from "@/lib/axiosInstance";

/** A failed/stale room lookup must never be interpreted as a roomless studio. */
export function useScheduleRooms(
  studioId: string | null | undefined,
  roomId: string,
  onRoomChange: (id: string) => void,
  solo = false,
) {
  const [result, setResult] = useState<{
    studioId: string;
    rooms: RoomOption[];
    error: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!studioId || solo) return;
    let active = true;
    setResult(null);
    axiosInstance
      .get<RoomOption[]>(`/studios/${studioId}/rooms`)
      .then(({ data }) => {
        if (active) setResult({ studioId, rooms: data, error: false });
      })
      .catch(() => {
        if (active) setResult({ studioId, rooms: [], error: true });
      });
    return () => {
      active = false;
    };
  }, [studioId, solo, attempt]);
  const current = result?.studioId === studioId ? result : null;
  const ready = solo || !studioId || Boolean(current && !current.error);
  const rooms = solo ? [] : (current?.rooms ?? []);
  useEffect(() => {
    if (
      !solo &&
      studioId &&
      current &&
      !current.error &&
      roomId &&
      !current.rooms.some((room) => room.id === roomId)
    )
      onRoomChange("");
  }, [solo, studioId, current, roomId, onRoomChange]);
  return {
    rooms,
    roomsLoading: !solo && Boolean(studioId) && !current,
    roomsError: !solo && Boolean(current?.error),
    retryRooms: () => {
      setResult(null);
      setAttempt((value) => value + 1);
    },
    roomValid:
      ready && (solo || (roomId ? rooms.some((room) => room.id === roomId) : rooms.length === 0)),
  };
}
