"use client";

import type { AxiosError } from "axios";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { GeneratedInstructorProfileDraft } from "@/types/instructor";

type CreateProfileStep = "welcome" | "input" | "loading";
type GenerateDraftErrorResponse = {
  detail?:
    | {
        code?: string;
        message?: string;
      }
    | string;
};

const rotatingStatuses = [
  "Sprawdzamy źródła publiczne",
  "To może zająć około 2 min. 🙏",
  "Szukamy zdjęć",
  "Tworzymy przykładową stronę",
];

export function CreateProfileFlow() {
  const router = useRouter();
  const [step, setStep] = useState<CreateProfileStep>("welcome");
  const [profileQuery, setProfileQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const desktopLead = useMemo(() => {
    if (step === "welcome") {
      return {
        eyebrow: "joga.yoga create",
        title: "Profil nauczyciela jogi bez długiej ankiety",
        copy: "Zacznij od jednego kliknięcia. Potem wystarczy imię, nazwisko albo link do publicznego profilu.",
      };
    }

    if (step === "input") {
      return {
        eyebrow: "minimalny start",
        title: "Jedno pole zamiast formularza",
        copy: "Podaj imię, nazwisko albo link. Na tej podstawie przygotujemy szkic strony nauczyciela jogi.",
      };
    }

    return {
      eyebrow: "front preview",
      title: "Symulujemy proces tworzenia",
      copy: "Sprawdzamy publiczne źródła, składamy opis i przygotowujemy podgląd strony przed rejestracją.",
    };
  }, [step]);

  const goToInput = () => setStep("input");
  const generateDraft = async () => {
    const input = profileQuery.trim();
    if (!input || isGenerating) {
      setGenerationError("Podaj imię i nazwisko albo link do swojego profilu.");
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);
    setStep("loading");

    try {
      const { data } = await axiosInstance.post<GeneratedInstructorProfileDraft>(
        "/instructor-profile-drafts/generate",
        { input },
      );
      router.push(`/create/preview/${data.public_token}`);
    } catch (error) {
      setGenerationError(getGenerateDraftErrorMessage(error));
      setStep("input");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#f7f7f7] text-[#3f3f46]">
      <div className="mx-auto flex min-h-svh w-full max-w-[1200px] flex-col items-center justify-center gap-8 px-0 py-0 md:grid md:grid-cols-[minmax(0,1fr)_402px] md:gap-14 md:px-10 md:py-12">
        <section className="hidden md:flex min-h-[640px] flex-col justify-center">
          <p className="mb-4 text-[15px] font-medium uppercase tracking-[0.18em] text-[#71717a]">
            {desktopLead.eyebrow}
          </p>
          <h1 className="max-w-[560px] text-[56px] font-semibold leading-[0.98] text-[#52525b]">
            {desktopLead.title}
          </h1>
          <p className="mt-6 max-w-[460px] text-[22px] font-medium leading-[30px] text-[#71717a]">
            {desktopLead.copy}
          </p>

          <DesktopAnimation step={step} query={profileQuery} />
        </section>

        <section
          className="flex w-full justify-center md:block"
          aria-label="Generator profilu nauczyciela jogi"
        >
          <PhoneFrame>
            <AnimatePresence mode="wait">
              {step === "welcome" && <WelcomeStep key="welcome" onStart={goToInput} />}
              {step === "input" && (
                <InputStep
                  key="input"
                  value={profileQuery}
                  onChange={setProfileQuery}
                  onCreate={generateDraft}
                  isGenerating={isGenerating}
                  error={generationError}
                />
              )}
              {step === "loading" && <LoadingStep key="loading" />}
            </AnimatePresence>
          </PhoneFrame>
        </section>
      </div>
    </main>
  );
}

function getGenerateDraftErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<GenerateDraftErrorResponse>;
  const detail = axiosError.response?.data?.detail;

  if (
    axiosError.response?.status === 422 &&
    typeof detail === "object" &&
    detail?.code === "teacher_profile_not_found" &&
    detail.message
  ) {
    return detail.message;
  }

  return "Nie udało się przygotować profilu. Spróbuj ponownie.";
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh w-full max-w-[402px] border border-[#e4e4e7] bg-white md:min-h-[874px] md:rounded-[34px]">
      {children}
    </div>
  );
}

function StepShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
      className={cn("flex min-h-svh w-full flex-col md:min-h-[874px]", className)}
    >
      {children}
    </motion.div>
  );
}

function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <StepShell className="gap-9">
      <div className="flex h-[437px] w-full items-start justify-center rounded-2xl bg-[#fafafa] p-[18px]">
        <SquareWelcomeAnimation />
      </div>

      <div className="flex w-full flex-col items-center gap-9 px-[70px]">
        <div className="flex w-full flex-col items-center gap-[18px]">
          <h1 className="w-[294px] text-center text-[46px] font-semibold leading-[50px] text-[#52525b]">
            Skonfiguruj swój profil na joga.yoga
          </h1>
          <p className="w-[294px] text-center text-[22px] font-medium leading-[30px] text-[#71717a]">
            To zajmie tylko chwilę
          </p>
        </div>

        <Button
          type="button"
          onClick={onStart}
          className="h-11 w-[262px] rounded-lg bg-[#3f3f46] text-[20px] font-medium leading-[25px] text-white hover:bg-[#323238]"
        >
          Zacznij
        </Button>
      </div>
    </StepShell>
  );
}

function InputStep({
  value,
  onChange,
  onCreate,
  isGenerating,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  isGenerating: boolean;
  error: string | null;
}) {
  return (
    <StepShell>
      <div className="flex h-[358px] w-full flex-col items-center gap-9 rounded-2xl bg-white px-6 pb-9 pt-[66px]">
        <div className="h-[50px] w-full text-center text-[46px] font-semibold leading-[50px] text-[#27272a]">
          🙋
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <label className="sr-only" htmlFor="profile-query">
            Podaj imię i nazwisko albo link do swojego profilu
          </label>
          <Input
            id="profile-query"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="np. Anna Kowalska, @annajoga, link do META"
            className="h-16 w-full rounded-lg border-[#e4e4e7] px-[29px] text-[15px] font-normal leading-[18px] text-[#3f3f46] placeholder:text-[#d4d4d8] focus-visible:ring-[#52525b]/20"
            autoComplete="off"
          />
          <p className="w-full text-center text-[15px] font-medium leading-[18px] text-[#71717a]">
            Podaj imię i nazwisko albo link do swojego profilu
          </p>
          {error && (
            <p className="w-full text-center text-[13px] font-medium leading-[17px] text-red-600">
              {error}
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={onCreate}
          disabled={isGenerating}
          className="h-11 w-full rounded-lg bg-[#3f3f46] text-[20px] font-medium leading-[25px] text-white hover:bg-[#323238]"
        >
          {isGenerating ? "Tworzymy..." : "Stwórz profile na joga.yoga"}
        </Button>
      </div>
    </StepShell>
  );
}

function LoadingStep() {
  return (
    <StepShell>
      <div className="flex h-[577px] w-full flex-col items-center gap-9 rounded-2xl bg-white px-6 pb-9 pt-[66px]">
        <div className="h-[50px] w-full text-center text-[46px] font-semibold leading-[50px] text-[#27272a]">
          🙋
        </div>

        <div className="flex w-[294px] flex-col items-center gap-[18px]">
          <h1 className="w-[294px] text-center text-[46px] font-semibold leading-[50px] text-[#52525b]">
            Process tworzenia
          </h1>
          <AnimatedStatusText />
        </div>

        <GenerationAnimation />
      </div>
    </StepShell>
  );
}

function SquareWelcomeAnimation() {
  return (
    <div className="relative h-[366px] w-[366px] overflow-hidden bg-[#f4eeee]">
      <motion.div
        aria-hidden="true"
        className="absolute left-[78px] top-[76px] h-[190px] w-[190px] rounded-full border-[18px] border-[#dec7b7]"
        animate={{ rotate: [0, 8, -5, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute left-[122px] top-[88px] h-[42px] w-[42px] rounded-full bg-[#d3a78e]"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute left-[110px] top-[140px] h-[34px] w-[116px] rounded-full bg-[#cfa48c]"
        animate={{ rotate: [-8, -14, -8] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[68px] left-[74px] h-[28px] w-[218px] rounded-full bg-[#c4bba6]"
        animate={{ x: [-5, 5, -5] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[90px] left-[138px] h-[22px] w-[156px] rounded-full bg-[#b7ac92]"
        animate={{ rotate: [0, 3, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function GenerationAnimation() {
  return (
    <div className="relative h-[210px] w-[310px] overflow-hidden bg-[#efeff1]">
      <motion.div
        className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
        animate={{ x: [-320, 320] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute left-5 top-5 h-[170px] w-[78px] rounded-md bg-white shadow-sm" />
      <div className="absolute left-[112px] top-6 h-9 w-[168px] rounded bg-[#d5d5dc]" />
      <div className="absolute left-[112px] top-[76px] h-[18px] w-[138px] rounded bg-[#c7c7cf]" />
      <div className="absolute left-[112px] top-[108px] h-[18px] w-[168px] rounded bg-[#dcdce1]" />
      <div className="absolute left-[112px] top-[142px] h-[52px] w-[168px] rounded bg-white" />
      <motion.div
        aria-hidden="true"
        className="absolute left-[38px] top-[44px] h-9 w-9 rounded-full bg-[#8f9c8a]"
        animate={{ scale: [1, 1.12, 1], opacity: [0.78, 1, 0.78] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function DesktopAnimation({ step, query }: { step: CreateProfileStep; query: string }) {
  return (
    <div className="mt-10 flex h-[360px] w-[360px] items-center justify-center rounded-[34px] border border-[#e4e4e7] bg-white p-6 shadow-sm">
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="desktop-welcome"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="scale-[0.82]"
          >
            <SquareWelcomeAnimation />
          </motion.div>
        )}
        {step === "input" && (
          <motion.div
            key="desktop-input"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="w-full space-y-4"
          >
            <div className="text-center text-[46px] leading-[50px]">🙋</div>
            <div className="rounded-2xl border border-[#e4e4e7] px-5 py-4 text-[17px] font-medium text-[#52525b]">
              {query || "Anna Kowalska, @annajoga"}
            </div>
            <p className="text-center text-[18px] font-medium leading-[22px] text-[#71717a]">
              Jedno pole wystarczy do startu
            </p>
          </motion.div>
        )}
        {step === "loading" && (
          <motion.div
            key="desktop-loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="scale-[1.02]"
          >
            <GenerationAnimation />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedStatusText() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % rotatingStatuses.length);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="relative h-[25px] w-[294px] overflow-hidden text-center text-[20px] font-medium leading-[25px] text-[#71717a]">
      <AnimatePresence mode="wait">
        <motion.p
          key={rotatingStatuses[statusIndex]}
          className="absolute inset-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
        >
          {rotatingStatuses[statusIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
