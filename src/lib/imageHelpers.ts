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

export const getOgImageUrl = (imageId: string | undefined | null): string => {
  if (!imageId) return "";
  // Using next-cloudinary helper for proper transformation URL construction or manual string
  // return getCldImageUrl({
  //   src: imageId,
  //   width: 1600,
  //   height: 900,
  //   crop: 'fill'
  // });
  // But getCldImageUrl might need context or config.
  // Let's use direct string construction for simplicity and reliability on server side if env var is present.
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_1600,h_900,c_fill/${imageId}`;
};
