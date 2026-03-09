"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { axiosInstance } from "@/lib/axiosInstance";
import { clearAuthStorage, isAllowedLogoutTarget } from "@/lib/auth/logoutChain";

function LogoutContent() {
  const params = useSearchParams();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const cid = params.get("cid") || "no-cid";
    const next = params.get("next");
    const final = params.get("final") || `${process.env.NEXT_PUBLIC_PROFILE_HOST}/`;

    const visitedKey = `logout-visited:${cid}:${window.location.origin}`;

    const resolveTarget = () => {
      if (sessionStorage.getItem(visitedKey)) {
        return final;
      }

      sessionStorage.setItem(visitedKey, "1");

      if (next) {
        try {
          const decoded = decodeURIComponent(next);
          if (isAllowedLogoutTarget(decoded)) {
            return decoded;
          }
        } catch {
          // ignore malformed next
        }
      }

      return final;
    };

    const target = resolveTarget();

    clearAuthStorage();
    delete axios.defaults.headers.common["Authorization"];

    const timeout = setTimeout(() => {
      window.location.href = target;
    }, 1500);

    axiosInstance
      .post("/logout")
      .catch(() => null)
      .finally(() => {
        clearTimeout(timeout);
        window.location.href = target;
      });
  }, [params]);

  return null;
}

export function GlobalLogoutPage() {
  return (
    <Suspense>
      <LogoutContent />
    </Suspense>
  );
}
