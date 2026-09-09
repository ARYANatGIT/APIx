import React, { useState } from 'react';

export default function FeatureBadge({ label, positionClass, tooltipText }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`feature-badge ${positionClass}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="button"
      tabIndex={0}
    >
      <span className="badge-bullet">■</span>
      <span className="badge-text">{label}</span>

      {tooltipText && showTooltip && (
        <div className="badge-tooltip" role="tooltip">
          {tooltipText}
        </div>
      )}
    </div>
  );
}
