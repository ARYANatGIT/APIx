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

        {/* Sharp Square Frame & Radar Sweep Line */}
        <div className="radar-sweep-beam"></div>

        {/* Flight Trajectory Route Arc */}
        <svg className="radar-flight-path" viewBox="0 0 100 100">
          <path
            d="M 30 20 Q 25 55 28 85"
            fill="none"
            stroke="#FF3D00"
            strokeWidth="1.8"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Center Airplane Indicator & Beacon Pulse */}
        <div className="radar-crosshair flight-radar-center">
          <div className="radar-pulse-ring ring-1"></div>
          <div className="plane-radar-icon-box">
            <Plane size={13} strokeWidth={1.5} className="plane-mini-icon" />
          </div>
        </div>

        {/* Indian DGCA Aviation Overlays */}
        <div className="mini-map-overlay">
          <span className="map-label label-forest">DEL</span>
          <span className="map-label label-ridge">BOM</span>
        </div>

        {/* Flight Telemetry Pill */}
        <div className="radar-telemetry-badge">
          <span>CORRIDORS (10)</span>
        </div>
      </div>

      {isHovered && (
        <div className="mini-map-hover-hint">
          <span>EXPAND RADAR</span>
        </div>
      )}
    </div>
  );
}
