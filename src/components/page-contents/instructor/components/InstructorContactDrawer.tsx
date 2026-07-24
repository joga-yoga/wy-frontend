"use client";

import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";

import { BookingDrawerShell } from "@/components/booking/BookingDrawerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

const FIELD_CLASS_NAME =
  "h-auto rounded-2xl border-[1.5px] border-gray-200 bg-white px-4 py-3 text-[15px] shadow-none focus-visible:border-gray-900 focus-visible:ring-0";

const FORM_ID = "instructor-contact-form";

type ContactState = "form" | "error" | "success";

interface InstructorContactDrawerProps {
  open: boolean;
  onClose: () => void;
  instructorId: string;
  instructorName: string;
}

export function InstructorContactDrawer({
  open,
  onClose,
  instructorId,
  instructorName,
}: InstructorContactDrawerProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<ContactState>("form");

  const resetState = () => {
    setState("form");
    setIsSubmitting(false);
    setEmail("");
    setPhone("");
    setMessage("");
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/utils/contact/instructor", {
        instructor_id: instructorId,
        email: email.trim(),
        contact_info: phone.trim() || undefined,
        message: message.trim(),
      });
      setState("success");
    } catch {
      setState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(email.trim() && message.trim());

  const header =
    state === "success"
      ? { title: "Wiadomość wysłana", subtitle: "Dziękujemy. Nauczyciel otrzyma Twoją wiadomość." }
      : state === "error"
        ? { title: "Nie udało się wysłać", subtitle: "Spróbuj ponownie za chwilę." }
        : {
            title: `Napisz do: ${instructorName}`,
            subtitle:
              "Wyślij wiadomość, aby dowiedzieć się więcej o współpracy z nauczycielem jogi.",
          };

  const footer =
    state === "success" ? (
      <Button className="w-full" style={{ background: "#4F8A62" }} size="cta" onClick={handleClose}>
        Zamknij
      </Button>
    ) : state === "error" ? (
      <div className="flex gap-2.5">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          size="cta"
          onClick={() => setState("form")}
        >
          Spróbuj ponownie
        </Button>
        <Button
          className="flex-1"
          style={{ background: "#4F8A62" }}
          size="cta"
          onClick={handleClose}
        >
          Zamknij
        </Button>
      </div>
    ) : (
      <Button
        type="submit"
        form={FORM_ID}
        className="w-full"
        style={canSubmit ? { background: "#4F8A62" } : undefined}
        variant={canSubmit ? undefined : "secondary"}
        size="cta"
        disabled={isSubmitting || !canSubmit}
      >
        {isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}
      </Button>
    );

  return (
    <BookingDrawerShell
      open={open}
      onClose={handleClose}
      title={header.title}
      subtitle={header.subtitle}
      footer={footer}
    >
      {state === "success" ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-700/10">
            <Check className="h-7 w-7 text-brand-green-700" />
          </div>
        </div>
      ) : state === "error" ? (
        <div className="py-4" />
      ) : (
        <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-3 pb-2 pt-1">
          <Input
            type="email"
            placeholder="Adres e-mail*"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={FIELD_CLASS_NAME}
            required
          />
          <Input
            type="tel"
            placeholder="Telefon (opcjonalnie)"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={FIELD_CLASS_NAME}
          />
          <Textarea
            placeholder="Twoja wiadomość*"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            className={cn(FIELD_CLASS_NAME, "resize-none")}
            required
          />
        </form>
      )}
    </BookingDrawerShell>
  );
}
