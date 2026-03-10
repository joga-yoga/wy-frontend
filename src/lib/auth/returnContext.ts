"use client";

const STORAGE_KEY = "spoke-return-context";

type ReturnContext = {
  origin: string;
  path: string;
};

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

function isLocalProfileHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
}

function getDefaultRetreatsHost(): string {
  if (typeof window !== "undefined" && isLocalProfileHost(window.location.hostname)) {
    return "http://localhost:3000";
  }

  return process.env.NEXT_PUBLIC_RETREATS_HOST || "https://wyjazdy.yoga";
}

function getAllowedOrigins(): Set<string> {
  const configured = [
    process.env.NEXT_PUBLIC_RETREATS_HOST,
    process.env.NEXT_PUBLIC_WORKSHOPS_HOST,
    "https://wyjazdy.yoga",
    "https://wydarzenia.yoga",
    "http://localhost:3000",
    "http://wydarzenia.localhost:3000",
  ].filter(Boolean) as string[];

  return new Set(configured.map(normalizeOrigin));
}

function sanitizePath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}

function isAllowedOrigin(origin: string | null | undefined): origin is string {
  if (!origin) {
    return false;
  }

  return getAllowedOrigins().has(normalizeOrigin(origin));
}

export function saveReturnContext(
  origin: string | null | undefined,
  path: string | null | undefined,
) {
  if (typeof window === "undefined" || !isAllowedOrigin(origin)) {
    return;
  }

  const context: ReturnContext = {
    origin: normalizeOrigin(origin),
    path: sanitizePath(path),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export function getReturnContext(): ReturnContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ReturnContext>;
    if (!isAllowedOrigin(parsed.origin)) {
      return null;
    }

    return {
      origin: normalizeOrigin(parsed.origin),
      path: sanitizePath(parsed.path),
    };
  } catch {
    return null;
  }
}

export function getLoginLogoHref(): string {
  const context = getReturnContext();
  if (context) {
    return `${context.origin}${context.path}`;
  }

  return `${getDefaultRetreatsHost()}/`;
}
