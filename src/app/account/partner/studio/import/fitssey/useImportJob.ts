"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import { importError, importsApi } from "./api";
import type { ImportJob } from "./types";

export function useImportJob(id: string) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState("");
  const active = useRef(true);
  const currentId = useRef(id);
  currentId.current = id;
  const accept = useCallback((next: ImportJob) => {
    setJob((previous) =>
      previous &&
      previous.id === next.id &&
      (previous.revision > next.revision ||
        Date.parse(previous.updated_at) > Date.parse(next.updated_at))
        ? previous
        : next,
    );
  }, []);
  const refresh = useCallback(async () => {
    try {
      const next = await importsApi.job(id);
      if (active.current && currentId.current === id) {
        accept(next);
        setError("");
      }
      return next;
    } catch (error) {
      if (active.current && currentId.current === id) setError(importError(error).message);
      return null;
    }
  }, [id, accept]);
  useEffect(() => {
    active.current = true;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    let stopped = false;
    let runningRequest = false;
    const poll = async () => {
      if (stopped || runningRequest) return;
      if (document.visibilityState === "hidden") {
        timer = setTimeout(poll, 10000);
        return;
      }
      runningRequest = true;
      const next = await refresh();
      runningRequest = false;
      if (stopped) return;
      failures = next ? 0 : Math.min(failures + 1, 4);
      const running = next && ["analyzing", "importing"].includes(next.state);
      timer = setTimeout(
        poll,
        failures ? Math.min(60000, 5000 * 2 ** failures) : running ? 5000 : 15000,
      );
    };
    const visible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        void poll();
      }
    };
    void poll();
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      active.current = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  return { job, setJob: accept, error, refresh };
}
