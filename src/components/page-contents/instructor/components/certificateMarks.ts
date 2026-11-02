const CERTIFICATE_MARKS: Record<string, string> = {
  RYT200: "/images/certificates/ryt-200.png",
  RYT500: "/images/certificates/ryt-500.png",
  "E-RYT200": "/images/certificates/e-ryt-200.png",
  "E-RYT500": "/images/certificates/e-ryt-500.png",
  RCYT: "/images/certificates/rcyt.png",
  RPYT: "/images/certificates/rpyt.png",
  RYS200: "/images/certificates/rys-200.png",
  RYS300: "/images/certificates/rys-300.png",
  RYS500: "/images/certificates/rys-500.png",
  RCYS: "/images/certificates/rcys.png",
  RPYS: "/images/certificates/rpys.png",
  YACEP: "/images/certificates/yacep.png",
  IYENGAR: "/images/certificates/iyengar-certification-mark.png",
};

/** Identify one credential in a free-form title without changing the stored name. */
export function getCertificateMark(name: string): string | null {
  const label = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/Ł/g, "L")
    .replace(/['’‘®™]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/(\d)(H(?:OURS?|RS?)?)\b/g, "$1 $2")
    .trim();
  const qualifications = new Set<string>();

  for (const match of label.matchAll(/\b(E\s*)?(RYT|RYS)\s*(200|300|500)\b/g)) {
    qualifications.add((match[1] ? "E-" : "") + match[2] + match[3]);
  }
  for (const match of label.matchAll(
    /\b(EXPERIENCED )?REGISTERED YOGA (TEACHER|SCHOOL)\s*(200|300|500)\b/g,
  )) {
    qualifications.add(
      (match[1] ? "E-" : "") + (match[2] === "TEACHER" ? "RYT" : "RYS") + match[3],
    );
  }
  for (const match of label.matchAll(/\b(RCYT|RPYT|RCYS|RPYS|YACEP)\b/g)) {
    qualifications.add(match[1]);
  }
  if (/\bYOGA ALLIANCE CONTINUING EDUCATION PROVIDER\b/.test(label)) {
    qualifications.add("YACEP");
  }
  for (const match of label.matchAll(
    /\bREGISTERED (CHILDRENS?|PRENATAL) YOGA (TEACHER|SCHOOL)\b/g,
  )) {
    qualifications.add(
      "R" + (match[1] === "PRENATAL" ? "P" : "C") + (match[2] === "TEACHER" ? "YT" : "YS"),
    );
  }
  if (/\b(?:IYENGAR(?:A)?|CIYT)\b/.test(label)) qualifications.add("IYENGAR");

  // A row can have only one mark. Keep the upload fallback for ambiguous titles.
  return qualifications.size === 1 ? (CERTIFICATE_MARKS[[...qualifications][0]] ?? null) : null;
}
