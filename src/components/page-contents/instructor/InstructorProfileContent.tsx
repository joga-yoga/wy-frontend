"use client";

import { MessageCircle, User } from "lucide-react";
import { type FormEvent, type ReactNode, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import type { InstructorDetails } from "@/types/instructor";

import { CompletedItemsPreview } from "./components/CompletedItemsPreview";
import { InstructorEventSection } from "./components/InstructorEventSection";
import { InstructorHero } from "./components/InstructorHero";
import {
  AboutInstructor,
  InstructorCertificates,
  InstructorExperience,
  InstructorGallery,
  InstructorHighlights,
} from "./components/InstructorInfoSections";
import type { InstructorProfileSection, InstructorProfileViewModel } from "./components/viewModel";

export type InstructorBottomAction = {
  label: string;
  href: string;
  hideIcon?: boolean;
};

interface InstructorProfileContentProps {
  data: InstructorDetails;
  profile: InstructorProfileViewModel;
  notice?: ReactNode;
  bottomPrimaryAction?: InstructorBottomAction;
  sampleSections?: Partial<Record<InstructorProfileSection, true>>;
}

function ContentSeparator() {
  return <Separator className="w-auto" />;
}

function SampleDataMarker() {
  return (
    <div className="px-4 pt-4 md:px-8">
      <Badge variant="outline">Dane przykładowe</Badge>
    </div>
  );
}

export function InstructorProfileContent({
  data,
  profile,
  notice,
  bottomPrimaryAction,
  sampleSections = {},
}: InstructorProfileContentProps) {
  const aboutRef = useRef<HTMLDivElement>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState<"default" | "error" | "success">("default");

  const { instructor } = data;
  const hasAbout = Boolean(profile.bio);
  const hasRetreats = profile.retreats.length > 0;
  const hasWorkshops = profile.workshops.length > 0;
  const hasCompletedItems = profile.completedItems.length > 0;
  const hasExperience = profile.experienceItems.length > 0;
  const hasCertificates = profile.certificates.length > 0;
  const hasGallery = profile.galleryImageIds.length > 0;

  const resetContactModalState = () => {
    setModalState("default");
    setIsSubmitting(false);
    setEmail("");
    setPhone("");
    setMessage("");
  };

  const handleContactModalOpenChange = (open: boolean) => {
    setIsContactModalOpen(open);
    if (!open) resetContactModalState();
  };

  const handlePrimaryAction = () => {
    if (bottomPrimaryAction) {
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
    } catch {
      setModalState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <div className="container-wy mx-auto">
        {sampleSections.hero && <SampleDataMarker />}
        <InstructorHero hero={profile.hero} />

        {profile.highlights.length > 0 && (
          <>
            {sampleSections.highlights && <SampleDataMarker />}
            <InstructorHighlights highlights={profile.highlights} />
          </>
        )}
        <ContentSeparator />

        {notice && (
          <>
            <div className="px-4 py-4 md:px-8">{notice}</div>
            <ContentSeparator />
          </>
        )}

        {hasRetreats && (
          <>
            {sampleSections.retreats && <SampleDataMarker />}
            <InstructorEventSection
              id="instructor-retreats-title"
              title="Wyjazdy"
              items={profile.retreats}
            />
            <ContentSeparator />
          </>
        )}

        {hasWorkshops && (
          <>
            {sampleSections.workshops && <SampleDataMarker />}
            <InstructorEventSection
              id="instructor-workshops-title"
              title="Wydarzenia"
              items={profile.workshops}
            />
            <ContentSeparator />
          </>
        )}

        {hasCompletedItems && (
          <>
            {sampleSections.completed && <SampleDataMarker />}
            <CompletedItemsPreview items={profile.completedItems} />
            <ContentSeparator />
          </>
        )}

        {hasAbout && (
          <>
            <div ref={aboutRef} className="scroll-mt-16" />
            {sampleSections.about && <SampleDataMarker />}
            <AboutInstructor bio={profile.bio!} />
            <ContentSeparator />
          </>
        )}

        {hasExperience && (
          <>
            {sampleSections.experience && <SampleDataMarker />}
            <InstructorExperience items={profile.experienceItems} />
            <ContentSeparator />
          </>
        )}

        {hasCertificates && (
          <>
            {sampleSections.certificates && <SampleDataMarker />}
            <InstructorCertificates certificates={profile.certificates} />
            <ContentSeparator />
          </>
        )}

        {hasGallery && (
          <>
            {sampleSections.gallery && <SampleDataMarker />}
            <InstructorGallery imageIds={profile.galleryImageIds} />
          </>
        )}

        <div className="h-24" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#EBEBEB] bg-white">
        <div className="container-wy mx-auto flex gap-3 px-4 py-3">
          {hasAbout && (
            <button
              type="button"
              onClick={() =>
                aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#222222] bg-white text-sm font-semibold text-[#222222]"
              aria-label="Przejdź do O mnie"
            >
              <User data-icon="inline-start" size={16} /> O mnie
            </button>
          )}

          <button
            type="button"
            aria-label={bottomPrimaryAction?.label ?? `Napisz do: ${instructor.name}`}
            onClick={handlePrimaryAction}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#222222] text-sm font-semibold text-white"
          >
            {!bottomPrimaryAction?.hideIcon && <MessageCircle size={16} data-icon="inline-start" />}
            {bottomPrimaryAction?.label ?? "Napisz do mnie"}
          </button>
        </div>
      </div>

      {!bottomPrimaryAction && (
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

                <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-4">
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
      )}
    </div>
  );
}
