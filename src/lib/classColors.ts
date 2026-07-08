// Mirrors backend CLASS_COLOR_PALETTE / ck_class_details_color_palette (app.models.event).
export const CLASS_COLORS = ["rose", "amber", "lime", "teal", "sky", "violet", "slate"] as const;

export type ClassColor = (typeof CLASS_COLORS)[number];

export const COLOR_BORDER_MAP: Record<ClassColor, string> = {
  rose: "border-rose-300",
  amber: "border-amber-300",
  lime: "border-lime-400",
  teal: "border-teal-300",
  sky: "border-sky-300",
  violet: "border-violet-300",
  slate: "border-slate-300",
};

export const DEFAULT_BORDER = "border-gray-200";

export const COLOR_SWATCH_MAP: Record<ClassColor, string> = {
  rose: "bg-rose-400",
  amber: "bg-amber-400",
  lime: "bg-lime-400",
  teal: "bg-teal-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  slate: "bg-slate-400",
};

export const COLOR_LABELS: Record<ClassColor, string> = {
  rose: "Różowy",
  amber: "Bursztynowy",
  lime: "Limonkowy",
  teal: "Turkusowy",
  sky: "Błękitny",
  violet: "Fioletowy",
  slate: "Szary",
};
