import React, { useState } from 'react';
import { Plane, Compass } from 'lucide-react';
import radarMapImg from '../assets/radar-map.jpg';

export default function MiniMap({ onOpenMapModal }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="mini-map-widget-container flight-radar-container"
      onClick={onOpenMapModal}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click to view live DGCA domestic corridor telemetry & flight radar"
      role="button"
      tabIndex={0}
    >
      <div className="mini-map-circle flight-radar-circle">
        <img
          src={radarMapImg}
          alt="DGCA Air Traffic Radar Map"
          className="mini-map-img"
        />

        {/* Dynamic Rotating Radar Sweep Line */}
        <div className="radar-sweep-beam"></div>

        {/* Flight Trajectory Route Arc (DEL -> BOM) */}
        <svg className="radar-flight-path" viewBox="0 0 100 100">
          <path
            d="M 30 20 Q 25 55 28 85"
            fill="none"
            stroke="rgba(248, 220, 129, 0.85)"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Center Airplane Indicator & Beacon Pulse */}
        <div className="radar-crosshair flight-radar-center">
          <div className="radar-pulse-ring ring-1"></div>
          <div className="radar-pulse-ring ring-2"></div>
          <div className="plane-radar-icon-box">
            <Plane size={13} className="plane-mini-icon" />
          </div>
        </div>

        {/* Indian DGCA Aviation Overlays */}
        <div className="mini-map-overlay">
          <span className="map-label label-forest">DEL</span>
          <span className="map-label label-ridge">BOM</span>
        </div>

        {/* Flight Telemetry Pill */}
        <div className="radar-telemetry-badge">
          <span>FL360</span>
        </div>
      </div>

      {isHovered && (
        <div className="mini-map-hover-hint">
          <span>DGCA Radar</span>
        </div>
      )}
    </div>
  );
}
