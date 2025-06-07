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
        <p key={index} className="text-sm text-muted-foreground">
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
export const formatDateRange = (start: string | null, end: string | null) => {
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
