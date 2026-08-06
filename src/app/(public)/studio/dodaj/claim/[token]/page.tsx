"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

type ClaimResponse = { studio_id: string; edit_url: string; status: string; review_status: string };

function errorCode(error: unknown) {
  if (!(error instanceof AxiosError)) return null;
  const detail = error.response?.data?.detail;
  return detail && typeof detail === "object" && "code" in detail ? String(detail.code) : null;
}

function ClaimStudioDraft() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const started = useRef(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || started.current) return;
    const claimPath = `/studio/dodaj/claim/${params.token}`;
    if (!user) {
      router.replace(`/profile/login?next=${encodeURIComponent(claimPath)}`);
      return;
    }
    started.current = true;
    axiosInstance
      .post<ClaimResponse>(`/studio-profile-drafts/${params.token}/claim`)
      .then(({ data }) => router.replace(data.edit_url))
      .catch((error: unknown) => {
        const status = error instanceof AxiosError ? error.response?.status : undefined;
        if (status === 403 && errorCode(error) === "partner_required") {
          router.replace(`/profile/become-partner?next=${encodeURIComponent(claimPath)}`);
          return;
        }
        const text =
          status === 404 || status === 410
            ? "Ten szkic wygasł albo nie istnieje. Przygotuj go ponownie."
            : status === 409
              ? "To studio jest już zarządzane przez innego właściciela."
              : "Nie udało się przypisać studia. Spróbuj ponownie za chwilę.";
        setMessage(text);
        toast({ description: text, variant: "destructive" });
      });
  }, [loading, params.token, router, toast, user]);

  if (message) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">Nie udało się przypisać studia</h1>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        <Button asChild>
          <Link href="/studio/dodaj">Wróć do generatora</Link>
        </Button>
      </main>
    );
  }
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <h1 className="text-xl font-semibold">Przygotowujemy profil studia...</h1>
      <p className="text-sm text-muted-foreground">Za chwilę otworzymy edytor strony studia.</p>
    </main>
  );
}

export default function StudioDraftClaimPage() {
  return (
    <Suspense fallback={null}>
      <ClaimStudioDraft />
    </Suspense>
  );
}
