import mixpanel from "mixpanel-browser";

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
  });
};

enum MIXPANEL_EVENTS {
  "test" = "test",
  "subscribe" = "subscribe",
  "error" = "error",
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

export const mixpanelIdentify = (id: string) => {
  try {
    mixpanel.identify(id);
  } catch (e) {
    console.log(e);
  }
};

export const mixpanelSetProfileProp = (name: string, value: any) => {
  try {
    mixpanel.people.set({ [name]: value });
  } catch (e) {
    console.log(e);
  }
};
