import React from 'react';

export default function Logo() {
  return (
    <a href="#" className="brand-logo" aria-label="APIx India Home">
      <div className="logo-icon-wrap">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="logo-icon flight-logo-icon"
        >
          {/* Analytical Radar and Aviation Data Emblem */}
          <circle cx="12" cy="12" r="9" stroke="#E5B54F" strokeWidth="1.8" strokeDasharray="2 2" fill="none" />
          <circle cx="12" cy="12" r="5" stroke="#E5B54F" strokeWidth="2" fill="rgba(229, 181, 79, 0.15)" />
          <path
            d="M12 3V21M3 12H21"
            stroke="#E5B54F"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M6 18L12 12L18 7"
            stroke="#E8CF7A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="brand-name">APIx <span className="brand-sub">India</span></span>
    </a>
  );
}
