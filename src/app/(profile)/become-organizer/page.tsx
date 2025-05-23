"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const phoneNumberValue = watch("phoneNumber");
  const imageFile = watch("image");

  useEffect(() => {
    setCodeSent(false);
  }, [phoneNumberValue]);

  useEffect(() => {
    const file = imageFile?.[0];
    if (file instanceof File) {
      const currentPreviewUrl = imagePreviewUrl;
      const newPreviewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(newPreviewUrl);
      handleImageSelected(file);

      if (currentPreviewUrl && currentPreviewUrl !== newPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    } else {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(null);
      setUploadedImageId(null);
    }
  }, [imageFile]);

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

  async function handleImageSelected(file: File | undefined) {
    if (!file) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setUploadedImageId(null);
      return;
    }

    setIsUploadingImage(true);
    const imageFormData = new FormData();
    imageFormData.append("image", file);
    try {
      const response = await axiosInstance.post("/organizer/image-upload", imageFormData);
      setUploadedImageId(response.data.image_id);
      toast({ description: "Image uploaded successfully." });
    } catch (err: any) {
      setUploadedImageId(null);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(null);
      setValue("image", null);
      toast({
        title: "Image Upload Failed",
        description: err.response?.data?.detail || "Could not upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSendCode() {
    const isValid = await trigger("phoneNumber");
    if (!isValid) {
      toast({ description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }

    setIsSendingCode(true);
    try {
      await axiosInstance.post("/organizer/send-verification-code", {
        phone_number: phoneNumberValue,
      });
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
        title: "Image Not Uploaded",
        description: "Please wait for the image to upload or clear the selection.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axiosInstance.post("/organizer", payload);
      toast({ description: "You are now an organizer! Redirecting..." });
      router.replace("/dashboard");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        "Failed to become an organizer. Please check your input and try again.";
      toast({ description: errorMsg, variant: "destructive" });
      if (errorMsg.toLowerCase().includes("verification code")) {
        setError("verificationCode", { type: "manual", message: "Invalid or expired code." });
      }
      if (errorMsg.toLowerCase().includes("phone number is already associated")) {
        setError("phoneNumber", {
          type: "manual",
          message: "This phone number is already in use.",
        });
        setCodeSent(false);
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
              placeholder="e.g., +14155552671 (include country code)"
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
          <Input
            id="image"
            type="file"
            {...register("image")}
            accept="image/*"
            disabled={isUploadingImage}
          />
          {isUploadingImage && <p className="text-sm text-blue-500 mt-1">Uploading image...</p>}
          {!isUploadingImage && uploadedImageId && (
            <p className="text-sm text-green-500 mt-1">Image uploaded successfully.</p>
          )}
          {imagePreviewUrl && (
            <div className="mt-2">
              <Image
                src={imagePreviewUrl}
                alt="Image preview"
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
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}
