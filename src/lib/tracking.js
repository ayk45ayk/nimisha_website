import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// --- 1. Analytics & Speed Insights ---
export const initAnalytics = () => {
  // Vercel Analytics (Auto-detects production environment)
  inject();
  injectSpeedInsights();
  
  // Optional: Google Analytics (if ID is provided in .env)
  const gaId = import.meta.env.VITE_GA_ID;
  if (gaId && typeof window !== 'undefined') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', gaId);
  }
};

// --- 2. Error Monitoring ---
export const logError = (error, context = {}) => {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error Monitor]:', error, context);
  }

  // Integration point for Sentry / LogRocket
  // If you add Sentry later, you would put Sentry.captureException(error) here.
  
  // For now, we can send critical errors to your existing backend if needed
  // or just rely on Vercel's Function Logs.
};

// --- 3. Conversion Events ---
export const trackEvent = (eventName, properties = {}) => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[Event Tracked]: ${eventName}`, properties);
    }

    // Send to Google Analytics if active
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }
    
    // Send to Vercel Analytics (Custom Events require Pro plan, but this is the structure)
    // window.va && window.va.track(eventName, properties);
    
  } catch (err) {
    console.warn("Event tracking failed", err);
  }
};