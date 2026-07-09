import { cn } from "@/lib/utils";

interface OptionRowProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  right: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

// Funding/Method screen's vertical bordered-row option shape (mockup's `.opt`).
// Distinct from the drawers' richer `.pcard`/`.scard` rows built in T03 — do not reuse here.
export function OptionRow({ icon, title, subtitle, right, selected, onClick }: OptionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] border-gray-200 bg-white px-4 py-3.5 text-left transition-colors",
        selected && "border-2 border-brand-green-700 bg-brand-green-700/5 px-[15px] py-[13px]",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f2ee]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-gray-900">{title}</p>
        <p className="mt-0.5 truncate text-[13px] text-gray-500">{subtitle}</p>
      </div>
      <div className="shrink-0">{right}</div>
    </button>
  );
}

export function OptionRadio({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "relative h-[22px] w-[22px] shrink-0 rounded-full border-2",
        selected ? "border-brand-green-700" : "border-gray-200",
      )}
    >
      {selected && <div className="absolute inset-1 rounded-full bg-brand-green-700" />}
    </div>
  );
}

export function OwnTag() {
  return (
    <span className="ml-1.5 inline-block rounded-md bg-brand-green-700/10 px-1.5 py-0.5 align-middle text-[10.5px] font-bold text-brand-green-700">
      TWÓJ
    </span>
  );
}
