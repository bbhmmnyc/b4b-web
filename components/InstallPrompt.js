import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('b4b_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('b4b_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 animate-fade-in-up" data-testid="pwa-install-banner">
      <div className="bg-white border border-[#E5E5E5] p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-black text-white">B<span className="text-brand-yellow">4</span>B</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-[#1A1A1A]">Install Blogs 4 Blocks</p>
            <p className="text-xs text-brand-grey mt-0.5">Quick access from your home screen.</p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none font-bold text-xs h-8 uppercase tracking-widest"
                data-testid="pwa-install-btn"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Install
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-brand-grey hover:text-[#1A1A1A] rounded-none text-xs h-8"
                data-testid="pwa-dismiss-btn"
              >
                Not now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-brand-grey hover:text-[#1A1A1A] p-0.5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
