"use client";

import axios from "axios"; // For error checking
import {
  Award,
  CalendarDays,
  CheckCircle,
  Clock3,
  DollarSign,
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
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { axiosInstance } from "@/lib/axiosInstance";

const EventLeafletMap = dynamic(() => import("./EventLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
});

// Define the structure for the nested location object
interface LocationDetail {
  id: string;
  title: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
}

// Define the structure for an instructor in the event details
interface InstructorDetail {
  id: string;
  name: string;
  bio: string | null;
  image_id: string | null;
}

// Define the structure for the organizer in the event details
interface OrganizerDetail {
  id: string; // Assuming organizer has an ID, though schema might not show it at top level
  name: string;
  image_id: string | null;
  // Add other fields like url if available and needed
  // url: string | null;
}

// Define the event structure based on API response (schema.Event)
interface EventDetail {
  id: string;
  organizer: OrganizerDetail | null; // Updated to nested object
  instructors: InstructorDetail[] | null; // Updated to array of objects
  title: string;
  description: string | null;
  location: LocationDetail | null; // Updated to nested object
  start_date: string; // Date comes as string, needs formatting
  end_date: string | null; // Date comes as string, needs formatting
  image_id?: string | null;
  is_public: boolean;
  price: number | null;
  currency: string | null;
  main_attractions: string | null;
  language: string | null;
  skill_level: string | null;
  min_age: number | null;
  max_age: number | null;
  min_child_age: number | null;
  itinerary: string | null;
  included_trips: string | null;
  food_description: string | null;
  price_includes: string | null;
  price_excludes: string | null;
  accommodation_description: string | null;
  guest_welcome_description: string | null;
  paid_attractions: string | null;
  cancellation_policy: string | null;
  important_info: string | null;
  program: string[] | null; // Program is available

  // Removed nested objects as they are not in the schema.Event response
  // instructors?: { id: string; name: string; image_id?: string }[];
  // organizer?: { name: string; logo_image_id?: string; url?: string };
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
const formatDateRange = (start: string | null, end: string | null) => {
  try {
    if (!start || !end || typeof start !== "string" || typeof end !== "string") return "N/A";
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) return "Invalid Date";

    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const startDate = startDateObj.toLocaleDateString("pl-PL", options);
    const endDate = endDateObj.toLocaleDateString("pl-PL", { day: "numeric" });
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

// Predefined Unsplash image URLs for fallbacks
const unsplashImageUrls = [
  "https://images.unsplash.com/photo-1505238680356-667803448bb6?auto=format&fit=crop&w=1170&q=80", // travel/outdoors
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1170&q=80", // concert/event
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1171&q=80", // people/workshop
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1170&q=80", // tech/conference
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1170&q=80", // presentation/meeting
];

// Helper to construct Image URL (Cloudinary or Unsplash fallback)
const getImageUrl = (
  imageId: string | undefined | null,
  unsplashIndex?: number, // Index for Unsplash fallback list
): string => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  if (imageId) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${imageId}`;
  }
  // Fallback to Unsplash
  const fallbackIndex = unsplashIndex !== undefined ? unsplashIndex % unsplashImageUrls.length : 0;
  return unsplashImageUrls[fallbackIndex];
};

const EventDetailPage: React.FC = () => {
  const params = useParams();
  const eventId = params?.eventId as string;

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
        // Endpoint remains the same, but the expected response type is updated
        const apiUrl = `/events/${eventId}`;
        console.log(`Fetching event details from: ${apiUrl}`);
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
  }, [eventId]);

  // const Map = useMemo(
  //   () =>
  //     dynamic(() => import("./Map"), {
  //       loading: () => <p>A map is loading</p>,
  //       ssr: false,
  //     }),
  //   [],
  // );

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
  const mainImageUrl = getImageUrl(event.image_id, 0); // Uses Unsplash[0] if no event.image_id

  // Gallery thumbnails - use subsequent Unsplash images
  // Indices 1, 2, 3, 4 from the unsplashImageUrls list
  const thumbnailUrls: string[] = [
    getImageUrl(undefined, 1),
    getImageUrl(undefined, 2),
    getImageUrl(undefined, 3),
    getImageUrl(undefined, 4),
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
            {thumbnailUrls.map((imgUrl, index) => (
              <div key={index} className="relative w-full h-32 md:h-[11.75rem]">
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
          {/* {event.price_includes && (
            <Section title="Co jest wliczone w cenę" icon={CheckCircle} iconColor="text-green-600">
              {formatMultiLineText(event.price_includes)}
            </Section>
          )} */}
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
          {event.program && event.program.length > 0 && (
            <Section title="Program dnia" icon={CalendarDays}>
              {event.program.map((dayDesc, index) => (
                <div key={index} className="mb-2">
                  <p className="font-semibold">Dzień {index + 1}:</p>
                  {formatMultiLineText(dayDesc)}
                </div>
              ))}
            </Section>
          )}
          {/* Instructor Section - Placeholder */}
          <Section title="Prowadzący" icon={Users}>
            {event.instructors && event.instructors.length > 0 ? (
              <div className="space-y-4">
                {event.instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-start gap-4 p-3 border rounded-lg bg-muted/30"
                  >
                    <Avatar className="h-16 w-16 text-lg">
                      <AvatarImage
                        src={getImageUrl(instructor.image_id, 0)}
                        alt={instructor.name}
                      />
                      <AvatarFallback>{instructor.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{instructor.name}</h3>
                      {instructor.bio && formatMultiLineText(instructor.bio)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Informacje o instruktorach nie zostały jeszcze podane.
              </p>
            )}
          </Section>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Co Oferujemy Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoItem
                icon={MapPin}
                text={
                  <>
                    {event.location?.title || event.location?.address_line1 || "N/A"}
                    {event.location?.country ? `, ${event.location.country}` : ""}
                  </>
                }
              />
              {event.instructors && event.instructors.length > 0 && (
                <InfoItem
                  icon={Users}
                  text={`${event.instructors.length} Instruktor${event.instructors.length > 1 ? "ów" : ""}`}
                />
              )}
              {/* Removed hardcoded duration/language - use actual data */}
              {/* <InfoItem icon={Clock3} text={`${event.activity_days || "N/A"} dni`} /> */}
              {event.language && <InfoItem icon={Languages} text={event.language} />}
              {event.skill_level && <InfoItem icon={Award} text={`Poziom: ${event.skill_level}`} />}
            </CardContent>
          </Card>

          {/* Price & Date Box */}
          <Card className="bg-secondary text-secondary-foreground p-4 flex justify-between items-center">
            <div className="text-lg font-semibold">
              {event.price
                ? `${event.price.toFixed(2)} ${event.currency || "PLN"}`
                : "Cena nie podana"}
              {/* Duration info could be calculated if needed */}
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

          {/* <NextjsMap /> */}
          {/* Lokalizacja Section */}
          <Section title="Lokalizacja" icon={MapPin}>
            {event.location?.latitude && event.location?.longitude ? (
              <EventLeafletMap
                latitude={event.location.latitude}
                longitude={event.location.longitude}
                title={event.title}
              />
            ) : (
              <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Mapa niedostępna (brak koordynatów)</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {event.location?.title || event.location?.address_line1}
              {event.location?.city ? `, ${event.location.city}` : ""}
              {event.location?.country ? `, ${event.location.country}` : ""}
            </p>
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
          {event.organizer && (
            <Section title="Organizator" icon={Users}>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src={getImageUrl(event.organizer.image_id, 1)} // Use a different Unsplash index if needed
                    alt={event.organizer.name}
                  />
                  <AvatarFallback>{event.organizer.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{event.organizer.name}</p>
                  {/* Add organizer URL if available and desired */}
                  {/* event.organizer.url && <a href={event.organizer.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Strona organizatora</a> */}
                </div>
              </div>
            </Section>
          )}
          {/* Consider adding 'Warto wiedzieć przed wyjazdem' if event.important_info is deemed public */}
          {event.important_info && (
            <Section title="Warto wiedzieć" icon={Info}>
              {formatMultiLineText(event.important_info)}
            </Section>
          )}
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
