export const DEFAULT_LOGOUT_ORIGINS = [
  "http://app.localhost:3000",
  "http://localhost:3000",
  "http://wydarzenia.localhost:3000",
  "https://app.joga.yoga",
  "https://wyjazdy.yoga",
  "https://wydarzenia.yoga",
] as const;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

function parseOrigins(raw?: string): string[] {
  if (!raw) {
    return [...DEFAULT_LOGOUT_ORIGINS];
  }

  const unique = new Set<string>();
  for (const part of raw.split(",")) {
    const origin = normalizeOrigin(part);
    if (!origin) continue;
    unique.add(origin);
  }

  return unique.size > 0 ? Array.from(unique) : [...DEFAULT_LOGOUT_ORIGINS];
}

export function getLogoutOrigins(): string[] {
  return parseOrigins(process.env.NEXT_PUBLIC_SSO_LOGOUT_ORIGINS);
}

function encodeNext(nextUrl: string): string {
  return encodeURIComponent(nextUrl);
}

export function buildGlobalLogoutStartUrl(params: {
  currentOrigin: string;
  finalRedirect: string;
}): string {
  const currentOrigin = normalizeOrigin(params.currentOrigin);
  const finalRedirect = normalizeOrigin(params.finalRedirect);

  const sequence = Array.from(
    new Set(
      getLogoutOrigins()
        .map(normalizeOrigin)
        .filter((origin) => origin && origin !== currentOrigin),
    ),
  );

  if (sequence.length === 0) {
    return `${finalRedirect}/`;
  }

  const cid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  let next = `${finalRedirect}/`;
  for (let i = sequence.length - 1; i >= 0; i -= 1) {
    const origin = sequence[i];
    const url = `${origin}/auth/logout?cid=${encodeURIComponent(cid)}&final=${encodeURIComponent(
      `${finalRedirect}/`,
    )}`;
    next = `${url}&next=${encodeNext(next)}`;
  }

  if (typeof window !== "undefined") {
    console.log("[logout] build-chain", {
      currentOrigin,
      finalRedirect,
      sequence,
      startUrl: next,
    });
  }

  return next;
}

export function isAllowedLogoutTarget(url: string): boolean {
  try {
    const parsed = new URL(url);
    const candidate = normalizeOrigin(parsed.origin);
    return getLogoutOrigins().map(normalizeOrigin).includes(candidate);
  } catch {
    return false;
  }
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("access_token");
}
