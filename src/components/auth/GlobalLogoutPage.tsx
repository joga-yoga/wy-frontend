"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { clearAuthStorage, isAllowedLogoutTarget } from "@/lib/auth/logoutChain";

const REDIRECT_DELAY_MS = 100;

function LogoutContent() {
  const params = useSearchParams();
  const isProcessing = useRef(false);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isProcessing.current) {
      return;
    }
    isProcessing.current = true;

    const cid = params.get("cid") || "no-cid";
    const next = params.get("next");
    const final = params.get("final") || `${process.env.NEXT_PUBLIC_PROFILE_HOST}/`;
    const currentOrigin = window.location.origin;
    const visitedKey = `logout-visited:${cid}:${currentOrigin}`;
    let resolvedTarget = final;

    if (sessionStorage.getItem(visitedKey)) {
      console.log("[logout] already-visited", {
        currentOrigin,
        cid,
        visitedKey,
        final,
      });
    } else {
      sessionStorage.setItem(visitedKey, "1");

      if (next) {
        try {
          const decoded = decodeURIComponent(next);
          const allowed = isAllowedLogoutTarget(decoded);

          console.log("[logout] evaluating-next", {
            currentOrigin,
            cid,
            rawNext: next,
            decodedNext: decoded,
            allowed,
            final,
          });

          if (allowed) {
            resolvedTarget = decoded;
          }
        } catch (error) {
          console.log("[logout] malformed-next", {
            currentOrigin,
            cid,
            rawNext: next,
            final,
            error,
          });
        }
      }
    }

    if (resolvedTarget === final && (!next || !isAllowedLogoutTarget(resolvedTarget))) {
      console.log("[logout] fallback-final", {
        currentOrigin,
        cid,
        rawNext: next,
        final,
      });
    }

    console.log("[logout] page-enter", {
      currentOrigin,
      cid,
      rawNext: next,
      final,
      target: resolvedTarget,
    });

    clearAuthStorage();
    delete axios.defaults.headers.common["Authorization"];
    setTarget(resolvedTarget);

    console.log("[logout] storage-cleared", {
      currentOrigin,
      cid,
      target: resolvedTarget,
    });

    const timeoutId = window.setTimeout(() => {
      console.log("[logout] redirecting", {
        currentOrigin,
        cid,
        target: resolvedTarget,
      });
      window.location.replace(resolvedTarget);
    }, REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Wylogowywanie...</h1>
        <p className="mt-2 text-sm text-slate-600">
          Kończymy wylogowanie we wszystkich częściach aplikacji.
        </p>
        {target && (
          <Button asChild className="mt-5 w-full">
            <a href={target}>Kontynuuj wylogowanie</a>
          </Button>
        )}
      </div>
    </div>
  );
}

export function GlobalLogoutPage() {
  return (
    <Suspense>
      <LogoutContent />
    </Suspense>
  );
}
