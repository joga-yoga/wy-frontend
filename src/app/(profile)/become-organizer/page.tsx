"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  verificationCode: z
    .string()
    .min(6, "Verification code is required")
    .max(6, "Verification code must be 6 digits"),
  image: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

export default function BecomeOrganizerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  console.log("🚀 ~ BecomeOrganizerPage ~ codeSent:", codeSent);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const phoneNumberValue = watch("phoneNumber");

  useEffect(() => {
    setCodeSent(false);
  }, [phoneNumberValue]);

  useEffect(() => {
    axiosInstance
      .get("/organizer/me")
      .then(() => {
        toast({ description: "You are already an organizer.", variant: "default" });
        router.push("/dashboard");
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast({
            title: "Error",
            description: "Could not verify organizer status. Please try again later.",
            variant: "destructive",
          });
        }
      });
  }, [router, toast]);

  async function handleSendCode() {
    const isValid = await trigger("phoneNumber");
    if (!isValid) {
      toast({ description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }

    setIsSendingCode(true);
    const formData = new FormData();
    formData.append("phone_number", phoneNumberValue);

    try {
      await axiosInstance.post("/organizer/send-verification-code", formData);
      setCodeSent(true);
      toast({ description: "Verification code sent to your phone." });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        "Failed to send verification code. Please check the number and try again.";
      setError("phoneNumber", { type: "manual", message: errorMsg });
      toast({ description: errorMsg, variant: "destructive" });
    } finally {
      setIsSendingCode(false);
    }
  }

  async function onSubmit(data: FormData) {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("phone_number", data.phoneNumber);
    formData.append("verification_code", data.verificationCode);
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.image?.[0]) {
      formData.append("image", data.image[0]);
    }

    try {
      await axiosInstance.post("/organizer", formData);
      toast({ description: "You are now an organizer! Redirecting..." });
      router.replace("/dashboard");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        "Failed to become an organizer. Please check your input and try again.";
      toast({ description: errorMsg, variant: "destructive" });
      if (errorMsg.toLowerCase().includes("verification code")) {
        setCodeSent(false);
        setError("verificationCode", { type: "manual", message: "Invalid code." });
      }
    }
  }
  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Become an Organizer</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Organizer Name *
          </label>
          <Input
            id="name"
            placeholder="Your organizer or company name"
            {...register("name")}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <Textarea
            id="description"
            placeholder="Tell us a bit about your organization"
            {...register("description")}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <div className="flex items-center space-x-2">
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="e.g., +14155552671"
              {...register("phoneNumber")}
              aria-invalid={errors.phoneNumber ? "true" : "false"}
              className="flex-grow"
            />
            <Button
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode || !phoneNumberValue || !!errors.phoneNumber}
              variant="outline"
              size="sm"
            >
              {isSendingCode ? "Sending..." : codeSent ? "Resend Code" : "Send Code"}
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
              Verification Code *
            </label>
            <Input
              id="verificationCode"
              placeholder="6-digit code"
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
            Logo / Image (optional)
          </label>
          <Input id="image" type="file" {...register("image")} accept="image/*" />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || isSendingCode}>
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}
