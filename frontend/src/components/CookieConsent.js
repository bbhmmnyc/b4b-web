import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'b4b-cookie-consent';

function updateGoogleConsent(granted) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (saved) updateGoogleConsent(saved === 'accepted');
    else setVisible(true);
  }, []);

  const choose = (value) => {
    localStorage.setItem(CONSENT_KEY, value);
    updateGoogleConsent(value === 'accepted');
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <aside className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl border border-[#334155] bg-[#1A1A1A] p-5 text-white shadow-2xl" aria-label="Cookie consent" role="dialog" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-[#D1D5DB]">We use optional analytics and advertising cookies to understand visits and support Blogs 4 Blocks. You can accept them or continue with essential storage only. See our <Link className="text-[#E0B84D] underline" to="/cookie-policy">Cookie Policy</Link>.</p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose('essential')} className="border border-[#777] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/10">Essential only</button>
          <button type="button" onClick={() => choose('accepted')} className="bg-[#C4942A] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#D8A936]">Accept</button>
        </div>
      </div>
    </aside>
  );
}
