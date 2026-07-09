import { ShieldCheck } from "lucide-react";

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  const timePart = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} o ${timePart}`;
}

export function CancellationChip({ deadline }: { deadline?: string | null }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">
      <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-brand-green-700" />
      <span>
        {deadline ? (
          <>
            Bezpłatne odwołanie do{" "}
            <strong className="font-semibold">{formatDeadline(deadline)}</strong>
          </>
        ) : (
          "Bezpłatne odwołanie w dowolnym momencie"
        )}
      </span>
    </div>
  );
}
