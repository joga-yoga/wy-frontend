"use client";

import { Calendar, MapPin, MessageCircle, User } from "lucide-react";
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

function StylePills({ yogaStyles }: { yogaStyles: Props["data"]["instructor"]["yoga_styles"] }) {
  return (
    <>
      {yogaStyles.slice(0, 4).map((style) => {
        const name = style.yoga_style?.name ?? style.custom_name ?? "";
        if (!name) return null;
        return (
          <span
            key={style.id}
            className="text-[13px] font-medium px-3 py-1 rounded-full"
            style={{ background: "#F7F7F7", border: "1px solid #D9D9D9", color: "#444444" }}
          >
            {name}
          </span>
        );
      })}
      {yogaStyles.length > 4 && (
        <span
          className="text-[13px] font-medium px-3 py-1 rounded-full"
          style={{ background: "#F7F7F7", border: "1px solid #D9D9D9", color: "#B0B0B0" }}
        >
          +{yogaStyles.length - 4}
        </span>
      )}
    </>
  );
}

function CitiesRow({
  cities,
  displayCities,
  hiddenCitiesCount,
  citiesExpanded,
  onExpand,
}: {
  cities: { place_id: string; name: string }[];
  displayCities: { place_id: string; name: string }[];
  hiddenCitiesCount: number;
  citiesExpanded: boolean;
  onExpand: () => void;
}) {
  if (cities.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "#B0B0B0" }} />
      {displayCities.map((city, i) => (
        <span key={city.place_id} className="text-sm" style={{ color: "#717171" }}>
          {city.name}
          {i < displayCities.length - 1 ? " ·" : ""}
        </span>
      ))}
      {!citiesExpanded && hiddenCitiesCount > 0 && (
        <button
          onClick={onExpand}
          className="text-sm font-medium underline underline-offset-2"
          style={{ color: "#222222" }}
        >
          +{hiddenCitiesCount} więcej
        </button>
      )}
    </div>
  );
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
      <div className="container-wy mx-auto">
        {/* Hero */}
        <div ref={heroRef} className="px-4 pt-4 pb-6 space-y-4">
          {/* Avatar + name row */}
          <div className="flex items-center gap-4">
            <div
              className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0"
              style={{ background: "#FEF3C7" }}
            >
              {instructor.image_id ? (
                <WyImage
                  src={instructor.image_id}
                  alt={instructor.name}
                  fill
                  className="object-cover"
                  sizes="64px"
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
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: "#222222" }}>
                {instructor.name}
              </h1>
              {instructor.short_bio && (
                <p className="text-sm mt-1 leading-snug" style={{ color: "#717171" }}>
                  {instructor.short_bio}
                </p>
              )}
            </div>
          </div>

          {/* Styles + cities — full width below */}
          {yogaStyles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <StylePills yogaStyles={yogaStyles} />
            </div>
          )}
          <CitiesRow
            cities={cities}
            displayCities={displayCities}
            hiddenCitiesCount={hiddenCitiesCount}
            citiesExpanded={citiesExpanded}
            onExpand={() => setCitiesExpanded(true)}
          />
        </div>

        <Divider />

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
            <div ref={aboutSentinelRef} className="scroll-mt-14" />
            <AboutSection instructor={instructor} />
          </>
        )}

        <div className="h-24" />
      </div>

      {/* Fixed bottom bar */}
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
