"use client";

import axios from "axios"; // For error checking
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { axiosInstance } from "@/lib/axiosInstance";

import {
  EventHeader,
  EventLocation,
  EventMainContent,
  EventSidebar,
  ImageGallery,
} from "./components";
import { getImageUrl } from "./helpers";
import { EventDetail } from "./types";

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

  if (loading) {
    return <div className="container mx-auto px-4 py-10 text-center">Loading event details...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-red-600">Error: {error}</div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-gray-500">
        Event details could not be loaded.
      </div>
    );
  }

  const mainImageUrl = getImageUrl(
    event.image_ids && event.image_ids.length > 0 ? event.image_ids[0] : undefined,
    0,
  );

  const thumbnailUrls: string[] = [];
  const numThumbnails = 4;

  for (let i = 0; i < numThumbnails; i++) {
    if (event.image_ids && event.image_ids.length > i + 1) {
      thumbnailUrls.push(getImageUrl(event.image_ids[i + 1]));
    } else {
      const unsplashFallbackIndex = i + 1;
      thumbnailUrls.push(getImageUrl(undefined, unsplashFallbackIndex));
    }
  }

  return (
    <div className="bg-white pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventHeader title={event.title} eventId={eventId} />
        <ImageGallery
          mainImageUrl={mainImageUrl}
          thumbnailUrls={thumbnailUrls}
          title={event.title}
          allImages={event.image_ids?.map((id) => getImageUrl(id)) || []}
        />

        <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_400px] gap-x-16 mt-[44px]">
          <EventMainContent event={event} />
          <EventSidebar event={event} />
        </div>

        <div className="mt-[44px]">
          <EventLocation id="map" location={event.location} title={event.title} />
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
