import React from 'react';
import localLogo from '../assets/airsetu_logo.png';

export default function Logo({ onClick, showTagline = true }) {
  // Configurable Cloudinary or remote CDN URL with local bundled fallback
  const logoSrc = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDINARY_LOGO_URL) || localLogo;

  return (
    <a
      href="#home"
      className="brand-logo airsetu-brand"
      onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
      aria-label="AirSetu - MoSPI Airfare Price Index Home"
    >
      <div className="logo-icon-wrap airsetu-icon-wrap">
        <img
          src={logoSrc}
          alt="AirSetu Logo"
          className="airsetu-logo-img"
          loading="eager"
        />
      </div>
      <div className="brand-text-col">
        <span className="brand-name">
          Air<span className="brand-accent">Setu</span>
        </span>
        {showTagline && (
          <span className="brand-tagline font-mono">
            MoSPI APIx
          </span>
        )}
      </div>
    </a>
  );
}

