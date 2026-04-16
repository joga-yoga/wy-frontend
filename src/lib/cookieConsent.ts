export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
  updatedAt: string;
};

export type CookiePreferenceSelection = Pick<CookieConsent, "analytics" | "marketing">;

export const COOKIE_CONSENT_STORAGE_KEY = "wy.cookie_consent.v1";
export const COOKIE_SETTINGS_OPEN_EVENT = "wy:open-cookie-settings";

const hasWindow = () => typeof window !== "undefined";

export const buildCookieConsent = ({
  analytics,
  marketing,
}: CookiePreferenceSelection): CookieConsent => ({
  necessary: true,
  analytics,
  marketing,
  decided: true,
  updatedAt: new Date().toISOString(),
});

export const getStoredCookieConsent = (): CookieConsent | null => {
  if (!hasWindow()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<CookieConsent>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") {
      return null;
    }

    return {
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      decided: true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export const saveCookieConsent = (consent: CookieConsent) => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
};
