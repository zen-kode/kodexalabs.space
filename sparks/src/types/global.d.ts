// Global type declarations

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    mixpanel: any;
    amplitude: any;
    FullStory: any;
    hj: any;
    posthog: any;
    analytics: any;
  }
}

export {};