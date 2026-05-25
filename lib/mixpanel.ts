import mixpanel from "mixpanel-browser";

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let initialized = false;

function signupTrackedKey(userId: string) {
  return `mixpanel_signup_tracked:${userId}`;
}

export function initMixpanel() {
  if (typeof window === "undefined" || initialized || !TOKEN) return;
  mixpanel.init(TOKEN, {
    debug: process.env.NODE_ENV !== "production",
    track_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !TOKEN) return;
  initMixpanel();
  mixpanel.track(event, properties);
}

export function identifyUser(userId: string, traits?: { email?: string | null }) {
  if (typeof window === "undefined" || !TOKEN) return;
  initMixpanel();
  mixpanel.identify(userId);
  if (traits?.email) {
    mixpanel.people.set({ $email: traits.email });
  }
}

export function resetMixpanel() {
  if (typeof window === "undefined" || !initialized) return;
  mixpanel.reset();
}

export function trackSignUpCompleted(userId: string, method: "email" | "google") {
  if (localStorage.getItem(signupTrackedKey(userId))) return;
  identifyUser(userId);
  track("sign_up_completed", {
    sign_up_method: method,
    platform: "web",
  });
  localStorage.setItem(signupTrackedKey(userId), "1");
}

export function isRecentSignUp(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 60_000;
}
