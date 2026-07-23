export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "threads"
  | "whatsapp"
  | "custom";

export interface ParsedSocialLink {
  platform: SocialPlatform;
  handle: string | null;
  normalizedUrl: string;
  domain: string;
}

const PLATFORM_HOSTS: [SocialPlatform, string[]][] = [
  ["instagram", ["instagram.com"]],
  ["facebook", ["facebook.com", "fb.com"]],
  ["tiktok", ["tiktok.com"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["twitter", ["twitter.com", "x.com"]],
  ["linkedin", ["linkedin.com"]],
  ["threads", ["threads.net"]],
  ["whatsapp", ["wa.me", "whatsapp.com"]],
];

const DEFAULT_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X",
  linkedin: "LinkedIn",
  threads: "Threads",
  whatsapp: "WhatsApp",
  custom: "",
};

function stripWww(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : host;
}

/** Mirrors the backend's `app.services.social_links.detect_platform` (T03) — same host
 * list, same taxonomy, so client-side preview and server-side save agree. */
export function detectPlatform(host: string): SocialPlatform {
  const normalized = stripWww(host.toLowerCase());
  for (const [platform, domains] of PLATFORM_HOSTS) {
    if (domains.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`))) {
      return platform;
    }
  }
  return "custom";
}

function extractHandle(platform: SocialPlatform, segments: string[]): string | null {
  if (segments.length === 0) return null;
  const [first, second] = segments;
  switch (platform) {
    case "instagram":
    case "twitter":
    case "threads":
    case "tiktok":
      return first.replace(/^@/, "");
    case "youtube":
      if ((first === "channel" || first === "c" || first === "user") && second) return second;
      return first.replace(/^@/, "");
    case "linkedin":
      if ((first === "in" || first === "company") && second) return second;
      return first;
    case "facebook":
    case "whatsapp":
      return first;
    default:
      return null;
  }
}

/** Client-side preview parse — mirrors `app.services.social_links.parse_social_url` (T03)
 * closely enough for an instant chip preview. The backend re-derives platform/handle/
 * normalized-url authoritatively on save; this does not need to be byte-for-byte
 * identical. Throws for input that isn't a parseable URL. */
export function parseSocialUrl(raw: string): ParsedSocialLink {
  const text = raw.trim();
  if (!text || /\s/.test(text)) {
    throw new Error("Nie rozpoznajemy tego linku");
  }

  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Nie rozpoznajemy tego linku");
  }

  const host = stripWww(parsed.hostname.toLowerCase());
  if (!host.includes(".")) {
    throw new Error("Nie rozpoznajemy tego linku");
  }

  const platform = detectPlatform(parsed.hostname);
  const path = parsed.pathname.replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);
  const handle = extractHandle(platform, segments);
  const normalizedUrl = `https://${host}${path}`;

  return { platform, handle, normalizedUrl, domain: host };
}

export function defaultLabelFor(parsed: ParsedSocialLink): string {
  return DEFAULT_LABELS[parsed.platform] || parsed.domain;
}
