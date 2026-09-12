import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Headphones, Minus, Maximize2, X } from 'lucide-react';
import { togglePageReader, stopPageReader, subscribeSpeechState, getIsSpeaking } from '../services/speechReader';

export default function FloatingPageReader({ activeTab }) {
  const [isSpeaking, setIsSpeaking] = useState(getIsSpeaking());
  const [currentSentence, setCurrentSentence] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    // Default minimized on Air Intel to maximize content visibility
    if (activeTab === 'spikes') return true;
    try {
      return localStorage.getItem('airsetu_reader_minimized') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const unsubscribe = subscribeSpeechState(({ isSpeaking, currentSentence, currentWord }) => {
      setIsSpeaking(isSpeaking);
      setCurrentSentence(currentSentence || '');
      setCurrentWord(currentWord || '');
      if (isSpeaking) {
        setIsDismissed(false); // automatically show when speech starts
      }
    });
    return unsubscribe;
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePageReader();
  };

  const handleMinimizeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('airsetu_reader_minimized', String(next));
      } catch {}
      return next;
    });
  };

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    stopPageReader();
    setIsDismissed(true);
  };

  // If dismissed and not actively speaking, do not render
  if (isDismissed && !isSpeaking) {
    return null;
  }

  // If minimized, render a discreet circular floating badge
  if (isMinimized) {
    return (
      <div
        className={`floating-page-reader minimized ${isSpeaking ? 'speaking-active' : ''}`}
        role="region"
        aria-label="Screen Reader Audio Player (Minimized)"
      >
        <button
          type="button"
          className="floating-reader-minimized-btn"
          onClick={handleToggle}
          aria-label={isSpeaking ? 'Stop reading page aloud' : 'Read full page aloud'}
          title={isSpeaking ? 'Speaking... Click to stop (Click arrow to expand)' : 'Read page aloud (Click arrow to expand)'}
        >
          {isSpeaking ? (
            <div className="mini-speech-waves">
              <span className="mini-wave" />
              <span className="mini-wave" />
              <span className="mini-wave" />
            </div>
          ) : (
            <Headphones size={15} strokeWidth={2.2} className="reader-icon" />
          )}
        </button>
        <button
          type="button"
          className="reader-expand-tab"
          onClick={handleMinimizeToggle}
          aria-label="Expand voice reader widget"
          title="Expand voice reader widget"
        >
          <Maximize2 size={10} strokeWidth={2.4} />
        </button>
      </div>
    );
  }

  // Full Expanded floating pill
  return (
    <div
      className={`floating-page-reader ${isSpeaking ? 'speaking-active' : ''}`}
      role="region"
      aria-label="Screen Reader Audio Player"
    >
      <button
        type="button"
        className="floating-reader-btn"
        onClick={handleToggle}
        aria-label={isSpeaking ? 'Stop reading page aloud' : 'Read full page aloud'}
        title={isSpeaking ? 'Click to stop reading' : 'Read all text on this page aloud'}
      >
        <div className="floating-reader-icon-wrap">
          {isSpeaking ? (
            <VolumeX size={16} strokeWidth={2.4} className="reader-icon active-icon" />
          ) : (
            <Headphones size={16} strokeWidth={2} className="reader-icon" />
          )}
        </div>

        <div className="floating-reader-content">
          <span className="floating-reader-title">
            {isSpeaking ? 'Reading Page Aloud' : 'Read Page Aloud'}
          </span>
          {isSpeaking && (currentWord || currentSentence) && (
            <span className="floating-reader-sub">
              {currentWord && <span className="spoken-word-badge">{currentWord}</span>}
              <span className="spoken-sentence-preview">
                {currentSentence.length > 28 ? `${currentSentence.slice(0, 28)}...` : currentSentence}
              </span>
            </span>
          )}
        </div>

        {isSpeaking ? (
          <div className="speech-wave-indicator" aria-hidden="true">
            <span className="wave-bar w1" />
            <span className="wave-bar w2" />
            <span className="wave-bar w3" />
            <span className="wave-bar w4" />
          </div>
        ) : (
          <span className="floating-reader-action-tag">Listen</span>
        )}
      </button>

      {/* Minimize Button */}
      <button
        type="button"
        className="floating-reader-minimize-btn"
        onClick={handleMinimizeToggle}
        aria-label="Minimize voice reader widget"
        title="Minimize voice reader widget so it takes less space"
      >
        <Minus size={13} strokeWidth={2.6} />
      </button>

      {/* Dismiss Button */}
      <button
        type="button"
        className="floating-reader-minimize-btn"
        onClick={handleDismiss}
        aria-label="Hide voice reader widget"
        title="Hide voice reader widget"
      >
        <X size={12} strokeWidth={2.6} />
      </button>
    </div>
  );
}
