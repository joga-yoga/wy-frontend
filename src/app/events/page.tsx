"use client"; // Add this line for client-side rendering

import axios from "axios"; // Import axios itself for isAxiosError
import { CalendarDays, DollarSign, Globe, Lightbulb, MapPin, Search } from "lucide-react";
import Image from "next/image"; // Import next/image
import Link from "next/link"; // Import Link from next/link
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button"; // Import shadcn Button
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Corrected import path for Card components
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance"; // Import axios instance

// Define the structure of an event based on the API response
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

// --- Updated Filters Component --- (Receives searchTerm and setSearchTerm)
interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Filters: React.FC<FiltersProps> = ({ searchTerm, setSearchTerm }) => {
  // Moved filter items here
  const filterItems = [
    { Icon: Globe, label: "All Locations" },
    { Icon: MapPin, label: "Poland" },
    { Icon: MapPin, label: "India" },
    { Icon: MapPin, label: "Other Map" },
    { Icon: MapPin, label: "Thailand" },
    { Icon: CalendarDays, label: "Date" },
    { Icon: DollarSign, label: "Price" },
    { Icon: Lightbulb, label: "Type" },
  ];

  return (
    // Use flex container to layout filters and search
    <div className="p-4 mb-2 bg-card flex flex-wrap items-center justify-center gap-4 md:gap-8">
      {/* Filter Icons Group */}
      <div className="flex items-center flex-wrap justify-center gap-2 border-r-0 md:border-r md:pr-6 md:mr-6">
        {filterItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            aria-label={item.label}
            className="text-muted-foreground hover:text-primary"
          >
            <item.Icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      {/* Search Bar Group - Uses props for state */}
      <div className="relative flex-grow w-full md:w-auto md:max-w-xs">
        <Input
          type="search"
          placeholder="Search events..." // Updated placeholder
          className="pl-8 w-full"
          value={searchTerm} // Controlled input
          onChange={(e) => setSearchTerm(e.target.value)} // Update state on change
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Refactored EventCard component using shadcn/ui Card
interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  console.log("🚀 ~ event:", event);
  const formatDateRange = (start: string, end: string) => {
    try {
      // Check if dates are valid strings before parsing
      if (!start || !end || typeof start !== "string" || typeof end !== "string") {
        console.warn("Invalid date strings provided:", start, end);
        return "Date N/A";
      }

      const startDateObj = new Date(start);
      const endDateObj = new Date(end);

      // Check if dates are valid after parsing
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        console.warn("Failed to parse date strings:", start, end);
        return "Invalid Date";
      }

      const startDate = startDateObj.toLocaleDateString("pl-PL", {
        month: "short",
        day: "numeric",
      });
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
        // Remove potential dot and normalize case
        const monthLower = month.toLowerCase().replace(".", "");
        return map[monthLower] || month; // Return original if no match (shouldn't happen with valid locale)
      };

      // Ensure endMonth is a string before processing
      const finalEndMonth = typeof endMonth === "string" ? polishAbbreviation(endMonth) : "";

      return `${startDate} - ${endDate} ${finalEndMonth}`;
    } catch (e) {
      console.error("Error formatting date range:", start, end, e);
      return "Date Error"; // More specific error message
    }
  };

  // Use event.country or fallback to start of event.location string
  const displayLocation = event.country || event.location?.split(",")[0] || "N/A";

  // Construct image URL using event.image_id
  const imageUrl = event.image_id
    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo"}/image/upload/${event.image_id}`
    : `https://via.placeholder.com/150?text=No+Image`;

  return (
    <Card className="flex flex-col md:flex-row overflow-hidden">
      <div className="relative w-full md:w-48 h-48 flex-shrink-0">
        {/* Fixed width for image container */}
        <Image
          src={imageUrl}
          alt={event.title || "Event image"}
          fill
          sizes="(max-width: 768px) 100vw, 192px"
          style={{ objectFit: "cover" }}
          className="rounded-t-lg md:rounded-l-lg md:rounded-t-none"
        />
      </div>
      <div className="flex-grow p-4 flex flex-col">
        <CardHeader className="p-0 pb-2">
          <div className="flex justify-between items-start mb-1">
            <div className="flex flex-wrap gap-2">
              {/* Use CalendarDays icon for date */}
              <span className="text-xs bg-gray-200 px-2 py-1 rounded inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />{" "}
                {formatDateRange(event.start_date, event.end_date)}
              </span>
              {/* Use MapPin icon for location */}
              <span className="text-xs bg-gray-200 px-2 py-1 rounded inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {displayLocation}
              </span>
            </div>
            <span className="text-xl cursor-pointer">⭐</span> {/* Favorite Icon */}
          </div>
          {/* Ensure CardTitle is always rendered, even if name is empty */}
          <CardTitle className="mt-1 text-lg font-semibold">
            {event.title || "Event Title Missing"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2 flex-grow">
          {/* Add check for description existence */}
          <CardDescription className="text-sm text-gray-600 line-clamp-3">
            {event.description || "No description available."}
          </CardDescription>
        </CardContent>
        <div className="flex justify-end items-center mt-auto pt-2">
          <span className="text-lg font-semibold">od {event.price} PLN</span>
        </div>
      </div>
    </Card>
  );
};

// Refactored EventsPage component
const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(""); // State for search input
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(""); // Debounced search term

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      clearTimeout(timerId); // Cleanup timeout on unmount or searchTerm change
    };
  }, [searchTerm]);

  // Fetch events based on debounced search term
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct API URL with search parameter if debounced term exists
        const params = new URLSearchParams();
        if (debouncedSearchTerm) {
          params.append("search", debouncedSearchTerm);
        }
        // Add pagination params if needed later (e.g., limit, skip)
        params.append("limit", "10"); // Keep default limit for now
        params.append("skip", "0"); // Start from first page on new search

        const apiUrl = `/events/public?${params.toString()}`;
        console.log(`Fetching events from: ${apiUrl}`); // Log API call
        const response = await axiosInstance.get(apiUrl);
        const responseData = response.data;

        // --- Data Processing Logic ---
        let processedEvents: Event[] = [];
        if (responseData && typeof responseData === "object" && Array.isArray(responseData.items)) {
          processedEvents = responseData.items.map((item: any) => ({
            // Map explicitly
            id: item.id,
            title: item.title,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            location: item.location,
            country: item.country,
            price: item.price,
            image_id: item.image_id,
          }));
          // Optionally handle total count for pagination later
          // const totalEvents = responseData.total;
        } else {
          console.warn("API response did not contain expected 'items' array:", responseData);
          // Don't set error here, just show no results or keep existing error state
          processedEvents = []; // Ensure events are cleared if response is invalid
        }

        setEvents(processedEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        if (axios.isAxiosError(err) && err.response) {
          console.error("Error Response Data:", err.response.data);
          console.error("Error Response Status:", err.response.status);
        }
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Failed to fetch events: ${errorMessage}. Please try again.`); // More user-friendly error
        setEvents([]); // Clear events on fetch error
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    // Run effect when debounced search term changes
  }, [debouncedSearchTerm]);

  return (
    <div className="container mx-auto px-4 pt-2 pb-8">
      {/* Use container for centering and padding */}
      <Filters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <main>
        {/* Removed the h2 for Events List, layout implies it */}
        {loading && <p className="text-center py-10">Loading events...</p>}
        {error && <p className="text-center text-red-600 py-10">Error: {error}</p>}
        {/* Display no results message */}
        {!loading && !error && events.length === 0 && (
          <p className="text-center py-10 text-gray-500">
            {debouncedSearchTerm
              ? `No events found for "${debouncedSearchTerm}".`
              : "No events found."}
          </p>
        )}
        {/* Render event cards - wrapped in Link */}
        {!loading && !error && events.length > 0 && (
          <div className="space-y-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} passHref legacyBehavior>
                {/* Apply cursor-pointer to the anchor for visual feedback */}
                <a className="block cursor-pointer">
                  <EventCard event={event} />
                </a>
              </Link>
            ))}
          </div>
        )}
        {/* "Load More" button - Consider disabling/hiding during search or implement pagination */}
        {!loading && events.length > 0 && (
          <div className="text-center mt-8">
            {/* TODO: Implement pagination logic or hide during search? */}
            <Button variant="default" size="lg">
              Pokaż więcej
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;
