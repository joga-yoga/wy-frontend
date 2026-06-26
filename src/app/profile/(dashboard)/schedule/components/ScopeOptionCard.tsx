"use client";

interface ScopeOptionCardProps {
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
  variant?: "default" | "danger";
}

export function ScopeOptionCard({
  title,
  subtitle,
  selected,
  onSelect,
  variant = "default",
}: ScopeOptionCardProps) {
  const borderColor = selected
    ? variant === "danger"
      ? "border-red-500 ring-1 ring-red-500"
      : "border-gray-900 ring-1 ring-gray-900"
    : "border-gray-200";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${borderColor} bg-white`}
    >
      <p className={`text-sm font-semibold ${variant === "danger" && selected ? "text-red-700" : "text-gray-900"}`}>
        {title}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
    </button>
  );
}
