import React from 'react';
import airsetuLogo from '../assets/airsetu_logo.png';

export default function HeroTitle() {
  return (
    <div className="hero-title-section">
      <div className="hero-brand-badge" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '5px 14px 5px 8px',
        marginBottom: '16px',
        backdropFilter: 'blur(8px)'
      }}>
        <img src={airsetuLogo} alt="AirSetu Emblem" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.04em' }}>
          AirSetu <span style={{ color: '#94A3B8', fontWeight: 500 }}>• Official MoSPI Portal</span>
        </span>
      </div>

      <h1 className="hero-main-heading">
        <span className="hero-line-1">REAL-TIME</span>
        <span className="hero-line-2">
          AIRFARE <span className="hero-accent-word">PRICE INDEX</span>
        </span>
      </h1>

      <p className="hero-subheading">
        Automated retail fare ingestion across <span className="mono-stat">10 high-density corridors</span> and <span className="mono-stat">7 carrier feeds</span>. Providing high-frequency CPI transport price relatives via Laspeyres fixed-base basket methodology.
      </p>
    </div>
  );
}
