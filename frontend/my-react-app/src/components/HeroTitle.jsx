import React from 'react';

/**
 * HeroTitle:
 * Words separated into spans for the cinematic word-by-word blur-in reveal
 * (Matching reference: "Find" -> "Your" -> "Perfect").
 */
export default function HeroTitle() {
  return (
    <div className="hero-title-section">
      <h1 className="hero-main-heading">
        <span className="hero-word-reveal word-1">Real-Time</span>{' '}
        <span className="hero-word-reveal word-2">Airfare</span>{' '}
        <span className="hero-word-reveal word-3 highlight-space">Price Index</span>
      </h1>
    </div>
  );
}
