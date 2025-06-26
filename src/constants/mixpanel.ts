enum MIXPANEL_EVENTS {
  "test" = "test",
  "subscribe" = "subscribe",
  "connectWallet" = "connectWallet",
  "purchaseTokens" = "purchaseTokens",
  "error" = "error",
}

type MixpanelEventType = keyof typeof MIXPANEL_EVENTS;

export const trackEvent = (event_name: MixpanelEventType, props?: any) => {
  try {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(event_name, props);
    }
  } catch (e) {
    console.log(e);
  }
};

export const trackPageview = (props?: any) => {
  try {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track_pageview(props);
    }
  } catch (e) {
    console.log(e);
  }
};

export const mixpanelIdentify = (id: string | number) => {
  try {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.identify(id);
    }
  } catch (e) {
    console.log(e);
  }
};

export const mixpanelSetProfileProp = (name: string, value: any) => {
  try {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.people.set({ [name]: value });
    }
  } catch (e) {
    console.log(e);
  }
};
