import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import * as Sentry from "@sentry/react";

/**
 * Initialize all tracking services.
 * Checks for specific environment variables before loading scripts.
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  // 1. Vercel Ecosystem (Zero Config)
  inject();
  injectSpeedInsights();

  // 2. Sentry (Error Monitoring)
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0, 
      replaysSessionSampleRate: 0.1, 
      replaysOnErrorSampleRate: 1.0, 
    });
  }

  // 3. Microsoft Clarity (Heatmaps & Session Recording)
  const clarityId = import.meta.env.VITE_CLARITY_ID;
  if (clarityId) {
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", clarityId);
  }

  // 4. Google Analytics 4
  const gaId = import.meta.env.VITE_GA_ID;
  if (gaId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag; // Expose to window for trackEvent
    gtag('js', new Date());
    gtag('config', gaId);
  }

  // 5. Meta (Facebook) Pixel
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (pixelId) {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }

  // 6. LinkedIn Insight Tag
  const linkedinId = import.meta.env.VITE_LINKEDIN_PARTNER_ID;
  if (linkedinId) {
    window._linkedin_partner_id = linkedinId;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(linkedinId);
    (function(l) {
      if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
      window.lintrk.q=[]}
      var s = document.getElementsByTagName("script")[0];
      var b = document.createElement("script");
      b.type = "text/javascript";b.async = true;
      b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
      s.parentNode.insertBefore(b, s);
    })(window.lintrk);
  }
};

/**
 * Log errors to Sentry and Console.
 */
export const logError = (error, context = {}) => {
  if (import.meta.env.DEV) {
    console.error('[Error Monitor]:', error, context);
  }

  // Send to Sentry if initialized
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

/**
 * Track Conversion Events across all platforms.
 */
export const trackEvent = (eventName, properties = {}) => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[Event Tracked]: ${eventName}`, properties);
    }

    // 1. Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }

    // 2. Meta Pixel (Map standard events)
    if (window.fbq) {
      // Map custom names to Standard FB Events where possible
      const standardEvents = {
        'booking_confirmed': 'Purchase',
        'contact_form_submit': 'Contact',
        'signup': 'CompleteRegistration'
      };
      const fbEvent = standardEvents[eventName] || 'CustomEvent';
      window.fbq('track', fbEvent, properties);
    }

    // 3. LinkedIn Conversion
    if (window.lintrk) {
      // LinkedIn usually requires a specific Conversion ID, but generic tracking works too
      window.lintrk('track', { conversion_id: null }); 
    }

    // 4. Vercel Analytics (Custom events)
    if (window.va) {
      window.va.track(eventName, properties);
    }

  } catch (err) {
    console.warn("Event tracking failed", err);
  }
};