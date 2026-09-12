import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { togglePageReader, stopPageReader, subscribeSpeechState, getIsSpeaking } from '../services/speechReader';

export default function FloatingPageReader({ activeTab }) {
  const [isSpeaking, setIsSpeaking] = useState(getIsSpeaking());
  const [currentSentence, setCurrentSentence] = useState('');
  const [currentWord, setCurrentWord] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeSpeechState(({ isSpeaking, currentSentence, currentWord }) => {
      setIsSpeaking(isSpeaking);
      setCurrentSentence(currentSentence || '');
      setCurrentWord(currentWord || '');
    });
    return unsubscribe;
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePageReader();
  };

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
                {currentSentence.length > 34 ? `${currentSentence.slice(0, 34)}...` : currentSentence}
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
    </div>
  );
}
