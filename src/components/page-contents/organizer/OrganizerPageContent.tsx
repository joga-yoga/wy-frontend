"use client";

import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";

import { getImageUrl } from "@/app/retreats/retreats/[retreatId]/helpers";
import { axiosInstance } from "@/lib/axiosInstance";

import { EventSection, ReviewSection } from "./components";
import { OrganizerDetails, OrganizerReview } from "./types";

interface OrganizerPageContentProps {
  organizerId?: string;
}

export const OrganizerPageContent: React.FC<OrganizerPageContentProps> = ({ organizerId }) => {
  const [organizer, setOrganizer] = useState<OrganizerDetails | null>(null);
  const [reviews, setReviews] = useState<OrganizerReview[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizerAndReviews = async () => {
      if (!organizerId) {
        setError("Organizer ID not found in URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch organizer details
        const apiUrl = `/organizer/${organizerId}`;
        console.log(`Fetching organizer details from: ${apiUrl}`);
        const response = await axiosInstance.get<OrganizerDetails>(apiUrl);
        console.log("🚀 ~ fetchOrganizerAndReviews ~ response:", response);
        setOrganizer(response.data);

        // Fetch initial reviews if organizer has google_place_id
        if (response.data.organizer.google_place_id) {
          try {
            console.log(
              `Fetching reviews for place_id: ${response.data.organizer.google_place_id}`,
            );
            const reviewsResponse = await axiosInstance.get(
              `/organizer/reviews/${response.data.organizer.google_place_id}`,
              {
                params: {
                  offset: 0,
                  limit: 10,
                },
              },
            );
            setReviews(reviewsResponse.data.reviews);
            setHasMore(reviewsResponse.data.has_more);
          } catch (reviewErr) {
            console.error("Failed to fetch reviews:", reviewErr);
            // Don't fail the whole page if reviews fail to load
            setReviews([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch organizer details:", err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            setError("Organizer not found.");
          } else {
            setError(
              `Failed to load organizer: ${err.response?.data?.detail || err.message}. Please try again.`,
            );
          }
          console.error("Error Response Data:", err.response?.data);
          console.error("Error Response Status:", err.response?.status);
        } else {
          setError("An unknown error occurred while fetching organizer details.");
        }
        setOrganizer(null); // Clear event data on error
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizerAndReviews();
  }, [organizerId]);

  if (!organizer) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-gray-500">
        Organizer details could not be loaded.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">Loading organizer details...</div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-red-600">Error: {error}</div>
    );
  }

  return (
    <div className="bg-white text-gray-800">
      <div className="container-wy mx-auto p-4 pb-3 md:p-8">
        <div className="flex flex-col gap-[44px]">
          <div className="flex flex-col md:flex-row gap-[29px]">
            <div className="w-full md:w-[402px] md:h-[245px] px-5 py-[28px] border border-gray-100 rounded-[22px] shadow-[0px_8px_16px_8px_#FAFAFA] flex flex-col items-center justify-center text-center gap-3">
              <div className="relative h-[88px] w-[88px]">
                <Image
                  src={getImageUrl(organizer.organizer.image_id, 0)}
                  alt={organizer.organizer.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <p className="text-h-small text-gray-800">{organizer.organizer.name}</p>
              <p className="text-gray-400 text-sm">{organizer.organizer.name}</p>
            </div>

            <div className="w-full md:w-[669px] md:h-[245px] flex flex-col justify-center">
              <h2 className="text-h-small md:text-h-big text-gray-800 mb-[45px]">
                {organizer.organizer.name}
              </h2>
              <p className="text-m-descript md:text-descrip-under-header text-gray-500">
                {organizer.organizer.description}
              </p>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="flex flex-col gap-[44px]">
            {reviews.length > 0 && organizer.organizer.google_place_id && (
              <ReviewSection
                title={`Co mówią o ${organizer.organizer.name}`}
                reviews={reviews}
                initialHasMore={hasMore}
                image={getImageUrl(organizer.organizer.image_id, 0)}
                placeId={organizer.organizer.google_place_id}
              />
            )}
            {organizer.upcoming_retreats.length > 0 && (
              <EventSection
                title="Planowane wyjazdy"
                events={organizer.upcoming_retreats}
                project="retreats"
              />
            )}
            {organizer.past_retreats.length > 0 && (
              <EventSection
                title="Zakończone wyjazdy"
                events={organizer.past_retreats}
                project="retreats"
              />
            )}
            {organizer.upcoming_workshops.length > 0 && (
              <EventSection
                title="Planowane wydarzenia"
                events={organizer.upcoming_workshops}
                project="workshops"
              />
            )}
            {organizer.past_workshops.length > 0 && (
              <EventSection
                title="Zakończone wydarzenia"
                events={organizer.past_workshops}
                project="workshops"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
