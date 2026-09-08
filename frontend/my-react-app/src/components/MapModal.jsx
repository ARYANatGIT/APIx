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
            <div className="live-alt-tag">FL360 • 36,000 FT • DEL-BOM</div>
          </div>

          <div className="map-details-wrap">
            <div className="map-badge"><Radio size={14} /> LIVE ADS-B RADAR: 6E-204 (DEL ➔ BOM)</div>
            <h2>Airbus A321neo • IndiGo</h2>
            <p className="map-desc">
              Currently en route over the Western India domestic air corridor, tracking airway W-10 from Indira Gandhi International (DEL) to Chhatrapati Shivaji Maharaj International (BOM).
            </p>

            <div className="trail-highlights flight-telemetry-highlights">
              <div className="trail-item">
                <Gauge size={18} />
                <div>
                  <div className="th-title">Ground Speed & Mach</div>
                  <div className="th-sub">462 knots (855 km/h) • Mach 0.78</div>
                </div>
              </div>
              <div className="trail-item">
                <Wind size={18} />
                <div>
                  <div className="th-title">Corridor Basket Weight</div>
                  <div className="th-sub">22.35% of MoSPI National Route Basket (7.42M Pax/yr)</div>
                </div>
              </div>
              <div className="trail-item">
                <Compass size={18} />
                <div>
                  <div className="th-title">Heading & ETA</div>
                  <div className="th-sub">HDG 198° (South-Southwest) • Distance: 1,148 km</div>
                </div>
              </div>
            </div>

            <button className="btn-modal-primary" onClick={onClose}>
              Return to Executive Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
