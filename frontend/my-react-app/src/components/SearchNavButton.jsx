import React from 'react';
import { Search } from 'lucide-react';

export default function SearchNavButton({ onClick, size = 'normal' }) {
  const isCompact = size === 'compact';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <button
      type="button"
      className={`search-nav-btn ${isCompact ? 'compact-search-btn' : ''}`}
      onClick={onClick}
      aria-label="Search sections and pages (Ctrl + K)"
      title="Search sections and pages (Ctrl + K)"
    >
      <div className="search-icon-wrap">
        <Search size={isCompact ? 13 : 14} strokeWidth={2} className="search-nav-icon" />
      </div>

      <span className="search-nav-label">
        {isCompact ? 'Search' : 'Search sections...'}
      </span>

      {!isCompact && (
        <span className="search-nav-kbd" aria-hidden="true">
          <span className="kbd-symbol">{isMac ? '⌘' : 'Ctrl'}</span>
          <span className="kbd-key">K</span>
        </span>
      )}
    </button>
  );
}

