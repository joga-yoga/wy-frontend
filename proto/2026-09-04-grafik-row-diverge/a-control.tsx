import { occurrences } from "@/fixtures";
import { COLOR_SWATCH_MAP, type ClassColor } from "@/lib/classColors";

/**
 * KONTROLA. Bez pary „lepsze" i „inne" są nie do odróżnienia — nowość zawsze wygrywa
 * w izolacji, i tak właśnie racjonalizuje się niespójność (spec-design-skills §5).
 *
 * To obecny idiom: zwarty wiersz z kolorowym paskiem po lewej.
 */
const week = [
  occurrences.wedMorning,
  occurrences.wedEvening,
  occurrences.thuEvening,
  occurrences.satMidday,
];

export default function Control() {
  return (
    <div className="flex flex-col p-4">
      <p className="mb-3 text-h-small text-gray-900">Grafik</p>
      <ul className="flex flex-col gap-2">
        {week.map((o) => (
          <li key={o.id} className="flex items-stretch gap-3">
            <span
              className={`w-1 shrink-0 rounded-full ${COLOR_SWATCH_MAP[(o.color ?? "green") as ClassColor]}`}
            />
            <div className="min-w-0 flex-1 py-1">
              <p className="truncate text-sm font-medium text-gray-900">{o.template_title}</p>
              <p className="truncate text-xs text-gray-500">
                {new Date(o.start_time).toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {o.instructor_name} · {o.fill_count}/{o.capacity}
              </p>
            </div>
            {o.status === "cancelled" ? (
              <span className="self-center rounded-full bg-b2b-red-bg px-2 py-0.5 text-[11px] text-b2b-red-text">
                Odwołane
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
