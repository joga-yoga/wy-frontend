"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";

import { EventDetail } from "../types";

interface ReservationModalProps {
  event: EventDetail;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: "retreats" | "workshops";
}

interface BookingFormData {
  fullName: string;
  email: string;
  preferredContact: string;
  customerNote?: string;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export const ReservationModal: React.FC<ReservationModalProps> = ({
  event,
  isOpen,
  onOpenChange,
  project,
}) => {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<BookingFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      preferredContact: "",
      customerNote: "",
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    try {
      setSubmitState("loading");
      setErrorMessage("");

      const response = await axiosInstance.post("/orders", {
        event_id: event.id,
        email: data.email,
        preferred_contact: data.preferredContact,
        customer_name: data.fullName,
        customer_note: `${data.customerNote || "Brak uwag"}`,
      });

      setSubmitState("success");
      form.reset();

      // Close modal after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setSubmitState("idle");
      }, 2000);
    } catch (error: any) {
      setSubmitState("error");
      const errorMsg = error?.response?.data?.detail || "Coś poszło nie tak. Spróbuj ponownie.";
      setErrorMessage(errorMsg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {project === "retreats"
              ? "Kontakt w sprawie wyjazdu 🏕️"
              : "Kontakt w sprawie wydarzenia 🧘‍♀️"}
          </DialogTitle>
          <p className="text-center text-sm text-gray-600 mt-2">
            Wypełnij krótki formularz
          </p>
        </DialogHeader>

        {submitState === "success" && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-green-800 font-medium text-center">
              ✓ Dziękujemy! Twoja rezerwacja została przyjęta. Niedługo się do Ciebie odezwiemy!
            </p>
          </div>
        )}

        {submitState === "error" && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-800 font-medium text-center">{errorMessage}</p>
          </div>
        )}

        {submitState !== "success" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                rules={{ required: "Imię i nazwisko są wymagane" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imię i nazwisko</FormLabel>
                    <FormControl>
                      <Input placeholder="Małgorzata Kowalski" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email jest wymagany",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Podaj prawidłowy email",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twój adres e‑mail do kontaktu</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="gosia@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preferred Contact */}
              <FormField
                control={form.control}
                name="preferredContact"
                rules={{ required: "Preferowany kontakt jest wymagany" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferowany kontakt</FormLabel>
                    <FormControl>
                      <Input placeholder="Numer telefonu lub inny sposób kontaktu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Note / Questions */}
              <FormField
                control={form.control}
                name="customerNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pytania lub uwagi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Napisz wiadomość do organizatora (wstępna rezerwacja, pytania, uwagi)"
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitState === "loading"}
                className="w-full"
                size="cta"
                variant="cta"
              >
                {submitState === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  "Rezerwacja"
                )}
              </Button>

              {/* Privacy Policy Consent */}

              <p className="text-center text-sm text-gray-600">
                Twoja wiadomość trafi do organizatora, który potwierdzi rezerwację. 
              </p>
              <p className="text-center text-sm text-gray-600">
                Klikając przycisk &quot;Rezerwacja&quot;, wyrażasz zgodę na przetwarzanie swoich
                danych osobowych w celu realizacji rezerwacji, zgodnie z{" "}
                <Link href="/policy" className="underline">
                  Polityką prywatności
                </Link>
              </p>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
