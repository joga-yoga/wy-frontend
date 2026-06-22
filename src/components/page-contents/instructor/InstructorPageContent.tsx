"use client";

import { CalendarDays, MapPin, MessageCircle, User } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import type { InstructorDetails } from "@/types/instructor";

import { CompletedItemsPreview } from "./components/CompletedItemsPreview";
import { InstructorClassesPreview } from "./components/InstructorClassesPreview";
import { InstructorEventSection } from "./components/InstructorEventSection";
import { InstructorHero } from "./components/InstructorHero";
import {
  AboutInstructor,
  InstructorCertificates,
  InstructorExperience,
  InstructorGallery,
  InstructorHighlights,
} from "./components/InstructorInfoSections";
import { buildInstructorProfileViewModel } from "./components/viewModel";

interface Props {
  data: InstructorDetails;
  draftNotice?: ReactNode;
  bottomPrimaryAction?: {
    label: string;
    href: string;
  };
}

function Divider() {
  return <div className="mx-4 h-px bg-[#EBEBEB] md:mx-8" />;
}


export function InstructorPageContent({ data, draftNotice, bottomPrimaryAction }: Props) {
  const profile = useMemo(() => buildInstructorProfileViewModel(data), [data]);

  const {
    instructor,
    upcoming_retreats,
    past_retreats,
    upcoming_workshops,
    past_workshops,
    upcoming_courses,
    past_courses,
  } = data;

  const classesRef = useRef<HTMLDivElement>(null);
  const aboutSentinelRef = useRef<HTMLDivElement>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [leftButtonMode, setLeftButtonMode] = useState<"about" | "classes">("about");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState<"default" | "error" | "success">("default");

  const hasAbout = !!instructor.description;
  const totalUpcoming =
    upcoming_workshops?.length + upcoming_retreats?.length + upcoming_courses?.length;
  const hasUpcoming = totalUpcoming > 0;

  useEffect(() => {
    const sentinel = aboutSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setLeftButtonMode(entry.isIntersecting ? "classes" : "about");
      },
      { threshold: 0, rootMargin: "0px 0px -72px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const scrollToAbout = () =>
    aboutSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToClasses = () =>
    classesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const resetContactModalState = () => {
    setModalState("default");
    setIsSubmitting(false);
    setEmail("");
    setPhone("");
    setMessage("");
  };

  const handleContactModalOpenChange = (open: boolean) => {
    setIsContactModalOpen(open);
    if (!open) {
      resetContactModalState();
    }
  };

  const handleLeftButton = () => {
    if (leftButtonMode === "about") {
      scrollToAbout();
    } else {
      scrollToClasses();
    }
  };

  const handlePrimaryAction = () => {
    if (bottomPrimaryAction?.href) {
      window.location.href = bottomPrimaryAction.href;
      return;
    }

    setIsContactModalOpen(true);
  };

  const handleContactSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setModalState("default");

    try {
      await axiosInstance.post("/utils/contact/instructor", {
        instructor_id: instructor.id,
        email: email.trim(),
        contact_info: phone.trim() || undefined,
        message: message.trim(),
      });
      setModalState("success");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      setModalState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <div className="container-wy mx-auto">
        <InstructorHero hero={profile.hero} />
        <InstructorHighlights highlights={profile.highlights} />
        <Divider />

        {draftNotice && (
          <>
            <div className="px-4 py-4 md:px-8">{draftNotice}</div>
            <Divider />
          </>
        )}

        <div ref={classesRef} className="scroll-mt-16">
          <InstructorClassesPreview items={profile.classesPreview} />
        </div>
        <Divider />

        <InstructorEventSection
          id="instructor-retreats-title"
          title="Wyjazdy"
          items={profile.retreats}
        />
        <Divider />

        <InstructorEventSection
          id="instructor-workshops-title"
          title="Wydarzenia"
          items={profile.workshops}
        />
        <Divider />

        <CompletedItemsPreview items={profile.completedPreview} />
        <Divider />

        <div ref={aboutSentinelRef} className="scroll-mt-16" />
        <AboutInstructor bio={profile.bio} />
        <Divider />

        <InstructorExperience items={profile.experienceItems} />
        <Divider />

        <InstructorCertificates certificates={profile.certificates} />
        <Divider />

        <InstructorGallery imageIds={profile.galleryImageIds} />

        <div className="h-24" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#EBEBEB] bg-white">
        <div className="container-wy mx-auto flex gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleLeftButton}
            className="relative h-12 flex-1 overflow-hidden rounded-xl border border-[#222222] bg-white text-sm font-semibold text-[#222222]"
            aria-label={leftButtonMode === "about" ? "Przejdź do O mnie" : "Przejdź do Zajęć"}
          >
            <span
              className="absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150"
              style={{ opacity: leftButtonMode === "about" ? 1 : 0 }}
            >
              <User className="h-4 w-4" />O mnie
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150"
              style={{ opacity: leftButtonMode === "classes" ? 1 : 0 }}
            >
              <CalendarDays className="h-4 w-4" />
              Zajęcia
            </span>
          </button>

          <button
            type="button"
            aria-label={bottomPrimaryAction?.label ?? `Napisz do: ${instructor.name}`}
            onClick={handlePrimaryAction}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#222222] text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            {bottomPrimaryAction?.label ?? "Napisz do mnie"}
          </button>
        </div>
      </div>

      <Dialog open={isContactModalOpen} onOpenChange={handleContactModalOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          {modalState === "default" && (
            <>
              <DialogHeader>
                <DialogTitle>Napisz do: {instructor.name}</DialogTitle>
                <DialogDescription>
                  Wyślij wiadomość, aby dowiedzieć się więcej o współpracy z nauczycielem jogi.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Adres e-mail*"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <Input
                  type="tel"
                  placeholder="Telefon (opcjonalnie)"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <Textarea
                  placeholder="Twoja wiadomość*"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !email.trim() || !message.trim()}
                >
                  {isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}
                </Button>
              </form>
            </>
          )}

          {modalState === "error" && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Nie udało się wysłać wiadomości</DialogTitle>
                <DialogDescription>Spróbuj ponownie za chwilę.</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setModalState("default")}>
                  Spróbuj ponownie
                </Button>
                <Button type="button" onClick={() => setIsContactModalOpen(false)}>
                  Zamknij
                </Button>
              </div>
            </div>
          )}

          {modalState === "success" && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Wiadomość została wysłana</DialogTitle>
                <DialogDescription>
                  Dziękujemy. Nauczyciel otrzyma Twoją wiadomość.
                </DialogDescription>
              </DialogHeader>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setIsContactModalOpen(false)}>
                  Zamknij
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
