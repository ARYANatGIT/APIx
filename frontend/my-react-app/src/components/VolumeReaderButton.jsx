import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { togglePageReader, stopPageReader, subscribeSpeechState, getIsSpeaking } from '../services/speechReader';

export default function VolumeReaderButton({ activeTab, size = 'normal', showLabel = true }) {
  const [isSpeaking, setIsSpeaking] = useState(getIsSpeaking());
  const [currentSentence, setCurrentSentence] = useState('');

  // Subscribe to speech state changes
  useEffect(() => {
    const unsubscribe = subscribeSpeechState(({ isSpeaking, currentSentence }) => {
      setIsSpeaking(isSpeaking);
      setCurrentSentence(currentSentence);
    });
    return unsubscribe;
  }, []);

  // Automatically cancel speech when user navigates to another view
  useEffect(() => {
    stopPageReader();
  }, [activeTab]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePageReader();
  };

  const isCompact = size === 'compact';

  return (
    <button
      type="button"
      className={`volume-reader-btn ${isSpeaking ? 'is-speaking' : ''} ${isCompact ? 'compact-volume-btn' : ''}`}
      onClick={handleClick}
      aria-label={isSpeaking ? 'Stop reading page aloud' : 'Read current page aloud'}
      aria-pressed={isSpeaking}
      title={isSpeaking ? 'Click to stop reading page' : 'Listen to current page text aloud'}
    >
      <div className="volume-icon-wrapper">
        {isSpeaking ? (
          <VolumeX
            size={isCompact ? 13 : 15}
            strokeWidth={2.2}
            className="volume-icon speaking-pulse"
          />
        ) : (
          <Volume2
            size={isCompact ? 13 : 15}
            strokeWidth={1.8}
            className="volume-icon"
          />
        )}
      </div>

      {showLabel && (
        <span className="volume-btn-label">
          {isSpeaking ? 'Stop' : 'Listen'}
        </span>
      )}

      {isSpeaking && (
        <span className="speech-equalizer-bars" aria-hidden="true">
          <span className="eq-bar bar-1" />
          <span className="eq-bar bar-2" />
          <span className="eq-bar bar-3" />
        </span>
      )}
    </button>
  );
}

