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
import { EventDetail } from "./types";

const EventDetailPage: React.FC = () => {
  const params = useParams();
  const eventId = params?.retreatId as string;

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
        const apiUrl = `/retreats/${eventId}`;
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

  return (
    <div className="bg-white">
      <div className="container-wy mx-auto p-4 pb-3 md:p-8">
        <EventHeader title={event.title} eventId={eventId} />
        <ImageGallery title={event.title} image_ids={event.image_ids || []} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_400px] gap-y-10 lg:gap-y-0 lg:gap-x-16 mt-3 md:mt-[44px]">
          <EventSidebar
            event={event}
            className="lg:col-span-1 order-1 lg:order-2"
            project="retreats"
          />
          <EventMainContent event={event} className="lg:col-span-2 order-2 lg:order-1" />
        </div>

        <div className="mt-[44px]">
          <EventLocation id="map" location={event.location} title={event.title} />
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
