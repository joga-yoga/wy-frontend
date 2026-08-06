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

/** A query param that carries the profile identity (must survive normalization). */
interface IdentityQuery {
  path: string;
  param: string;
  /** When set, the normalized URL becomes https://<rewriteHost>/<digits-of-value>
   * instead of keeping the query string (WhatsApp phone links). */
  rewriteHost?: string;
}

interface PlatformRule {
  platform: SocialPlatform;
  /** Suffix-matched: "facebook.com" also matches m.facebook.com / business.facebook.com.
   * Matching only — the normalized URL keeps the (cosmetic-subdomain-stripped) input host. */
  domains: string[];
  /** Detected as the platform but host kept verbatim (redirect shorteners). */
  shortlinkDomains?: string[];
  /** /prefix/<handle>: handle is the segment after the prefix. */
  prefixSegments?: string[];
  identityQueries?: IdentityQuery[];
  /** /prefix/<Name>/<id>: handle is the third segment (numeric or pfbid form). */
  idTailPrefixes?: string[];
  /** Channel-tab segments dropped when they directly follow the handle segment(s). */
  tabSegments?: string[];
  stripAt?: boolean;
}

/** Mirrors the backend's `app.services.social_links._PLATFORM_RULES` — same table,
 * same taxonomy, so client-side preview and server-side save agree. */
const PLATFORM_RULES: PlatformRule[] = [
  { platform: "instagram", domains: ["instagram.com"], stripAt: true },
  {
    platform: "facebook",
    domains: ["facebook.com", "fb.com"],
    shortlinkDomains: ["fb.me"],
    prefixSegments: ["groups"],
    identityQueries: [{ path: "/profile.php", param: "id" }],
    idTailPrefixes: ["people", "pages"],
  },
  { platform: "tiktok", domains: ["tiktok.com"], stripAt: true },
  {
    platform: "youtube",
    domains: ["youtube.com"],
    shortlinkDomains: ["youtu.be"],
    prefixSegments: ["channel", "c", "user"],
    tabSegments: ["videos", "shorts", "streams", "playlists", "community", "featured", "about"],
    stripAt: true,
  },
  { platform: "twitter", domains: ["twitter.com", "x.com"], stripAt: true },
  { platform: "linkedin", domains: ["linkedin.com"], prefixSegments: ["in", "company"] },
  { platform: "threads", domains: ["threads.net", "threads.com"], stripAt: true },
  {
    platform: "whatsapp",
    domains: ["wa.me", "whatsapp.com"],
    identityQueries: [{ path: "/send", param: "phone", rewriteHost: "wa.me" }],
  },
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

const COSMETIC_SUBDOMAINS = ["www.", "m.", "mobile.", "web.", "touch."];

function stripCosmeticSubdomains(host: string): string {
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const prefix of COSMETIC_SUBDOMAINS) {
      if (host.startsWith(prefix) && (host.match(/\./g)?.length ?? 0) >= 2) {
        host = host.slice(prefix.length);
        stripped = true;
      }
    }
  }
  return host;
}

function matchRule(host: string): PlatformRule | null {
  for (const rule of PLATFORM_RULES) {
    for (const domain of [...rule.domains, ...(rule.shortlinkDomains ?? [])]) {
      if (host === domain || host.endsWith(`.${domain}`)) return rule;
    }
  }
  return null;
}

/** Mirrors the backend's `app.services.social_links.detect_platform` (T03). */
export function detectPlatform(host: string): SocialPlatform {
  return matchRule(stripCosmeticSubdomains(host.toLowerCase()))?.platform ?? "custom";
}

function parseIdentityQuery(
  rule: PlatformRule,
  host: string,
  path: string,
  searchParams: URLSearchParams,
): ParsedSocialLink | null {
  for (const iq of rule.identityQueries ?? []) {
    if (path !== iq.path) continue;
    const value = searchParams.get(iq.param)?.trim();
    if (!value) continue;
    if (iq.rewriteHost) {
      const digits = value.replace(/\D/g, "");
      if (!digits) continue;
      return {
        platform: rule.platform,
        handle: digits,
        normalizedUrl: `https://${iq.rewriteHost}/${digits}`,
        domain: iq.rewriteHost,
      };
    }
    return {
      platform: rule.platform,
      handle: value,
      normalizedUrl: `https://${host}${path}?${iq.param}=${encodeURIComponent(value)}`,
      domain: host,
    };
  }
  return null;
}

function extractHandle(
  rule: PlatformRule | null,
  segments: string[],
): { handle: string | null; segments: string[] } {
  if (!rule || segments.length === 0) return { handle: null, segments };
  const first = segments[0];
  let handle: string;
  let keep: number;
  if (rule.prefixSegments?.includes(first) && segments.length > 1) {
    handle = segments[1];
    keep = 2;
  } else if (rule.idTailPrefixes?.includes(first) && segments.length >= 3) {
    handle = segments[2];
    keep = 3;
  } else {
    handle = rule.stripAt ? first.replace(/^@/, "") : first;
    keep = 1;
  }
  if (rule.tabSegments && segments.length > keep && rule.tabSegments.includes(segments[keep])) {
    segments = segments.slice(0, keep);
  }
  return { handle, segments };
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

  const host = stripCosmeticSubdomains(parsed.hostname.toLowerCase());
  if (!host.includes(".")) {
    throw new Error("Nie rozpoznajemy tego linku");
  }

  const rule = matchRule(host);
  const platform = rule?.platform ?? "custom";
  const path = parsed.pathname.replace(/\/+$/, "");

  if (rule) {
    const fromQuery = parseIdentityQuery(rule, host, path, parsed.searchParams);
    if (fromQuery) return fromQuery;
  }

  const { handle, segments } = extractHandle(rule, path.split("/").filter(Boolean));
  const normalizedPath = segments.length > 0 ? `/${segments.join("/")}` : "";

  // Everything else in the query string / fragment is tracking noise — drop it.
  return { platform, handle, normalizedUrl: `https://${host}${normalizedPath}`, domain: host };
}

export function defaultLabelFor(parsed: ParsedSocialLink): string {
  return DEFAULT_LABELS[parsed.platform] || parsed.domain;
}
