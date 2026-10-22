const CERTIFICATE_MARKS: Record<string, string> = {
  RYT200: "/images/certificates/ryt-200.png",
  RYT500: "/images/certificates/ryt-500.png",
  "E-RYT200": "/images/certificates/e-ryt-200.png",
  "E-RYT500": "/images/certificates/e-ryt-500.png",
};

/** Match the stated qualification only, never hours or credentials embedded in prose. */
export function getCertificateMark(name: string): string | null {
  const label = name.trim().toUpperCase().replace(/[‐‑–]/g, "-");
  const match = /^(E\s*-\s*)?RYT\s*(200|500)$/.exec(label);
  if (!match) return null;
  return CERTIFICATE_MARKS[`${match[1] ? "E-" : ""}RYT${match[2]}`] ?? null;
}
