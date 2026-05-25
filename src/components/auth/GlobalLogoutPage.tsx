"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { clearAuthStorage } from "@/lib/auth/logoutChain";

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

    const final = params.get("final") || "/";
    const resolvedTarget = final;

    clearAuthStorage();
    delete axios.defaults.headers.common["Authorization"];
    setTarget(resolvedTarget);

    const timeoutId = window.setTimeout(() => {
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
