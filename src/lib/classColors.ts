// Mirrors backend CLASS_COLOR_PALETTE / ck_class_details_color_palette (app.models.event).
export const CLASS_COLORS = [
  "green",
  "teal",
  "blue",
  "lavender",
  "rose",
  "sand",
  "apricot",
] as const;

export type ClassColor = (typeof CLASS_COLORS)[number];

export const COLOR_BORDER_MAP: Record<ClassColor, string> = {
  green: "border-class-green-600",
  teal: "border-class-teal-600",
  blue: "border-class-blue-600",
  lavender: "border-class-lavender-600",
  rose: "border-class-rose-600",
  sand: "border-class-sand-600",
  apricot: "border-class-apricot-600",
};

export const DEFAULT_BORDER = "border-gray-200";

export const COLOR_SWATCH_MAP: Record<ClassColor, string> = {
  green: "bg-class-green-600",
  teal: "bg-class-teal-600",
  blue: "bg-class-blue-600",
  lavender: "bg-class-lavender-600",
  rose: "bg-class-rose-600",
  sand: "bg-class-sand-600",
  apricot: "bg-class-apricot-600",
};

export const COLOR_LABELS: Record<ClassColor, string> = {
  green: "Zielony",
  teal: "Turkusowy",
  blue: "Niebieski",
  lavender: "Lawendowy",
  rose: "Różowy",
  sand: "Piaskowy",
  apricot: "Morelowy",
};
