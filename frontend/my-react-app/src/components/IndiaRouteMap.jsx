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
              <span className="corridor-weight">{activeRoute.weight_pct_str || `${((activeRoute.weight || 0.1) * 100).toFixed(2)}%`} Weight</span>
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
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
            </linearGradient>

            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
            </linearGradient>

            {/* Filter for clean shadow on the map outline */}
            <filter id="mapShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Stylized background airspace grid & radar rings */}
          <circle cx="300" cy="340" r="280" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="300" cy="340" r="190" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="300" cy="340" r="100" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

          <line x1="300" y1="40" x2="300" y2="640" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="40" y1="340" x2="560" y2="340" stroke="#f1f5f9" strokeWidth="1" />

          {/* Authentic India Geographic Landmass SVG Outline */}
          <g className="india-landmass-layer" filter="url(#mapShadow)">
            <path
              d="M 250,45 
                 C 240,60 215,80 205,100
                 C 195,120 190,140 185,160
                 C 170,185 150,215 140,240
                 C 130,265 110,285 95,305
                 C 90,315 105,325 125,325
                 C 145,325 145,340 135,355
                 C 125,370 140,385 155,380
                 C 170,375 180,390 178,410
                 C 175,440 185,475 190,500
                 C 195,530 210,570 230,600
                 C 245,620 270,645 285,655
                 C 295,645 315,600 325,565
                 C 335,530 355,480 375,450
                 C 395,420 425,380 445,350
                 C 465,320 480,295 495,290
                 C 505,290 515,270 500,255
                 C 485,240 480,230 495,225
                 C 520,215 545,205 565,215
                 C 575,220 570,235 550,245
                 C 530,255 520,270 505,280
                 C 485,295 470,315 460,335
                 C 450,305 455,270 465,245
                 C 475,220 455,215 440,225
                 C 420,240 395,215 365,210
                 C 335,205 310,185 290,170
                 C 270,155 260,110 258,80
                 Z"
              fill="#f1f5f9"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Regional Air Corridor Guidemarks */}
            <path d="M 140,240 Q 250,250 365,210" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M 178,410 Q 285,440 445,350" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M 190,500 Q 270,535 325,565" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
          </g>

          {/* Flight Trajectory Great-Circle Arcs across India */}
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
            const strokeWidth = isSelected || isHovered ? 4 : Math.max(2.2, (r.weight || 0.1) * 12);

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
                  strokeWidth="24"
                />

                {/* Visible route curve */}
                <path
                  d={`M ${orig.x} ${orig.y} Q ${cx} ${cy} ${dest.x} ${dest.y}`}
                  fill="none"
                  stroke={isSelected || isHovered ? "url(#activeGrad)" : "url(#corridorGrad)"}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isSelected || isHovered ? "none" : "6 4"}
                  className={`route-arc ${isSelected ? 'selected-arc' : ''}`}
                />

                {/* Animated flight dot moving along arc */}
                {(isSelected || isHovered) && (
                  <circle
                    r="5"
                    fill="#e11d48"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter="drop-shadow(0 0 6px #e11d48)"
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

          {/* Airport City Nodes on Indian Map */}
          {Object.entries(CITY_COORDS).map(([code, city]) => {
            const isCityHovered = hoveredCity === code;

            return (
              <g
                key={code}
                className="airport-node-group"
                onMouseEnter={() => setHoveredCity(code)}
                onMouseLeave={() => setHoveredCity(null)}
                transform={`translate(${city.x}, ${city.y})`}
                style={{ cursor: 'pointer' }}
              >
                {/* Radar beacon pulse ring */}
                <circle cx="0" cy="0" r="16" fill="url(#beaconGlow)" className="radar-beacon-anim" />
                <circle cx="0" cy="0" r="5.5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />

                {/* Airport Label Badge */}
                <g transform="translate(10, -10)">
                  <rect
                    x="0"
                    y="0"
                    width="44"
                    height="20"
                    rx="10"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.1))"
                  />
                  <text
                    x="22"
                    y="14"
                    textAnchor="middle"
                    fill="#1e40af"
                    fontSize="11"
                    fontWeight="800"
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
                  fill="#0f172a"
                  fontSize="11"
                  fontWeight="700"
                  filter="drop-shadow(0 1px 2px rgba(255,255,255,0.9))"
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
          <span>Selected / Active Corridor (DEL-BOM 22.35%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line line-dashed"></span>
          <span>Official DGCA Basket Corridors</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-pulse"></span>
          <span>Monitored Indian Airport Node</span>
        </div>
      </div>
    </div>
  );
}
