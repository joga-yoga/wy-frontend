import mixpanel from "mixpanel-browser";

import { getStoredCookieConsent } from "@/lib/cookieConsent";
import { getImageUrl } from "@/lib/imageHelpers";

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

type MixpanelUserProfile = {
  email?: string;
  name?: string;
  avatarUrl?: string;
};

// Partner profile data (name, photo) wins over the bare account name.
export const buildMixpanelProfile = (user: {
  email?: string;
  name?: string;
  partner?: { name?: string; image_id?: string } | null;
}): MixpanelUserProfile => ({
  email: user.email,
  name: user.partner?.name ?? user.name,
  // getImageUrl falls back to a stock photo when there is no id, so only
  // build the avatar URL when the partner actually has an image.
  avatarUrl: user.partner?.image_id ? getImageUrl(user.partner.image_id) : undefined,
});

export const identifyMixpanelUser = (userId: string, profile?: MixpanelUserProfile) => {
  try {
    if (!getStoredCookieConsent()?.analytics) {
      return;
    }

    mixpanel.identify(userId);

    // people.set merges, so omitted keys keep their existing profile values.
    const people: Record<string, string> = {};
    if (profile?.email) {
      people["$email"] = profile.email;
    }
    if (profile?.name) {
      people["$name"] = profile.name;
    }
    if (profile?.avatarUrl) {
      people["$avatar"] = profile.avatarUrl;
    }
    if (Object.keys(people).length > 0) {
      mixpanel.people.set(people);
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
