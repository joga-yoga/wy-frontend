"use client";

import { Calendar, MessageCircle, User } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
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

import { AboutSection } from "./components/AboutSection";
import { CalendarSection } from "./components/CalendarSection";
import { getInitials } from "./components/helpers";

interface Props {
  data: InstructorDetails;
}

function Divider() {
  return <div style={{ height: "1px", background: "#EBEBEB" }} />;
}

export function InstructorPageContent({ data }: Props) {
  const { instructor, upcoming_retreats, past_retreats, upcoming_workshops, past_workshops } = data;

  const heroRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const aboutSentinelRef = useRef<HTMLDivElement>(null);

  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [leftButtonMode, setLeftButtonMode] = useState<"about" | "calendar">("about");
  const [citiesExpanded, setCitiesExpanded] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState<"default" | "error" | "success">("default");

  const hasAbout = !!instructor.description;
  const totalUpcoming = upcoming_workshops.length + upcoming_retreats.length;
  const hasUpcoming = totalUpcoming > 0;

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setIsHeroVisible(entry.isIntersecting), {
      threshold: 0,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Observe zero-height sentinel at top of About section so "leaving upward" correctly
  // resets to "O mnie" even when the section is taller than the viewport.
  useEffect(() => {
    if (!hasAbout || !aboutSentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (hasUpcoming) {
          setLeftButtonMode(entry.isIntersecting ? "calendar" : "about");
        }
      },
      // Shrink root bottom by ~72px so the sentinel must clear the fixed bottom bar
      { threshold: 0, rootMargin: "0px 0px -72px 0px" },
    );
    obs.observe(aboutSentinelRef.current);
    return () => obs.disconnect();
  }, [hasAbout, hasUpcoming]);

  const cities = instructor.cities ?? [];
  const yogaStyles = instructor.yoga_styles ?? [];
  const displayCities = citiesExpanded ? cities : cities.slice(0, 2);
  const hiddenCitiesCount = cities.length - 2;
  const initials = getInitials(instructor.name);

  const scrollToAbout = () =>
    aboutSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToCalendar = () =>
    calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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
      scrollToCalendar();
    }
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
    <div style={{ backgroundColor: "#FFFFFF", color: "#222222" }} className="min-h-screen">
      {/* Main content */}
      <div className="container-wy mx-auto">
        {/* Hero */}
        <div ref={heroRef} className="px-4 pt-8 pb-6">
          <div className="flex items-start gap-4">
            <div
              className="relative h-[72px] w-[72px] rounded-full overflow-hidden flex-shrink-0"
              style={{ background: "#FEF3C7" }}
            >
              {instructor.image_id ? (
                <WyImage
                  src={instructor.image_id}
                  alt={instructor.name}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : (
                <span
                  className="absolute inset-0 flex items-center justify-center text-xl font-bold"
                  style={{ color: "#92400E" }}
                >
                  {initials}
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <h1 className="text-xl font-bold leading-tight" style={{ color: "#222222" }}>
                {instructor.name}
              </h1>

              {instructor.short_bio && (
                <p className="text-sm leading-snug" style={{ color: "#717171" }}>
                  {instructor.short_bio}
                </p>
              )}

              {yogaStyles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {yogaStyles.slice(0, 3).map((style) => {
                    const name = style.yoga_style?.name ?? style.custom_name ?? "";
                    if (!name) return null;
                    return (
                      <span
                        key={style.id}
                        className="text-xs px-2.5 py-0.5 rounded-full"
                        style={{
                          background: "#F7F7F7",
                          border: "1px solid #EBEBEB",
                          color: "#717171",
                        }}
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              )}

              {cities.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {displayCities.map((city, i) => (
                    <span key={city.place_id} className="text-sm" style={{ color: "#717171" }}>
                      {city.name}
                      {i < displayCities.length - 1 ? " ·" : ""}
                    </span>
                  ))}
                  {!citiesExpanded && hiddenCitiesCount > 0 && (
                    <button
                      onClick={() => setCitiesExpanded(true)}
                      className="text-sm font-medium underline underline-offset-2"
                      style={{ color: "#222222" }}
                    >
                      +{hiddenCitiesCount} więcej
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider />

        {/* scroll-mt-14 offsets the 56px sticky header when scrolled into view */}
        <div ref={calendarRef} className="scroll-mt-14">
          <CalendarSection
            upcomingWorkshops={upcoming_workshops}
            upcomingRetreats={upcoming_retreats}
            pastWorkshops={past_workshops}
            pastRetreats={past_retreats}
          />
        </div>

        {hasAbout && (
          <>
            <Divider />
            {/* Zero-height sentinel: observed for enter/leave to drive the left bottom button.
                scroll-mt-14 keeps the "O mnie" heading clear of the sticky header. */}
            <div ref={aboutSentinelRef} className="scroll-mt-14" />
            <AboutSection instructor={instructor} />
          </>
        )}

        {/* Bottom padding so last content clears the fixed bottom bar (~72px) */}
        <div className="h-24" />
      </div>

      {/* Fixed bottom bar — always visible */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t"
        style={{ borderColor: "#EBEBEB" }}
      >
        <div className="container-wy mx-auto px-4 py-3 flex gap-3">
          {hasAbout && (
            <button
              onClick={handleLeftButton}
              className="relative flex-1 h-12 rounded-xl text-sm font-semibold border overflow-hidden"
              style={{ borderColor: "#222222", color: "#222222", background: "#FFFFFF" }}
              aria-label={
                leftButtonMode === "about" ? "Przejdź do O mnie" : "Przejdź do Kalendarza"
              }
            >
              <span
                className="absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150"
                style={{ opacity: leftButtonMode === "about" ? 1 : 0 }}
              >
                <User className="h-4 w-4" />O mnie
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center gap-1.5 transition-opacity duration-150"
                style={{ opacity: leftButtonMode === "calendar" ? 1 : 0 }}
              >
                <Calendar className="h-4 w-4" />
                Kalendarz
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            aria-label={`Napisz do: ${instructor.name}`}
            className={`${hasAbout ? "flex-1" : "w-full"} h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold`}
            style={{ background: "#222222", color: "#FFFFFF" }}
          >
            <MessageCircle className="h-4 w-4" />
            Napisz do mnie
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
                  Wyślij wiadomość, aby dowiedzieć się więcej o współpracy z instruktorem.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Adres e-mail*"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="tel"
                  placeholder="Telefon (opcjonalnie)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Textarea
                  placeholder="Twoja wiadomość*"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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
                  Dziękujemy. Organizator otrzyma Twoją wiadomość.
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
