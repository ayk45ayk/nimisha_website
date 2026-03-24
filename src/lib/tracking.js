import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import * as Sentry from "@sentry/react";

// Track if analytics have been initialized
let analyticsInitialized = false;

/**
 * Initialize all tracking services.
 * Checks for specific environment variables before loading scripts.
 * Only initializes once even if called multiple times.
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined') return;
  if (analyticsInitialized) return; // Prevent double initialization
  
  analyticsInitialized = true;
  console.log('📊 Initializing analytics...');

  // 1. Vercel Ecosystem (Zero Config)
  try {
    inject();
    injectSpeedInsights();
  } catch (e) {
    console.warn('Vercel analytics failed:', e);
  }

  // 2. Sentry (Error Monitoring)
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    try {
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
      console.log('✅ Sentry initialized');
    } catch (e) {
      console.warn('Sentry init failed:', e);
    }
  }

  // 3. Microsoft Clarity (Heatmaps & Session Recording)
  const clarityId = import.meta.env.VITE_CLARITY_ID;
  if (clarityId) {
    try {
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", clarityId);
      console.log('✅ Microsoft Clarity initialized');
    } catch (e) {
      console.warn('Clarity init failed:', e);
    }
  }

  // 4. Google Analytics 4
  const gaId = import.meta.env.VITE_GA_ID;
  if (gaId) {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      window.gtag = gtag; // Expose to window for trackEvent
      gtag('js', new Date());
      
      // Set default consent state
      gtag('consent', 'default', {
        'analytics_storage': 'granted',
        'ad_storage': 'denied' // We don't do ads
      });
      
      gtag('config', gaId, {
        'anonymize_ip': true, // GDPR compliance
        'cookie_flags': 'SameSite=None;Secure'
      });
      console.log('✅ Google Analytics initialized:', gaId);
    } catch (e) {
      console.warn('GA init failed:', e);
    }
  }

  // 5. Meta (Facebook) Pixel
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (pixelId) {
    try {
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
      console.log('✅ Meta Pixel initialized');
    } catch (e) {
      console.warn('Meta Pixel init failed:', e);
    }
  }

  // 6. LinkedIn Insight Tag
  const linkedinId = import.meta.env.VITE_LINKEDIN_PARTNER_ID;
  if (linkedinId) {
    try {
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
      console.log('✅ LinkedIn Insight initialized');
    } catch (e) {
      console.warn('LinkedIn init failed:', e);
    }
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
  if (import.meta.env.VITE_SENTRY_DSN && Sentry.isInitialized?.()) {
    Sentry.captureException(error, { extra: context });
  }
};

/**
 * Track Conversion Events across all platforms.
 */
export const trackEvent = (eventName, properties = {}) => {
  // Check if user has given consent
  const consent = localStorage.getItem('site_consent');
  if (consent !== 'granted') {
    if (import.meta.env.DEV) {
      console.log(`[Event Skipped - No Consent]: ${eventName}`, properties);
    }
    return;
  }

  try {
    if (import.meta.env.DEV) {
      console.log(`[Event Tracked]: ${eventName}`, properties);
    }

    // 1. Google Analytics 4
    if (window.gtag) {
      // Map to GA4 recommended events
      const ga4EventMap = {
        'booking_confirmed': 'purchase',
        'contact_form_submit': 'generate_lead',
        'booking_started': 'begin_checkout',
        'whatsapp_followup_clicked': 'click', // Track as click event
      };
      const ga4Event = ga4EventMap[eventName] || eventName;
      
      window.gtag('event', ga4Event, {
        ...properties,
        event_category: 'engagement',
        event_label: eventName
      });
    }

    // 2. Meta Pixel (Map to Standard Events)
    if (window.fbq) {
      const fbEventMap = {
        'booking_confirmed': { event: 'Purchase', params: { currency: properties.currency || 'INR', value: properties.value || 0 } },
        'contact_form_submit': { event: 'Contact', params: {} },
        'booking_started': { event: 'InitiateCheckout', params: {} },
        'signup': { event: 'CompleteRegistration', params: {} },
        'whatsapp_followup_clicked': { event: 'Contact', params: { method: 'whatsapp' } }
      };
      
      const fbConfig = fbEventMap[eventName];
      if (fbConfig) {
        window.fbq('track', fbConfig.event, { ...fbConfig.params, ...properties });
      } else {
        window.fbq('trackCustom', eventName, properties);
      }
    }

    // 3. LinkedIn Conversion (if conversion ID is configured)
    const linkedinConversionId = import.meta.env.VITE_LINKEDIN_CONVERSION_ID;
    if (window.lintrk && linkedinConversionId && eventName === 'booking_confirmed') {
      window.lintrk('track', { conversion_id: linkedinConversionId });
    }

    // 4. Vercel Analytics (Custom events)
    if (window.va?.track) {
      window.va.track(eventName, properties);
    }

    // 5. Microsoft Clarity (Tag the session)
    if (window.clarity) {
      window.clarity('set', 'event', eventName);
      if (properties.value) {
        window.clarity('set', 'revenue', properties.value);
      }
    }

  } catch (err) {
    console.warn("Event tracking failed", err);
  }
};

/**
 * Track page views (call on route change if using SPA routing)
 */
export const trackPageView = (pagePath) => {
  const consent = localStorage.getItem('site_consent');
  if (consent !== 'granted') return;

  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath
    });
  }

  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
};

// ============================================
// PREDEFINED EVENT HELPERS
// ============================================

/**
 * Track when user visits the website
 */
export const trackWebsiteVisit = () => {
  trackEvent('website_visit', {
    referrer: document.referrer || 'direct',
    landing_page: window.location.pathname
  });
};

/**
 * Track section views (for scroll tracking)
 */
export const trackSectionView = (sectionName) => {
  trackEvent('section_viewed', { section: sectionName });
};

/**
 * Track CTA button clicks
 */
export const trackCTAClick = (buttonName, location) => {
  trackEvent('cta_clicked', { button: buttonName, location });
};

/**
 * Track external link clicks
 */
export const trackExternalClick = (platform, url) => {
  trackEvent('external_link_clicked', { platform, url });
};

/**
 * Track phone number clicks
 */
export const trackPhoneClick = () => {
  trackEvent('phone_clicked', { phone: '+91-8000401045' });
};

/**
 * Track WhatsApp clicks
 */
export const trackWhatsAppClick = () => {
  trackEvent('whatsapp_clicked', { phone: '+91-8000401045' });
};

/**
 * Track booking funnel events
 */
export const trackBookingFunnel = {
  started: () => trackEvent('booking_started'),
  dateSelected: (date) => trackEvent('date_selected', { date }),
  slotSelected: (slot) => trackEvent('slot_selected', { slot }),
  detailsFilled: () => trackEvent('details_filled'),
  paymentInitiated: (provider, amount) => trackEvent('payment_initiated', { provider, amount }),
  paymentFailed: (provider, error) => trackEvent('payment_failed', { provider, error }),
  confirmed: (amount, currency, provider) => trackEvent('booking_confirmed', { value: amount, currency, provider })
};

/**
 * Track testimonial events
 */
export const trackTestimonial = {
  viewed: () => trackEvent('testimonials_viewed'),
  submitted: (rating) => trackEvent('testimonial_submitted', { rating })
};

/**
 * Track FAQ/Help events
 */
export const trackFAQ = {
  viewed: () => trackEvent('faq_viewed'),
  questionExpanded: (question) => trackEvent('faq_question_expanded', { question })
};

/**
 * Track modal opens
 */
export const trackModalOpen = (modalName) => {
  trackEvent('modal_opened', { modal: modalName });
};

/**
 * Track search (if applicable)
 */
export const trackSearch = (query) => {
  trackEvent('search', { query });
};
