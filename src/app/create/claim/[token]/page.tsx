"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

type ClaimResponse = {
  instructor_id: string;
  edit_url: string;
  status: string;
};

function getErrorCode(error: unknown) {
  if (!(error instanceof AxiosError)) return null;
  const detail = error.response?.data?.detail;
  if (detail && typeof detail === "object" && "code" in detail) {
    return String(detail.code);
  }
  return null;
}

function ClaimDraftContent() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const hasStarted = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || hasStarted.current) return;

    const claimPath = `/create/claim/${params.token}`;

    if (!user) {
      router.replace(`/profile/login?next=${encodeURIComponent(claimPath)}`);
      return;
    }

    hasStarted.current = true;

    axiosInstance
      .post<ClaimResponse>(`/instructor-profile-drafts/${params.token}/claim`)
      .then(({ data }) => {
        router.replace(data.edit_url);
      })
      .catch((error: unknown) => {
        const status = error instanceof AxiosError ? error.response?.status : undefined;
        const code = getErrorCode(error);

        if (status === 403 && code === "partner_required") {
          router.replace(`/profile/become-partner?next=${encodeURIComponent(claimPath)}`);
          return;
        }

        const message =
          status === 404 || status === 410
            ? "Ten podgląd profilu wygasł albo nie istnieje. Wygeneruj profil ponownie."
            : "Nie udało się przygotować profilu do edycji. Spróbuj ponownie za chwilę.";
        setErrorMessage(message);
        toast({ description: message, variant: "destructive" });
      });
  }, [loading, params.token, router, toast, user]);

  if (errorMessage) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">Nie udało się przygotować profilu</h1>
        <p className="max-w-md text-sm text-muted-foreground">{errorMessage}</p>
        <Button asChild>
          <Link href="/create">Wróć do generatora</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <h1 className="text-xl font-semibold">Przygotowujemy Twój profil...</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Za chwilę przeniesiemy Cię do edycji strony nauczyciela jogi.
      </p>
    </main>
  );
}

export default function GeneratedInstructorProfileDraftClaimPage() {
  return (
    <Suspense fallback={null}>
      <ClaimDraftContent />
    </Suspense>
  );
}
