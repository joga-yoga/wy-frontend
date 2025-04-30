"use client";

import axios from "axios"; // For error checking
import {
  Award,
  CalendarDays,
  CheckCircle,
  Clock3,
  DollarSign, // Add DollarSign
  Heart,
  Home,
  Info,
  Languages,
  MapPin,
  Phone,
  Share2,
  Star,
  Users,
  Utensils,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation"; // Hook to get route parameters
import React, { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
// Import UI components & Icons
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { axiosInstance } from "@/lib/axiosInstance";

// Define the full event structure based on API response
// Assuming Event is defined elsewhere or defined here if needed
interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  country: string;
  price: number;
  image_id?: string;
}

interface EventDetail extends Event {
  // Extend the list Event interface if needed
  // title: string; // Already in Event
  // description: string; // Already in Event
  // location: string; // Already in Event
  // start_date: string; // Already in Event
  // end_date: string; // Already in Event
  // image_id?: string; // Already in Event
  // price: number; // Already in Event
  // id: string; // Already in Event
  // country?: string; // Already in Event? Ensure consistency
  gallery_image_ids?: string[];
  is_public?: boolean;
  currency?: string;
  main_attractions?: string;
  language?: string;
  skill_level?: string;
  min_age?: number;
  max_age?: number;
  min_child_age?: number;
  activity_days?: number;
  itinerary?: string;
  included_trips?: string;
  food_description?: string;
  price_includes?: string;
  price_excludes?: string;
  accommodation_description?: string;
  guest_welcome_description?: string;
  paid_attractions?: string;
  spa_description?: string;
  cancellation_policy?: string;
  important_info?: string; // May not be public?
  organizer_id?: string;
  instructor_ids?: string[];
  // Add instructor details if populated by backend
  instructors?: { id: string; name: string; image_id?: string }[];
  // Add organizer details if populated by backend
  organizer?: { name: string; logo_image_id?: string; url?: string };
}

// Helper function to format multi-line text
const formatMultiLineText = (text: string | undefined | null): React.ReactNode => {
  if (!text) return null;
  return text.split("\n").map((line, index) => {
    // Simple check for list items (lines starting with '-')
    if (line.trim().startsWith("-")) {
      return (
        <li key={index} className="ml-4 list-disc">
          {line.trim().substring(1).trim()}
        </li>
      );
    }
    // Treat lines starting with dates as headers? (basic example)
    if (/^\d{2}\.\d{2}\.\d{4}/.test(line.trim())) {
      return (
        <p key={index} className="font-semibold mt-2">
          {line.trim()}
        </p>
      );
    }
    // Treat lines with times as schedule items? (basic example)
    if (/^\d{2}:\d{2}/.test(line.trim())) {
      return (
        <p key={index} className="ml-2 text-sm text-muted-foreground">
          {line.trim()}
        </p>
      );
    }
    // Otherwise, treat as a paragraph or part of one
    return (
      <p key={index} className="mb-1">
        {line.trim()}
      </p>
    ); // Add some margin between paragraphs
  });
};

// Helper function to format date range (reuse or import)
const formatDateRange = (start: string, end: string) => {
  try {
    if (!start || !end || typeof start !== "string" || typeof end !== "string") return "N/A";
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) return "Invalid Date";

    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const startDate = startDateObj.toLocaleDateString("pl-PL", options);
    const endDate = endDateObj.toLocaleDateString("pl-PL", { day: "numeric" }); // Only day for end date
    const endMonth = endDateObj.toLocaleDateString("pl-PL", { month: "short" });

    const polishAbbreviation = (month: string): string => {
      const map: { [key: string]: string } = {
        sty: "sty",
        lut: "lut",
        mar: "mar",
        kwi: "kwi",
        maj: "maj",
        cze: "cze",
        lip: "lip",
        sie: "sie",
        wrz: "wrz",
        paź: "paź",
        lis: "lis",
        gru: "gru",
      };
      const monthLower = month.toLowerCase().replace(".", "");
      return map[monthLower] || month;
    };
    const finalEndMonth = typeof endMonth === "string" ? polishAbbreviation(endMonth) : "";

    return `${startDate} - ${endDate} ${finalEndMonth}`; // e.g., "maj 23 - 25 maj"
  } catch (e) {
    console.error("Error formatting date range:", start, end, e);
    return "Date Error";
  }
};

// Helper to construct Cloudinary URL
const getImageUrl = (imageId: string | undefined, placeholderText: string = "Placeholder") => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  return imageId
    ? `https://res.cloudinary.com/${cloudName}/image/upload/${imageId}`
    : `https://via.placeholder.com/400x300?text=${encodeURIComponent(placeholderText)}`;
};

const EventDetailPage: React.FC = () => {
  const params = useParams();
  const eventId = params?.eventId as string; // Type assertion

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setError("Event ID not found in URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // --- IMPORTANT: Adjust this endpoint ---
        // Assumes a public endpoint exists. Change if auth is needed or URL is different.
        const apiUrl = `/events/${eventId}`;
        console.log(`Fetching event details from: ${apiUrl}`);
        // -----------------------------------------

        const response = await axiosInstance.get<EventDetail>(apiUrl);
        setEvent(response.data);
      } catch (err) {
        console.error("Failed to fetch event details:", err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            setError("Event not found.");
          } else {
            setError(
              `Failed to load event: ${err.response?.data?.detail || err.message}. Please try again.`,
            );
          }
          console.error("Error Response Data:", err.response?.data);
          console.error("Error Response Status:", err.response?.status);
        } else {
          setError("An unknown error occurred while fetching event details.");
        }
        setEvent(null); // Clear event data on error
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]); // Re-run effect if eventId changes

  if (loading) {
    return <div className="container mx-auto px-4 py-10 text-center">Loading event details...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-red-600">Error: {error}</div>
    );
  }

  if (!event) {
    // This case should ideally be covered by the 404 error handling, but good as a fallback
    return (
      <div className="container mx-auto px-4 py-10 text-center text-gray-500">
        Event details could not be loaded.
      </div>
    );
  }

  // --- Render the Event Detail Page ---
  const mainImageUrl = getImageUrl(event.image_id, "Event Image");
  // Mock gallery images if not provided by API
  const galleryImages = event.gallery_image_ids?.map((id) => getImageUrl(id)) || [
    getImageUrl(undefined, "Gallery 1"),
    getImageUrl(undefined, "Gallery 2"),
    getImageUrl(undefined, "Gallery 3"),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Top Section: Title, Actions, Images */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Favorite">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Main Image */}
          <div className="relative w-full h-64 md:h-96">
            <Image
              src={mainImageUrl}
              alt={event.title}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-lg"
            />
          </div>
          {/* Gallery Thumbnails */}
          <div className="grid grid-cols-2 gap-2">
            {galleryImages.slice(0, 4).map((imgUrl, index) => (
              <div key={index} className="relative w-full h-32 md:h-[11.75rem]">
                {" "}
                {/* Adjust height to fit */}
                <Image
                  src={imgUrl}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Intro Text Placeholder */}
          <section>
            <h2 className="text-xl font-semibold mb-3">
              Tam, gdzie kończy się codzienność, zaczyna się prawdziwa podróż
            </h2>
            <p className="text-muted-foreground">
              {/* Use event.description or a specific intro field if available */}
              {event.description || "Placeholder intro text about the event experience..."}
            </p>
          </section>

          {/* Dynamically Render Sections based on available data */}
          {event.itinerary && (
            <Section title="Harmonogram" icon={CalendarDays}>
              {formatMultiLineText(event.itinerary)}
            </Section>
          )}
          {event.accommodation_description && (
            <Section title="Nocleg" icon={Home}>
              {formatMultiLineText(event.accommodation_description)}
            </Section>
          )}
          {event.price_includes && (
            <Section title="Co jest wliczone w cenę" icon={CheckCircle} iconColor="text-green-600">
              {formatMultiLineText(event.price_includes)}
            </Section>
          )}
          {event.price_excludes && (
            <Section title="Co NIE jest wliczone w cenę" icon={XCircle} iconColor="text-red-600">
              {formatMultiLineText(event.price_excludes)}
            </Section>
          )}
          {event.included_trips && (
            <Section title="Wliczone wycieczki" icon={CheckCircle} iconColor="text-green-600">
              {formatMultiLineText(event.included_trips)}
            </Section>
          )}
          {event.paid_attractions && (
            <Section title="Dodatkowe atrakcje za dopłatą" icon={DollarSign}>
              {formatMultiLineText(event.paid_attractions)}
            </Section>
          )}
          {event.cancellation_policy && (
            <Section title="Zasady anulowania rezerwacji" icon={Info}>
              {formatMultiLineText(event.cancellation_policy)}
            </Section>
          )}
          {event.spa_description && (
            <Section title="Zabiegi spa" icon={Award}>
              {" "}
              {/* Using Award icon */}
              {formatMultiLineText(event.spa_description)}
            </Section>
          )}
          {/* Instructor Section - Placeholder */}
          <Section title="Prowadząca / Prowadzący" icon={Users}>
            {/* TODO: Replace with actual instructor data fetched/populated */}
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={getImageUrl(undefined, "I")} alt="Instructor" />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Paulina Kowalski</p>
                <p className="text-sm text-muted-foreground">Bartek Sapkowski</p>
                {/* Display fetched names here */}
                {/* {event.instructors ? event.instructors.map(inst => <p key={inst.id}>{inst.name}</p>) : <p>Instructor details unavailable.</p>} */}
              </div>
            </div>
          </Section>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Co Oferujemy Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Co oferujemy:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoItem icon={MapPin} text={event.location || "Location N/A"} />
              {/* Instructor Placeholder */}
              <InfoItem icon={Users} text="Paulina Kowalski, Bartek Sapkowski" />
              <InfoItem icon={Clock3} text={`${event.activity_days || "N/A"} dni`} />
              <InfoItem icon={Languages} text={event.language || "Polski"} />
            </CardContent>
          </Card>

          {/* Price & Date Box */}
          <Card className="bg-secondary text-secondary-foreground p-4 flex justify-between items-center">
            <div className="text-lg font-semibold">
              {event.price} {event.currency || "PLN"} / {event.activity_days || "N/A"} dni
            </div>
            <div className="text-right text-sm font-medium bg-primary text-primary-foreground px-2 py-1 rounded">
              {formatDateRange(event.start_date, event.end_date)}
            </div>
          </Card>

          {/* Included Features Box - Placeholder based on Design */}
          <Card>
            <CardHeader>{/* Optional: Add title if needed */}</CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoItem icon={Utensils} text="Vegetarian śniadanie, obiad, kolacja" />
              <InfoItem icon={Award} text="Sauna i masaże" /> {/* Placeholder */}
              <InfoItem icon={Home} text="Nocleg" />
              <InfoItem icon={Phone} text="570-278-387" /> {/* Placeholder */}
            </CardContent>
          </Card>

          {/* Lokalizacja Section */}
          <Section title="Lokalizacja" icon={MapPin}>
            {/* TODO: Replace with an actual map component if needed */}
            <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
              {/* Ensure the placeholder map image exists in /public */}
              <Image
                src="/placeholder-map.png"
                alt="Map placeholder"
                fill
                style={{ objectFit: "cover" }}
              />
              <p className="absolute bottom-2 left-2 bg-background/80 p-1 text-xs rounded">
                {event.location}
              </p>
            </div>
          </Section>

          {event.main_attractions && (
            <Section title="Najważniejsze atrakcje" icon={Star}>
              {formatMultiLineText(event.main_attractions)}
            </Section>
          )}

          {event.food_description && (
            <Section title="Wyżywienie" icon={Utensils}>
              {formatMultiLineText(event.food_description)}
            </Section>
          )}

          {event.guest_welcome_description && (
            <Section title="Powitanie gości" icon={Users}>
              {formatMultiLineText(event.guest_welcome_description)}
            </Section>
          )}
          {/* Organizer Section - Placeholder */}
          <Section title="Organizator" icon={Users}>
            <div className="flex items-center gap-4">
              {/* TODO: Fetch or populate organizer details */}
              <Avatar>
                <AvatarImage
                  src={getImageUrl(event.organizer?.logo_image_id, "O")}
                  alt={event.organizer?.name || "Organizer"}
                />
                <AvatarFallback>O</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{event.organizer?.name || "Organizer Name"}</p>
                {event.organizer?.url && (
                  <a
                    href={event.organizer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          </Section>
          {/* Consider adding 'Warto wiedzieć przed wyjazdem' if event.important_info is deemed public */}
        </div>
      </div>
    </div>
  );
};

// Helper component for sections
interface SectionProps {
  title: string;
  icon: React.ElementType; // Lucide icon component
  iconColor?: string; // Optional color class for icon
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon: Icon,
  children,
  iconColor = "text-primary",
}) => (
  <section>
    <div className={`flex items-center gap-2 mb-3 text-xl font-semibold ${iconColor}`}>
      <Icon className="h-5 w-5" />
      <h2>{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground space-y-2">{children}</div>
  </section>
);

// Helper component for info items in boxes
interface InfoItemProps {
  icon: React.ElementType;
  text: React.ReactNode;
}
const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, text }) => (
  <div className="flex items-start gap-2">
    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
    <span>{text}</span>
  </div>
);

export default EventDetailPage;
