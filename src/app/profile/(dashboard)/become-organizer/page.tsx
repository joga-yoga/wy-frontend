"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const schema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  phoneNumber: z.string().min(10, "Wymagany jest prawidłowy numer telefonu"),
  verificationCode: z
    .string()
    .min(6, "Kod weryfikacyjny jest wymagany")
    .max(6, "Kod weryfikacyjny musi mieć 6 cyfr"),
  image: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

export default function BecomeOrganizerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [highlightSendCodeButton, setHighlightSendCodeButton] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const phoneNumberValue = watch("phoneNumber");
  const imageFile = watch("image");

  useEffect(() => {
    setCodeSent(false);
    setHighlightSendCodeButton(false);
  }, [phoneNumberValue]);

  useEffect(() => {
    const file = imageFile?.[0];
    if (file instanceof File) {
      const newPreviewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(newPreviewUrl);
      return () => URL.revokeObjectURL(newPreviewUrl);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

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

  const handleImageSelected = useCallback(
    async (file: File) => {
      setIsUploadingImage(true);
      const imageFormData = new FormData();
      imageFormData.append("image", file);
      try {
        const response = await axiosInstance.post("/organizer/image-upload", imageFormData);
        setUploadedImageId(response.data.image_id);
        toast({ description: "Obraz został pomyślnie przesłany." });
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
    [toast, setValue],
  );

  useEffect(() => {
    const file = imageFile?.[0];
    if (file instanceof File) {
      handleImageSelected(file);
    } else {
      setUploadedImageId(null);
    }
  }, [imageFile, handleImageSelected]);

  async function handleSendCode() {
    const isValid = await trigger("phoneNumber");
    if (!isValid) {
      toast({ description: "Wprowadź prawidłowy numer telefonu.", variant: "destructive" });
      return;
    }

    setIsSendingCode(true);
    try {
      await axiosInstance.post("/organizer/send-verification-code", {
        phone_number: phoneNumberValue,
      });
      setCodeSent(true);
      setHighlightSendCodeButton(false);
      toast({ description: "Kod weryfikacyjny został wysłany na Twój telefon." });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        "Nie udało się wysłać kodu weryfikacyjnego. Sprawdź numer i spróbuj ponownie.";
      setError("phoneNumber", { type: "manual", message: errorMsg });
      toast({ description: errorMsg, variant: "destructive" });
    } finally {
      setIsSendingCode(false);
    }
  }

  async function onSubmit(data: FormData) {
    const payload: {
      name: string;
      description?: string;
      phone_number: string;
      verification_code: string;
      image_id?: string;
    } = {
      name: data.name,
      phone_number: data.phoneNumber,
      verification_code: data.verificationCode,
    };

    if (data.description) {
      payload.description = data.description;
    }
    if (uploadedImageId) {
      payload.image_id = uploadedImageId;
    } else if (data.image?.[0] && !uploadedImageId && !isUploadingImage) {
      toast({
        title: "Obraz nie został przesłany",
        description: "Poczekaj na przesłanie obrazu lub wyczyść zaznaczenie.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axiosInstance.post("/organizer", payload);
      toast({ description: "Jesteś teraz organizatorem! Przekierowywanie..." });
      router.replace(`${process.env.NEXT_PUBLIC_PROFILE_HOST}`);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        "Nie udało się zostać organizatorem. Sprawdź wprowadzone dane i spróbuj ponownie.";
      toast({ description: errorMsg, variant: "destructive" });
      if (errorMsg.toLowerCase().includes("verification code")) {
        setError("verificationCode", { type: "manual", message: "Nieprawidłowy lub wygasły kod." });
      }
      if (errorMsg.toLowerCase().includes("phone number is already associated")) {
        setError("phoneNumber", {
          type: "manual",
          message: "Ten numer telefonu jest już używany.",
        });
        setCodeSent(false);
      }
    }
  }

  const handleInvalidSubmit = (formErrors: typeof errors) => {
    const currentValues = getValues();
    if (
      currentValues.name &&
      currentValues.phoneNumber &&
      !codeSent &&
      formErrors.verificationCode &&
      !formErrors.name &&
      !formErrors.phoneNumber
    ) {
      toast({
        title: "Nie wysłano kodu weryfikacyjnego",
        description: "Najpierw wyślij kod weryfikacyjny na swój telefon.",
        variant: "destructive",
      });
      setHighlightSendCodeButton(true);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Zostań Organizatorem</h1>
      <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nazwa Organizatora *
          </label>
          <Input
            id="name"
            placeholder="Nazwa Twojego organizatora lub firmy"
            {...register("name")}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Opis (opcjonalnie)
          </label>
          <Textarea
            id="description"
            placeholder="Opowiedz nam trochę o swojej organizacji"
            {...register("description")}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Numer Telefonu *
          </label>
          <div className="flex items-center space-x-2">
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="np. +48123456789 (z kodem kraju)"
              {...register("phoneNumber")}
              aria-invalid={errors.phoneNumber ? "true" : "false"}
              className="flex-grow"
            />
            <Button
              type="button"
              onClick={handleSendCode}
              disabled={
                isSendingCode || !phoneNumberValue || !!errors.phoneNumber || isUploadingImage
              }
              variant="outline"
              size="sm"
              className={
                highlightSendCodeButton ? "border-2 border-brand-green animate-pulse-border" : ""
              }
            >
              {isSendingCode ? "Wysyłanie..." : codeSent ? "Wyślij kod ponownie" : "Wyślij Kod"}
            </Button>
          </div>
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
          )}
        </div>

        {codeSent && (
          <div>
            <label
              htmlFor="verificationCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kod Weryfikacyjny *
            </label>
            <Input
              id="verificationCode"
              placeholder="6-cyfrowy kod"
              {...register("verificationCode")}
              maxLength={6}
              aria-invalid={errors.verificationCode ? "true" : "false"}
            />
            {errors.verificationCode && (
              <p className="text-red-500 text-sm mt-1">{errors.verificationCode.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Logo / Obraz (opcjonalnie)
          </label>
          <Input
            id="image"
            type="file"
            {...register("image")}
            accept="image/*"
            disabled={isUploadingImage}
          />
          {isUploadingImage && <p className="text-sm text-blue-500 mt-1">Przesyłanie obrazu...</p>}
          {!isUploadingImage && uploadedImageId && (
            <p className="text-sm text-green-500 mt-1">Obraz został pomyślnie przesłany.</p>
          )}
          {imagePreviewUrl && (
            <div className="mt-2">
              <Image
                src={imagePreviewUrl}
                alt="Podgląd obrazu"
                width={100}
                height={100}
                className="rounded object-cover"
              />
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || isSendingCode || isUploadingImage}
        >
          {isSubmitting ? "Przesyłanie..." : "Złóż Wniosek"}
        </Button>
      </form>
    </div>
  );
}
