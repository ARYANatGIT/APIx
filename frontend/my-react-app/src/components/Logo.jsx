import React from 'react';

export default function Logo({ onClick }) {
  return (
    <a
      href="#home"
      className="brand-logo"
      onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
      aria-label="APIx India Home"
    >
      <div className="logo-icon-wrap">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="logo-icon flight-logo-icon"
        >
          {/* Sharp Geometric Crosshair & Price Trajectory Mark */}
          <rect x="2" y="2" width="20" height="20" stroke="#262626" strokeWidth="1.5" fill="#0A0A0A" />
          <line x1="12" y1="2" x2="12" y2="22" stroke="#262626" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="#262626" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M5 17L11 11L15 15L19 7" stroke="#FF3D00" strokeWidth="2" strokeLinecap="square" />
          <rect x="18" y="6" width="3" height="3" fill="#FF3D00" />
        </svg>
      </div>
      <span className="brand-name">
        APIx <span className="brand-sub">INDIA</span>
      </span>
    </a>
  );
}
