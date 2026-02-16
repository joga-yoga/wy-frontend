import { parseISO } from "date-fns";
import { getCldImageUrl } from "next-cloudinary";
import React from "react";

// Helper function to format multi-line text
export const formatMultiLineText = (text: string | undefined | null): React.ReactNode => {
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
        <p key={index} className="">
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

// Predefined Unsplash image URLs for fallbacks
const unsplashImageUrls = [
  "https://images.unsplash.com/photo-1505238680356-667803448bb6?auto=format&fit=crop&w=1170&q=80", // travel/outdoors
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1170&q=80", // concert/event
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1171&q=80", // people/workshop
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1170&q=80", // tech/conference
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1170&q=80", // presentation/meeting
  "https://images.unsplash.com/photo-1505238680356-667803448bb6?auto=format&fit=crop&w=1170&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1170&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1171&q=80",
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1170&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1170&q=80",
];

// Helper to construct Image URL (Cloudinary or Unsplash fallback)
export const getImageUrl = (
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
// Helper to construct Image URL (Cloudinary or Unsplash fallback)
export const getImagePlaceholderUrl = (imageId: string | undefined | null): string => {
  if (!imageId) return "";
  return getCldImageUrl({
    src: imageId,
    width: 10,
    height: 10,
  });
};

export const getImageBlurDataURL = async (imageId: string) => {
  const blurImageUrl = getImagePlaceholderUrl(imageId);

  // Fetch the blurred image and convert to base64
  const response = await fetch(blurImageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const blurDataURL = `data:image/jpeg;base64,${buffer.toString("base64")}`; // Adjust mimetype if needed

  return blurDataURL;
};

const MS_IN_24_HOURS = 24 * 60 * 60 * 1000;

export function isMultiDayEvent(startDate?: string | null, endDate?: string | null): boolean {
  if (!startDate || !endDate) {
    return false;
  }

  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }

    return end.getTime() - start.getTime() > MS_IN_24_HOURS;
  } catch {
    return false;
  }
}
