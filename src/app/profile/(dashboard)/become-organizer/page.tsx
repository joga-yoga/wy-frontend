"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const detailsSchema = z.object({
  name: z.string().trim().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  phoneNumber: z.string().trim().min(1, "Numer telefonu jest wymagany"),
  image: z.any().optional(),
  verificationCode: z.string().optional(),
});

type FormData = z.infer<typeof detailsSchema>;
type Step = "details" | "verification";

function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { normalized: null, error: "Numer telefonu jest wymagany." };
  }

  let sanitized = trimmed.replace(/[\s\-()]/g, "");
  if (sanitized.startsWith("00")) {
    sanitized = `+${sanitized.slice(2)}`;
  }

  if (sanitized.startsWith("+")) {
    if (!/^\+\d{8,15}$/.test(sanitized)) {
      return {
        normalized: null,
        error: "Podaj prawidłowy numer telefonu, np. +48 501 234 567.",
      };
    }

    return { normalized: sanitized, error: null };
  }

  const digitsOnly = sanitized.replace(/\D/g, "");

  if (/^\d{9}$/.test(digitsOnly)) {
    return { normalized: `+48${digitsOnly}`, error: null };
  }

  if (/^48\d{9}$/.test(digitsOnly)) {
    return { normalized: `+${digitsOnly}`, error: null };
  }

  return {
    normalized: null,
    error: "Podaj prawidłowy numer telefonu, np. 501 234 567 lub +48 501 234 567.",
  };
}

function validateVerificationCode(value?: string) {
  const code = (value ?? "").trim();

  if (!code) {
    return "Kod weryfikacyjny jest wymagany.";
  }

  if (!/^\d{6}$/.test(code)) {
    return "Kod weryfikacyjny musi mieć 6 cyfr.";
  }

  return null;
}

export default function BecomeOrganizerPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("details");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verificationPhoneNumber, setVerificationPhoneNumber] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const {
    control,
    register,
    trigger,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(detailsSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      phoneNumber: "",
      verificationCode: "",
      image: undefined,
    },
  });

  const imageFile = watch("image");
  const phoneNumberValue = watch("phoneNumber");

  useEffect(() => {
    axiosInstance
      .get("/organizer/me")
      .then(() => {
        toast({ description: "Jesteś już organizatorem.", variant: "default" });
        router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}`);
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast({
            title: "Błąd",
            description:
              "Nie udało się zweryfikować statusu organizatora. Spróbuj ponownie później.",
            variant: "destructive",
          });
        }
      });
  }, [router, toast]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      setIsUploadingImage(true);
      const imageFormData = new FormData();
      imageFormData.append("image", file);

      try {
        const response = await axiosInstance.post("/organizer/image-upload", imageFormData);
        setUploadedImageId(response.data.image_id);
        clearErrors("image");
        toast({ description: "Zdjęcie zostało przesłane pomyślnie." });
      } catch (err: any) {
        setUploadedImageId(null);
        setValue("image", null);
        toast({
          title: "Przesyłanie obrazu nie powiodło się",
          description:
            err.response?.data?.detail || "Nie udało się przesłać obrazu. Spróbuj ponownie.",
          variant: "destructive",
        });
      } finally {
        setIsUploadingImage(false);
      }
    },
    [clearErrors, setValue, toast],
  );

  useEffect(() => {
    const file = imageFile?.[0];

    if (file instanceof File) {
      const newPreview = URL.createObjectURL(file);
      setUploadedImageId(null);
      setImagePreviewUrl((currentPreview) => {
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview);
        }

        return newPreview;
      });
      handleImageUpload(file);
    } else {
      setImagePreviewUrl((currentPreview) => {
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview);
        }

        return null;
      });
      setUploadedImageId(null);
    }
  }, [handleImageUpload, imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (step === "verification") {
      const { normalized } = normalizePhoneNumber(phoneNumberValue ?? "");
      setVerificationPhoneNumber(normalized);
      return;
    }

    setValue("verificationCode", "");
    clearErrors("verificationCode");
  }, [clearErrors, phoneNumberValue, setValue, step]);

  function handleRemoveImage() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImagePreviewUrl(null);
    setUploadedImageId(null);
    setValue("image", null, { shouldDirty: true });
    setError("image", {
      type: "manual",
      message: "Dodaj zdjęcie organizatora, aby przejść do weryfikacji.",
    });
  }

  async function sendVerificationCode(normalizedPhoneNumber: string) {
    setIsSendingCode(true);

    try {
      await axiosInstance.post("/organizer/send-verification-code", {
        phone_number: normalizedPhoneNumber,
      });

      setVerificationPhoneNumber(normalizedPhoneNumber);
      toast({ description: "Kod weryfikacyjny został wysłany na Twój telefon." });
      return true;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        "Nie udało się wysłać kodu weryfikacyjnego. Sprawdź numer i spróbuj ponownie.";

      setError("phoneNumber", { type: "manual", message: errorMsg });
      toast({ description: errorMsg, variant: "destructive" });
      return false;
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleContinueToVerification(data: FormData) {
    clearErrors("phoneNumber");
    clearErrors("image");

    const isValid = await trigger(["name", "phoneNumber"]);
    if (!isValid) {
      return;
    }

    const phoneResult = normalizePhoneNumber(data.phoneNumber);
    if (!phoneResult.normalized) {
      setError("phoneNumber", { type: "manual", message: phoneResult.error ?? "Błędny numer." });
      return;
    }

    if (!imageFile?.[0] && !uploadedImageId) {
      setError("image", {
        type: "manual",
        message: "Dodaj zdjęcie organizatora, aby przejść do weryfikacji.",
      });
      return;
    }

    if (isUploadingImage || !uploadedImageId) {
      toast({
        title: "Poczekaj na zdjęcie",
        description: "Przesyłanie zdjęcia wciąż trwa. Spróbuj ponownie za chwilę.",
        variant: "destructive",
      });
      return;
    }

    const wasSent = await sendVerificationCode(phoneResult.normalized);
    if (!wasSent) {
      return;
    }

    setStep("verification");
  }

  async function handleResendCode() {
    const currentPhone = getValues("phoneNumber");
    const phoneResult = normalizePhoneNumber(currentPhone);

    if (!phoneResult.normalized) {
      setStep("details");
      setError("phoneNumber", {
        type: "manual",
        message: phoneResult.error ?? "Podaj prawidłowy numer telefonu.",
      });
      return;
    }

    await sendVerificationCode(phoneResult.normalized);
  }

  async function handleCreateOrganizer(data: FormData) {
    clearErrors("verificationCode");

    const verificationError = validateVerificationCode(data.verificationCode);
    if (verificationError) {
      setError("verificationCode", { type: "manual", message: verificationError });
      return;
    }

    const phoneResult = normalizePhoneNumber(data.phoneNumber);
    if (!phoneResult.normalized) {
      setStep("details");
      setError("phoneNumber", {
        type: "manual",
        message: phoneResult.error ?? "Podaj prawidłowy numer telefonu.",
      });
      return;
    }

    if (!uploadedImageId) {
      setStep("details");
      setError("image", {
        type: "manual",
        message: "Dodaj zdjęcie organizatora, aby zakończyć rejestrację.",
      });
      return;
    }

    try {
      await axiosInstance.post("/organizer", {
        name: data.name,
        description: data.description || undefined,
        phone_number: phoneResult.normalized,
        verification_code: data.verificationCode?.trim(),
        image_id: uploadedImageId,
      });

      toast({ description: "Jesteś teraz organizatorem! Przekierowywanie..." });
      router.replace(`${process.env.NEXT_PUBLIC_PROFILE_HOST}`);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        "Nie udało się zostać organizatorem. Sprawdź wprowadzone dane i spróbuj ponownie.";

      toast({ description: errorMsg, variant: "destructive" });

      if (errorMsg.toLowerCase().includes("verification code")) {
        setError("verificationCode", {
          type: "manual",
          message: "Nieprawidłowy lub wygasły kod.",
        });
      }

      if (errorMsg.toLowerCase().includes("phone number is already associated")) {
        setStep("details");
        setError("phoneNumber", {
          type: "manual",
          message: "Ten numer telefonu jest już używany.",
        });
      }
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {step === "details" ? "Krok 1 z 2" : "Krok 2 z 2"}
          </p>
          <h1 className="text-2xl font-bold text-center sm:text-left">Zostań organizatorem</h1>
          <p className="text-sm text-muted-foreground">
            {step === "details"
              ? "Uzupełnij dane organizatora i dodaj zdjęcie. Po tym wyślemy SMS z kodem weryfikacyjnym."
              : "Potwierdź numer telefonu kodem z SMS-a, aby dokończyć tworzenie profilu organizatora."}
          </p>
        </div>

        <form
          onSubmit={
            step === "details"
              ? handleSubmit(handleContinueToVerification)
              : handleSubmit(handleCreateOrganizer)
          }
          className="space-y-6"
        >
          {step === "details" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa organizatora *</Label>
                <Input
                  id="name"
                  placeholder="Nazwa Twojego organizatora lub firmy"
                  {...register("name")}
                  aria-invalid={errors.name ? "true" : "false"}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  placeholder="Opowiedz nam trochę o swojej organizacji"
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Numer telefonu *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="501 234 567 lub +48 501 234 567"
                  {...register("phoneNumber")}
                  aria-invalid={errors.phoneNumber ? "true" : "false"}
                />
                <p className="text-sm text-muted-foreground">
                  Domyślnie obsługujemy numery polskie. Możesz też wpisać numer międzynarodowy z
                  kodem kraju.
                </p>
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Zdjęcie organizatora *</Label>
                  <p className="text-sm text-muted-foreground">
                    Dodaj logo lub zdjęcie profilowe. Jest wymagane przed przejściem do weryfikacji.
                  </p>
                </div>
                <SingleImageUpload
                  name="image"
                  control={control}
                  imagePreviewUrl={imagePreviewUrl}
                  existingImageId={uploadedImageId}
                  isUploading={isUploadingImage}
                  onRemove={handleRemoveImage}
                  disabled={isSendingCode || isSubmitting}
                />
                {isUploadingImage && (
                  <p className="text-sm text-blue-500">Przesyłanie zdjęcia...</p>
                )}
                {!isUploadingImage && uploadedImageId && (
                  <p className="text-sm text-green-600">Zdjęcie zostało przesłane.</p>
                )}
                {errors.image && (
                  <p className="text-sm text-destructive">{String(errors.image.message ?? "")}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isSendingCode || isUploadingImage}
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wysyłanie kodu...
                  </>
                ) : (
                  "Przejdź do weryfikacji"
                )}
              </Button>
            </>
          )}

          {step === "verification" && (
            <>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Kod wysłaliśmy na numer</p>
                <p className="font-medium">{verificationPhoneNumber}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Kod weryfikacyjny *</Label>
                <Input
                  id="verificationCode"
                  placeholder="Wpisz 6-cyfrowy kod"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  {...register("verificationCode")}
                  aria-invalid={errors.verificationCode ? "true" : "false"}
                />
                {errors.verificationCode && (
                  <p className="text-sm text-destructive">{errors.verificationCode.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setStep("details")}
                  disabled={isSubmitting || isSendingCode}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zmień numer telefonu
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={handleResendCode}
                  disabled={isSubmitting || isSendingCode}
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wysyłanie...
                    </>
                  ) : (
                    "Wyślij kod ponownie"
                  )}
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isSendingCode || isUploadingImage}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  "Zostań organizatorem"
                )}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
