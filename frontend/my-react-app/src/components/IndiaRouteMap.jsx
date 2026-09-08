import React, { useState } from 'react';
import { Plane, Compass, Navigation2, Info, MapPin } from 'lucide-react';

// City node coordinates on a 600x680 SVG canvas representing India's air space
const CITY_COORDS = {
  DEL: { x: 250, y: 155, name: 'Delhi', code: 'DEL', airport: 'Indira Gandhi Int’l' },
  BOM: { x: 175, y: 395, name: 'Mumbai', code: 'BOM', airport: 'Chhatrapati Shivaji Maharaj' },
  BLR: { x: 270, y: 535, name: 'Bengaluru', code: 'BLR', airport: 'Kempegowda Int’l' },
  CCU: { x: 490, y: 295, name: 'Kolkata', code: 'CCU', airport: 'Netaji Subhash Chandra Bose' },
  HYD: { x: 285, y: 440, name: 'Hyderabad', code: 'HYD', airport: 'Rajiv Gandhi Int’l' },
  MAA: { x: 325, y: 540, name: 'Chennai', code: 'MAA', airport: 'Chennai Int’l' },
  GOI: { x: 190, y: 485, name: 'Goa', code: 'GOI', airport: 'Dabolim / Manohar Int’l' }
};

export default function IndiaRouteMap({ routes = [], onSelectRoute, selectedRouteCode }) {
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);

  const activeRoute = routes.find(r => r.route_code === (hoveredRoute || selectedRouteCode)) || routes[0];

  return (
    <div className="india-map-container">
      <div className="map-panel-header">
        <div>
          <div className="map-badge-pill">
            <Compass size={13} className="spin-slow" />
            <span>DGCA AIR CORRIDORS RADAR</span>
          </div>
          <h3 className="map-title">Indian Domestic Route Basket</h3>
          <p className="map-subtitle">Top 10 High-Density Corridors • Official MoSPI Consumer Price Index (CPI) Basket</p>
        </div>

        {activeRoute && (
          <div className="map-active-corridor-card">
            <div className="corridor-top-row">
              <span className="corridor-code">{activeRoute.route_code}</span>
              <span className="corridor-weight">{activeRoute.weight_pct_str || `${(activeRoute.weight * 100).toFixed(2)}%`} Weight</span>
            </div>
            <div className="corridor-names">
              {activeRoute.origin_city} ➔ {activeRoute.destination_city}
            </div>
            <div className="corridor-metrics">
              <span><strong>{activeRoute.distance_km} km</strong> Great-Circle</span>
              <span>•</span>
              <span><strong>{(activeRoute.annual_passengers || 0).toLocaleString()}</strong> Pax/yr</span>
            </div>
          </div>
        )}
      </div>

      <div className="svg-map-wrapper">
        <svg
          viewBox="0 0 600 680"
          className="india-air-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Radial glow for airport beacons */}
            <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E5B54F" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#E5B54F" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBE697" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#E5B54F" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E6347A" stopOpacity="1" />
              <stop offset="100%" stopColor="#FBE697" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Stylized background airspace grid & radar rings */}
          <circle cx="300" cy="340" r="280" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="300" cy="340" r="190" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="300" cy="340" r="100" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="4 4" />
          
          <line x1="300" y1="50" x2="300" y2="630" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
          <line x1="40" y1="340" x2="560" y2="340" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />

          {/* Flight Trajectory Great-Circle Arcs */}
          {routes.map((r) => {
            const orig = CITY_COORDS[r.origin_code];
            const dest = CITY_COORDS[r.destination_code];
            if (!orig || !dest) return null;

            // Calculate subtle curved control point for great circle arc
            const dx = dest.x - orig.x;
            const dy = dest.y - orig.y;
            const cx = (orig.x + dest.x) / 2 - dy * 0.18;
            const cy = (orig.y + dest.y) / 2 + dx * 0.18;

            const isSelected = (r.route_code === selectedRouteCode);
            const isHovered = (r.route_code === hoveredRoute);
            const strokeWidth = isSelected || isHovered ? 3.5 : Math.max(1.8, (r.weight || 0.1) * 12);

            return (
              <g
                key={r.route_code}
                className="route-path-group"
                onMouseEnter={() => setHoveredRoute(r.route_code)}
                onMouseLeave={() => setHoveredRoute(null)}
                onClick={() => onSelectRoute && onSelectRoute(r)}
                style={{ cursor: 'pointer' }}
              >
                {/* Wider invisible stroke for easy hover target */}
                <path
                  d={`M ${orig.x} ${orig.y} Q ${cx} ${cy} ${dest.x} ${dest.y}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                />

                {/* Visible route curve */}
                <path
                  d={`M ${orig.x} ${orig.y} Q ${cx} ${cy} ${dest.x} ${dest.y}`}
                  fill="none"
                  stroke={isSelected || isHovered ? "url(#activeGrad)" : "url(#corridorGrad)"}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isSelected || isHovered ? "none" : "5 3"}
                  className={`route-arc ${isSelected ? 'selected-arc' : ''}`}
                />

                {/* Animated flight dot moving along arc */}
                {(isSelected || isHovered) && (
                  <circle
                    r="4"
                    fill="#FBE697"
                    filter="drop-shadow(0 0 6px #FBE697)"
                  >
                    <animateMotion
                      path={`M ${orig.x} ${orig.y} Q ${cx} ${cy} ${dest.x} ${dest.y}`}
                      dur="3.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Airport City Nodes */}
          {Object.entries(CITY_COORDS).map(([code, city]) => {
            const isCityHovered = hoveredCity === code;

            return (
              <g
                key={code}
                className="airport-node-group"
                onMouseEnter={() => setHoveredCity(code)}
                onMouseLeave={() => setHoveredCity(null)}
                transform={`translate(${city.x}, ${city.y})`}
              >
                {/* Radar beacon pulse ring */}
                <circle cx="0" cy="0" r="14" fill="url(#beaconGlow)" className="radar-beacon-anim" />
                <circle cx="0" cy="0" r="5" fill="#E5B54F" stroke="#ffffff" strokeWidth="1.5" />

                {/* Airport Label Badge */}
                <g transform="translate(10, -8)">
                  <rect
                    x="0"
                    y="0"
                    width="42"
                    height="18"
                    rx="9"
                    fill="rgba(22, 26, 23, 0.88)"
                    stroke="rgba(251, 230, 151, 0.45)"
                    strokeWidth="1"
                  />
                  <text
                    x="21"
                    y="13"
                    textAnchor="middle"
                    fill="#FBE697"
                    fontSize="10"
                    fontWeight="700"
                    letterSpacing="0.5"
                  >
                    {code}
                  </text>
                </g>

                {/* City name caption */}
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.8)"
                  fontSize="10"
                  fontWeight="500"
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="map-legend-row">
        <div className="legend-item">
          <span className="legend-line line-solid"></span>
          <span>Higher Weight Corridor (DEL-BOM 22.35%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line line-dashed"></span>
          <span>Standard Basket Corridors</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-pulse"></span>
          <span>DGCA Monitored Airport Node</span>
        </div>
      </div>
    </div>
  );
}
