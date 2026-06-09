"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

type Step = "identify" | "preview";

interface PreviewData {
  instructor_id: string;
  name: string;
  image_id: string | null;
  claim_status: string;
}

const CLAIM_STATUS_LABEL: Record<string, string> = {
  claimed: "Ma konto",
  invited: "Zaproszony/a",
  invitable: "Bez konta",
  legacy: "Bez e-maila",
};

const emailSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail"),
});

type EmailForm = z.infer<typeof emailSchema>;

export default function InstructorCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("identify");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [isItsMe, setIsItsMe] = useState(false);

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Reset all local state on every mount (guards against client-side navigation stale state)
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (isMountedRef.current) {
      setStep("identify");
      setPreview(null);
      setIsItsMe(false);
      form.reset({ email: "" });
    }
    isMountedRef.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if user already has a claimed instructor
  useEffect(() => {
    axiosInstance
      .get<Array<{ is_claimed: boolean; email: string | null }>>("/instructors")
      .then(({ data }) => {
        const claimed =
          user != null &&
          data.some(
            (i) =>
              i.is_claimed === true ||
              (i.email && i.email.toLowerCase() === user.email.toLowerCase()),
          );
        setAlreadyClaimed(claimed);
      })
      .catch(() => {
        // silently ignore — just show "It's me" by default
      });
  }, [user]);

  async function handleItsMe() {
    setIsItsMe(true);
    try {
      const res = await axiosInstance.post<{ id: string }>("/instructors/self", {});
      toast({ description: "Twój profil instruktora gotowy!" });
      router.push(`/profile/instructors/${res.data.id}/edit`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ description: detail || "Nie udało się utworzyć profilu.", variant: "destructive" });
      setIsItsMe(false);
    }
  }

  async function onEmailSubmit(data: EmailForm) {
    try {
      const res = await axiosInstance.post<{
        instructor_id: string;
        claim_status: string;
        created: boolean;
        name?: string | null;
        image_id?: string | null;
      }>("/instructors/resolve", { email: data.email });

      if (res.data.created) {
        // New stub — go straight to full edit form
        router.push(`/profile/instructors/${res.data.instructor_id}/edit`);
      } else {
        setPreview({
          instructor_id: res.data.instructor_id,
          name: res.data.name ?? data.email,
          image_id: res.data.image_id ?? null,
          claim_status: res.data.claim_status,
        });
        setStep("preview");
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ description: detail || "Wystąpił błąd. Spróbuj ponownie.", variant: "destructive" });
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-8">
      {step === "identify" && (
        <>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Dodaj instruktora</h1>
            <p className="text-sm text-muted-foreground">
              Podaj e-mail instruktora — sprawdzimy, czy jest już w systemie.
            </p>
          </div>

          {!alreadyClaimed && (
            <button
              type="button"
              className="w-full flex items-center gap-3 rounded-md border p-4 text-left hover:bg-muted/50 transition-colors"
              onClick={handleItsMe}
              disabled={isItsMe}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-primary" />
              <span className="text-sm font-medium">To ja — prowadzę te zajęcia osobiście</span>
            </button>
          )}

          <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail instruktora</Label>
              <Input
                id="email"
                type="email"
                placeholder="instruktor@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Jeśli instruktor jest już w systemie, połączymy profile. Jeśli nie — wyślemy mu
                zaproszenie.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sprawdzam..." : "Dalej →"}
            </Button>
          </form>
        </>
      )}

      {step === "preview" && preview && (
        <>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Instruktor znaleziony</h1>
            <p className="text-sm text-muted-foreground">
              Ten e-mail jest już przypisany do istniejącego instruktora.
            </p>
          </div>

          <div className="rounded-md border p-4 flex items-center gap-3">
            <WyImage
              src={
                preview.image_id ||
                `https://avatar.vercel.sh/${preview.name.replace(/\s+/g, "_")}.png?size=56`
              }
              alt={preview.name}
              width={56}
              height={56}
              className="rounded-full object-cover border min-h-[56px] flex-shrink-0"
            />
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium truncate">{preview.name}</p>
              <p className="text-xs text-muted-foreground">
                {CLAIM_STATUS_LABEL[preview.claim_status] ?? preview.claim_status}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {preview.claim_status === "claimed" ? (
              <p className="text-sm text-muted-foreground rounded-md border p-3">
                Ten instruktor jest już połączony z kontem. Możesz dodać go bezpośrednio do
                wydarzenia z formularza wydarzeń — nie wymaga to żadnych dodatkowych kroków.
              </p>
            ) : (
              <Button
                onClick={() => router.push(`/profile/instructors/${preview.instructor_id}/edit`)}
              >
                Przejdź do profilu instruktora →
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setStep("identify");
                setPreview(null);
                form.reset({ email: "" });
              }}
            >
              ← Podaj inny e-mail
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
