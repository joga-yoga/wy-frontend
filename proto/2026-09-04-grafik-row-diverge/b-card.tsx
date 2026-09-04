import { occurrences } from "@/fixtures";

/**
 * Wariant rozbieżny (reframe): brak importów komponentów produktowych — samodzielny z założenia
 * (spec-design-skills §5.2). Tożsamość marki utrzymana: ta sama rodzina kolorów, ta sama
 * typografia, mobile-first, polska kopia. Zmienia się konwencja komponentu, nie język wizualny.
 *
 * Pomysł: godzina dostaje własny blok po lewej, wiersz staje się kartą.
 */
const week = [
  occurrences.wedMorning,
  occurrences.wedEvening,
  occurrences.thuEvening,
  occurrences.satMidday,
];

const TINT: Record<string, string> = {
  green: "#E7F3EB",
  teal: "#E4F1F0",
  blue: "#E6EDF6",
  sand: "#F3EFE6",
};

export default function CardVariant() {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 22, fontWeight: 600, color: "#111" }}>Grafik</p>
      {week.map((o) => {
        const time = new Date(o.start_time);
        return (
          <div
            key={o.id}
            style={{
              display: "flex",
              gap: 12,
              borderRadius: 18,
              background: TINT[o.color ?? "green"] ?? "#EEE",
              padding: 12,
              opacity: o.status === "cancelled" ? 0.55 : 1,
            }}
          >
            <div style={{ width: 52, flexShrink: 0, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: "#111" }}>
                {time.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{ fontSize: 11, color: "#6B6B6B" }}>75 min</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{o.template_title}</p>
              <p style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
                {o.instructor_name} · {o.fill_count}/{o.capacity}
                {o.status === "cancelled" ? " · Odwołane" : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
