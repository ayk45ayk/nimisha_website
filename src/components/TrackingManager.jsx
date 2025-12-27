import React, { useState, useEffect } from 'react';
import { initAnalytics } from '../lib/tracking';
import { Shield, X, Check } from 'lucide-react';

const TrackingManager = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('site_consent');
    
    if (consent === 'granted') {
      initAnalytics();
    } else if (consent === null) {
      // Show banner if no choice made yet
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('site_consent', 'granted');
    setShowConsent(false);
    initAnalytics();
  };

  const handleDecline = () => {
    localStorage.setItem('site_consent', 'denied');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-full p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur shadow-2xl border border-teal-100 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
        
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">We value your privacy</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              We use cookies and analytics to improve user experience and monitor site performance.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button 
            onClick={handleDecline}
            className="flex-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 px-3 py-2 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1"
          >
            <Check size={14} /> Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackingManager;