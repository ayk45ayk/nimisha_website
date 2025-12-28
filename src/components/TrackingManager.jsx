import React, { useState, useEffect, useCallback } from 'react';
import { initAnalytics } from '../lib/tracking';
import { Shield, X, Check, Settings } from 'lucide-react';

// Export a function to show the consent banner programmatically
let showConsentBanner = () => {};

export const openCookieSettings = () => {
  showConsentBanner();
};

const TrackingManager = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [consentStatus, setConsentStatus] = useState(null); // 'granted', 'denied', or null

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('site_consent');
    setConsentStatus(consent);
    
    if (consent === 'granted') {
      initAnalytics();
    } else if (consent === null) {
      // Show banner if no choice made yet
      setShowConsent(true);
    }
  }, []);

  // Expose function to show consent banner
  useEffect(() => {
    showConsentBanner = () => setShowConsent(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('site_consent', 'granted');
    setConsentStatus('granted');
    setShowConsent(false);
    initAnalytics();
  };

  const handleDecline = () => {
    localStorage.setItem('site_consent', 'denied');
    setConsentStatus('denied');
    setShowConsent(false);
    
    // If previously granted, we should try to disable tracking
    // Note: This won't fully remove cookies already set, but prevents new ones
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  };

  const handleManage = () => {
    setShowConsent(true);
  };

  if (!showConsent) {
    // Show small floating button to manage cookies (GDPR requirement)
    return (
      <button
        onClick={handleManage}
        className="fixed bottom-4 left-4 z-[90] bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-full p-3 hover:bg-slate-50 transition-all group"
        aria-label="Cookie Settings"
        title="Manage Cookie Preferences"
      >
        <Settings size={18} className="text-slate-500 group-hover:text-teal-600 transition-colors" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-full p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur shadow-2xl border border-teal-100 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
        
        {/* Close button */}
        <button 
          onClick={() => setShowConsent(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-3 mb-3 pr-6">
          <div className="bg-teal-100 p-2 rounded-lg text-teal-700 flex-shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Cookie Preferences</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              We use cookies for analytics and to improve your experience. 
              {consentStatus && (
                <span className={`block mt-1 font-medium ${consentStatus === 'granted' ? 'text-green-600' : 'text-amber-600'}`}>
                  Current: {consentStatus === 'granted' ? '✓ Accepted' : '✗ Declined'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button 
            onClick={handleDecline}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
              consentStatus === 'denied' 
                ? 'bg-slate-200 text-slate-700' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {consentStatus === 'denied' ? '✓ Declined' : 'Decline All'}
          </button>
          <button 
            onClick={handleAccept}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-1 ${
              consentStatus === 'granted'
                ? 'bg-green-600 text-white'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            <Check size={14} /> {consentStatus === 'granted' ? 'Accepted' : 'Accept All'}
          </button>
        </div>
        
        <p className="text-[10px] text-slate-400 mt-3 text-center">
          <a href="#" onClick={(e) => { e.preventDefault(); }} className="underline hover:text-slate-600">
            Learn more in our Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default TrackingManager;
