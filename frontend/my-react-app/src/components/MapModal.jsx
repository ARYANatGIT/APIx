import React from 'react';
import { X, Navigation, Compass, Plane, Wind, Gauge, Radio, ShieldCheck } from 'lucide-react';
import radarMapImg from '../assets/radar-map.jpg';

export default function MapModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card map-modal-card flight-radar-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="map-modal-content">
          <div className="map-visual-wrap flight-map-visual">
            <img src={radarMapImg} alt="Flight Air Traffic Radar" className="map-full-img" />
            <div className="radar-sweep-beam-large"></div>
            <div className="map-pin-pulse">
              <div className="pin-ring"></div>
              <div className="flight-radar-marker">
                <Plane size={18} className="marker-plane" />
              </div>
            </div>
            <div className="live-alt-tag">FL380 • 38,000 FT</div>
          </div>

          <div className="map-details-wrap">
            <div className="map-badge"><Radio size={14} /> LIVE ADS-B RADAR: HA-884</div>
            <h2>Boeing 787-9 Dreamliner</h2>
            <p className="map-desc">
              Currently en route over the North Atlantic oceanic corridor, tracking great-circle navigation waypoint Alpha-Victor.
            </p>

            <div className="trail-highlights flight-telemetry-highlights">
              <div className="trail-item">
                <Gauge size={18} />
                <div>
                  <div className="th-title">Ground Speed & Mach</div>
                  <div className="th-sub">564 knots (1,045 km/h) • Mach 0.85</div>
                </div>
              </div>
              <div className="trail-item">
                <Wind size={18} />
                <div>
                  <div className="th-title">Atmospheric Conditions</div>
                  <div className="th-sub">Smooth air • Tailwind +42 knots • Outside Temp -54°C</div>
                </div>
              </div>
              <div className="trail-item">
                <Compass size={18} />
                <div>
                  <div className="th-title">Heading & ETA</div>
                  <div className="th-sub">HDG 074° • ETA London Heathrow: 06:45 AM GMT</div>
                </div>
              </div>
            </div>

            <button className="btn-modal-primary" onClick={onClose}>
              Return to Flight Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
