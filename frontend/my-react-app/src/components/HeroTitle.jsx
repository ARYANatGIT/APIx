import React from 'react';

export default function HeroTitle() {
  return (
    <div className="hero-title-section">
      <div className="hero-eyebrow-tag">
        <span className="eyebrow-accent-bar"></span>
        <span className="eyebrow-text">01 // HIGH-FREQUENCY MACRO INFLATION AUGMENTATION</span>
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
