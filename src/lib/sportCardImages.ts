/** Local artwork for the built-in catalogue. Custom cards keep their uploaded photo. */
const sportCardImages: Readonly<Record<string, string>> = {
  "multisport-plus": "/images/cards/ms_plus.webp",
  "multisport-classic": "/images/cards/ms_classic.webp",
  "multisport-light": "/images/cards/ms_light.webp",
  "multisport-student": "/images/cards/ms_student.webp",
  "multisport-senior": "/images/cards/ms_senior.webp",
  "medicover-sport": "/images/cards/medicover-sport.webp",
  fitprofit: "/images/cards/fitprofit.webp",
  fitsport: "/images/cards/fitsport.webp",
  mybenefit: "/images/cards/mybenefit.webp",
  "ok-system": "/images/cards/ok-system.webp",
  "pzu-sport": "/images/cards/pzu-sport.webp",
  "edenred-sport": "/images/cards/edenred-sport.webp",
};

export function sportCardImage(slug?: string | null, photo?: string | null): string | null {
  return (slug && sportCardImages[slug]) || photo || null;
}
