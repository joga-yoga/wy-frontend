"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { InfoNote } from "@/components/b2b/InfoNote";
import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStudio } from "@/hooks/useCurrentStudio";
import { axiosInstance } from "@/lib/axiosInstance";

import type { InstructorLookupResponse, InstructorResolveResponse } from "../types";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AddInstructorPage() {
  const searchParams = useSearchParams();
  const studioId = searchParams.get("studioId");

  // Two entry points share this route:
  // - Menu → {Studio} → Instruktorzy → "Dodaj instruktora" carries `studioId` and gets
  //   the email-first, live-lookup roster flow below (instructors-clients §3).
  // - Every other "Dodaj instruktora" surface predates T10 (event/course forms via
  //   `EventInstructorsSection`/`CourseInstructorsField` use their own modal, but
  //   Oferta's instructor panel and the header-avatar placeholder still land here
  //   without a studio) and keeps the legacy partner-scoped add flow unchanged.
  return studioId ? <StudioRosterAddFlow /> : <LegacyAddInstructorFlow />;
}

function StudioRosterAddFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { studio } = useCurrentStudio();
  const step = searchParams.get("step") === "new" ? "new" : "identify";

  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<InstructorLookupResponse | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stubName, setStubName] = useState("");
  const [stubEmail, setStubEmail] = useState("");
  const [stubImageId, setStubImageId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [notFoundEmail, setNotFoundEmail] = useState<string | null>(null);

  const goToStubStep = (prefillEmail: string | null) => {
    setNotFoundEmail(prefillEmail);
    setStubEmail(prefillEmail ?? "");
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", "new");
    router.push(`/konto/partner/instruktorzy/create?${params.toString()}`, { scroll: false });
  };

  // Live lookup, debounced — read-only, never sends an invite (instructors-clients §3).
  useEffect(() => {
    if (step !== "identify") return;
    if (!isValidEmail(email)) {
      setLookup(null);
      return;
    }
    setIsLookingUp(true);
    const handle = setTimeout(() => {
      axiosInstance
        .get<InstructorLookupResponse>("/instructors/lookup", { params: { email } })
        .then(({ data }) => {
          setLookup(data);
          if (data.found === "none") {
            goToStubStep(email);
          }
        })
        .catch(() => setLookup(null))
        .finally(() => setIsLookingUp(false));
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, step]);

  async function handleInvite() {
    if (!studio || !lookup) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post<InstructorResolveResponse>("/instructors/resolve", {
        email,
        studio_id: studio.id,
      });
      toast({
        description:
          lookup.claim_status === "claimed"
            ? "Instruktor dodany do studia."
            : "Zaproszenie do studia wysłane.",
      });
      router.push("/konto/partner/instruktorzy");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ description: detail || "Nie udało się dodać instruktora.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStubSubmit() {
    if (!studio || !stubName.trim()) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post<InstructorResolveResponse>("/instructors/resolve", {
        name: stubName.trim(),
        email: stubEmail.trim() || undefined,
        image_id: stubImageId || undefined,
        studio_id: studio.id,
      });
      toast({
        description: stubEmail.trim()
          ? "Instruktor dodany, zaproszenie wysłane."
          : "Instruktor dodany do studia.",
      });
      router.push("/konto/partner/instruktorzy");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ description: detail || "Nie udało się dodać instruktora.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageSelect(file: File) {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await axiosInstance.post<{ image_id: string }>(
        "/instructors/image-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setStubImageId(data.image_id);
    } catch {
      toast({ description: "Nie udało się przesłać zdjęcia.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  }

  if (step === "new") {
    return (
      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {notFoundEmail && (
          <InfoNote icon={<Mail size={15} />}>
            Brak konta z adresem <span className="font-semibold">{notFoundEmail}</span>. Utworzymy
            profil i wyślemy zaproszenie do jego przejęcia.
          </InfoNote>
        )}

        <div className="flex justify-center">
          <SingleImageUpload
            existingImageId={stubImageId}
            isUploading={isUploadingImage}
            onRemove={() => setStubImageId(null)}
            onFileSelect={handleImageSelect}
            previewClassName="h-24 w-24 rounded-full"
            placeholderClassName="rounded-full md:w-24 md:h-24"
          />
        </div>
        <p className="-mt-3 text-center text-xs text-gray-400">Dodaj zdjęcie (opcjonalnie)</p>

        <div className="space-y-2">
          <Label htmlFor="stub-name">Imię i nazwisko</Label>
          <Input
            id="stub-name"
            value={stubName}
            onChange={(e) => setStubName(e.target.value)}
            placeholder="np. Marta Wiśniewska"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stub-email">Email</Label>
          <Input
            id="stub-email"
            type="email"
            value={stubEmail}
            onChange={(e) => setStubEmail(e.target.value)}
            placeholder="instruktor@example.com"
          />
        </div>

        <Button
          variant="green"
          className="w-full"
          disabled={!stubName.trim() || isSubmitting}
          onClick={handleStubSubmit}
        >
          {isSubmitting
            ? "Dodaję..."
            : stubEmail.trim()
              ? "Dodaj i wyślij zaproszenie"
              : "Dodaj instruktora"}
        </Button>

        {stubEmail.trim() && (
          <p className="text-center text-xs text-gray-400 leading-relaxed">
            Do czasu przejęcia profilu przez {stubName.trim().split(" ")[0] || "instruktora"} możesz
            uzupełniać i edytować wszystkie jego dane.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="lookup-email">Email instruktora</Label>
        <Input
          id="lookup-email"
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="instruktor@example.com"
        />
      </div>

      {isLookingUp && <p className="px-1 text-xs text-gray-400">Sprawdzam...</p>}

      {lookup && lookup.found !== "none" && (
        <div className="space-y-3">
          <p className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Znaleziono na joga.yoga
          </p>

          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5">
            {lookup.found === "instructor" ? (
              lookup.image_id ? (
                <WyImage
                  src={lookup.image_id}
                  alt={lookup.name ?? ""}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {(lookup.name ?? "?").charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Mail size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {lookup.found === "instructor" ? (
                <>
                  <p className="truncate text-sm font-semibold text-gray-900">{lookup.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[...lookup.styles, lookup.slug ? `joga.yoga/i/${lookup.slug}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <>
                  <p className="truncate text-sm font-semibold text-gray-900">{email}</p>
                  <p className="truncate text-xs text-gray-500">Bez profilu instruktora</p>
                </>
              )}
            </div>
          </div>

          <Button variant="green" className="w-full" disabled={isSubmitting} onClick={handleInvite}>
            {isSubmitting
              ? "Wysyłam..."
              : lookup.claim_status === "claimed"
                ? "Dodaj do studia"
                : "Wyślij zaproszenie do studia"}
          </Button>

          <p className="text-center text-xs text-gray-400 leading-relaxed">
            {lookup.found === "instructor"
              ? // R3 writes "jej … ją" because it happens to draw a woman. The lookup
                // payload has no gender, so the copy avoids needing one.
                "Połączymy istniejący profil ze studiem. Możesz od razu przypisywać tę osobę do zajęć."
              : "Ten adres ma już konto na joga.yoga — zaprosimy je do stworzenia profilu instruktora."}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs text-gray-400">albo</span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      <Button variant="outline" className="w-full" onClick={() => goToStubStep(null)}>
        Dodaj bez zaproszenia (bez emaila)
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legacy, non-studio-scoped add flow — predates T10. Still the target of the
// header-avatar "Utwórz profil instruktora" placeholder (T08) and Oferta's
// instructor panel, both of which link here without `studioId`. Writes to the
// back-office `partner_instructors` index via `/instructors/resolve` (no `studio_id`),
// unchanged from before T10.
// ---------------------------------------------------------------------------

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

function LegacyAddInstructorFlow() {
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

  const isMountedRef = useRef(false);
  useEffect(() => {
    if (isMountedRef.current) {
      setStep("identify");
      setPreview(null);
      setIsItsMe(false);
      form.reset({ email: "" });
    }
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      router.push(`/konto/partner/instruktorzy/${res.data.id}/edit`);
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
        router.push(`/konto/partner/instruktorzy/${res.data.instructor_id}/edit`);
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
                onClick={() =>
                  router.push(`/konto/partner/instruktorzy/${preview.instructor_id}/edit`)
                }
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
