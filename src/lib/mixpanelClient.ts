import mixpanel from "mixpanel-browser";

import { getStoredCookieConsent } from "@/lib/cookieConsent";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const MIXPANEL_MODE = process.env.NEXT_PUBLIC_MIXPANEL_MODE;

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN) {
    console.warn("Mixpanel token is missing! Check your .env file.");
    return;
  }
  mixpanel.init(MIXPANEL_TOKEN, {
    autocapture: true,
    ignore_dnt: true,
    api_host: "https://mix.gorbatiuk.com",
    debug: MIXPANEL_MODE === "production" ? false : true,
    // No cookies/localStorage until the user grants analytics consent;
    // Mixpanel keeps an in-memory $device_id per page load instead.
    disable_persistence: true,
    // Stripped from events until analytics consent is granted, then lifted
    // in syncMixpanelAnalyticsConsent.
    property_blacklist: ["$initial_referrer", "$initial_referring_domain"],
  });

  try {
    // Legacy cleanup: the previous opt_out_tracking_by_default setup left a
    // stored SDK opt-out flag (__mp_opt_in_out_*) that silently drops every
    // event. Consent gating is ours now (consent_state + persistence), so
    // clear it for everyone. Must stay before any set_config: the SDK only
    // skips its enable-persistence side effect while disable_persistence
    // is still true in config.
    mixpanel.clear_opt_in_out_tracking();

    mixpanel.register({ consent_state: "pending" });
  } catch (e) {
    console.log(e);
  }
};

// Persistence may be disabled, so consent_state must be re-registered on
// every page load: call this on init with the stored consent decision
// (trackDecision stays false there — only an actual banner/settings choice
// should emit a consent_decision event).
export const syncMixpanelAnalyticsConsent = (
  analyticsEnabled: boolean,
  options?: { trackDecision?: boolean },
) => {
  try {
    if (analyticsEnabled) {
      // Re-enabling persistence stores the current $device_id, so identity
      // is stable from this point on. With consent we can also keep
      // first-touch attribution, so the referrer blacklist is lifted;
      // $initial_referrer reflects the page load where consent was granted.
      mixpanel.set_config({ disable_persistence: false, property_blacklist: [] });
      mixpanel.register({ consent_state: "granted" });
    } else {
      mixpanel.register({ consent_state: "rejected" });
    }

    if (options?.trackDecision) {
      trackEvent("consent_decision", { accepted: analyticsEnabled });
    }
  } catch (e) {
    console.log(e);
  }
};

export const identifyMixpanelUser = (userId: string, email?: string) => {
  try {
    if (!getStoredCookieConsent()?.analytics) {
      return;
    }

    mixpanel.identify(userId);
    if (email) {
      mixpanel.people.set({ $email: email });
    }
  } catch (e) {
    console.log(e);
  }
};

export const resetMixpanelUser = () => {
  try {
    mixpanel.reset();
  } catch (e) {
    console.log(e);
  }
};

enum MIXPANEL_EVENTS {
  "test" = "test",
  "subscribe" = "subscribe",
  "error" = "error",
  "consent_decision" = "consent_decision",
}

type MixpanelEventType = keyof typeof MIXPANEL_EVENTS;

export const trackEvent = (event_name: MixpanelEventType, props?: any) => {
  try {
    mixpanel.track(event_name, props);
  } catch (e) {
    console.log(e);
  }
};

export const trackPageview = (props?: any) => {
  try {
    mixpanel.track_pageview(props);
  } catch (e) {
    console.log(e);
  }
};
