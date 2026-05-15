import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import cityBackgrounds from '../utils/cityBackgrounds';

// Picks a deterministic-random city based on pathname (not homepage)
function getCityIndex(pathname) {
  let hash = 0;
  for (let i = 0; i < pathname.length; i++) {
    hash = (hash * 31 + pathname.charCodeAt(i)) | 0;
  }
  // Skip index 0 (Statue of Liberty = homepage only)
  return 1 + (Math.abs(hash) % (cityBackgrounds.length - 1));
}

export default function CityBackground() {
  const location = useLocation();
  const [current, setCurrent] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    setLoaded(false);
    const isHome = location.pathname === '/';
    const idx = isHome ? 0 : getCityIndex(location.pathname);
    const city = cityBackgrounds[idx];

    // Preload image, then fade in
    const img = new Image();
    img.src = city.image;
    img.onload = () => {
      setCurrent(city);
      // Small delay for smooth mount transition
      requestAnimationFrame(() => setLoaded(true));
    };
    img.onerror = () => {
      setCurrent(city);
      setLoaded(true);
    };

    prevPath.current = location.pathname;
  }, [location.pathname]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" data-testid="city-background" aria-hidden="true">
      {/* City image with fade transition */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${current.image})`,
          opacity: loaded ? 1 : 0,
          filter: 'grayscale(30%)',
        }}
        data-testid="city-bg-image"
      />
      {/* Soft gradient overlay for readability */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: 'linear-gradient(180deg, rgba(253,252,248,0.82) 0%, rgba(253,252,248,0.75) 40%, rgba(253,252,248,0.88) 100%)',
          opacity: loaded ? 1 : 0,
        }}
      />

      {/* City label — subtle bottom-right attribution */}
      <div
        className="absolute bottom-4 right-6 transition-opacity duration-1000 flex items-center gap-1.5"
        style={{ opacity: loaded ? 0.5 : 0 }}
        data-testid="city-label"
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#999]">
          {current.landmark} — {current.city}, {current.country}
        </span>
      </div>
    </div>
  );
}
