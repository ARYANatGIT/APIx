import React, { useState, useRef, useEffect } from 'react';
import { Plane, Calendar, Database, ChevronDown, Check, TrendingUp } from 'lucide-react';

export default function BookingBar({
  selectedRoute,
  setSelectedRoute,
  advanceWindow,
  setAdvanceWindow,
  indexFrequency,
  setIndexFrequency,
  dataSource,
  setDataSource,
  onGenerateIndex,
  routes = []
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const defaultSectorList = [
    { code: 'DEL ✈ BOM', route_code: 'DEL-BOM', name: 'Delhi (DEL) → Mumbai (BOM)', trafficWeight: '22.35% DGCA Basket', avgFare: '₹6,840', distance: 1148, pax: '7,420,000' },
    { code: 'DEL ✈ BLR', route_code: 'DEL-BLR', name: 'Delhi (DEL) → Bengaluru (BLR)', trafficWeight: '14.91% DGCA Basket', avgFare: '₹7,920', distance: 1740, pax: '4,950,000' },
    { code: 'BOM ✈ BLR', route_code: 'BOM-BLR', name: 'Mumbai (BOM) → Bengaluru (BLR)', trafficWeight: '11.08% DGCA Basket', avgFare: '₹4,960', distance: 842, pax: '3,680,000' },
    { code: 'DEL ✈ CCU', route_code: 'DEL-CCU', name: 'Delhi (DEL) → Kolkata (CCU)', trafficWeight: '9.49% DGCA Basket', avgFare: '₹6,420', distance: 1305, pax: '3,150,000' },
    { code: 'BLR ✈ HYD', route_code: 'BLR-HYD', name: 'Bengaluru (BLR) → Hyderabad (HYD)', trafficWeight: '8.49% DGCA Basket', avgFare: '₹3,850', distance: 500, pax: '2,820,000' },
    { code: 'MAA ✈ DEL', route_code: 'MAA-DEL', name: 'Chennai (MAA) → Delhi (DEL)', trafficWeight: '7.95% DGCA Basket', avgFare: '₹7,890', distance: 1760, pax: '2,640,000' },
    { code: 'DEL ✈ HYD', route_code: 'DEL-HYD', name: 'Delhi (DEL) → Hyderabad (HYD)', trafficWeight: '7.56% DGCA Basket', avgFare: '₹6,280', distance: 1255, pax: '2,510,000' },
    { code: 'BOM ✈ GOI', route_code: 'BOM-GOI', name: 'Mumbai (BOM) → Goa (GOI)', trafficWeight: '6.63% DGCA Basket', avgFare: '₹3,620', distance: 435, pax: '2,200,000' },
    { code: 'BOM ✈ MAA', route_code: 'BOM-MAA', name: 'Mumbai (BOM) → Chennai (MAA)', trafficWeight: '5.96% DGCA Basket', avgFare: '₹5,480', distance: 1030, pax: '1,980,000' },
    { code: 'CCU ✈ BLR', route_code: 'CCU-BLR', name: 'Kolkata (CCU) → Bengaluru (BLR)', trafficWeight: '5.57% DGCA Basket', avgFare: '₹7,120', distance: 1540, pax: '1,850,000' },
  ];

  const sectorList = (routes && routes.length > 0)
    ? routes.map(r => ({
        code: `${r.origin_code} ✈ ${r.destination_code}`,
        route_code: r.route_code,
        name: `${r.origin_city} (${r.origin_code}) → ${r.destination_city} (${r.destination_code})`,
        trafficWeight: r.weight_pct_str ? `${r.weight_pct_str} DGCA Basket` : `${((r.weight || 0.1) * 100).toFixed(2)}% DGCA Basket`,
        avgFare: `₹${Math.round(r.average_fare || 6500).toLocaleString()}`,
        distance: r.distance_km,
        pax: (r.annual_passengers || 0).toLocaleString(),
        average_fare: r.average_fare
      }))
    : defaultSectorList;

  const advanceWindowsList = [
    { code: 'T+1 Day', desc: 'Last-minute dynamic spot pricing' },
    { code: 'T+7 Days', desc: 'Weekly advance-purchase window' },
    { code: 'T+15 Days', desc: 'Mid-term advance booking curve' },
    { code: 'T+30 Days', desc: 'Standard monthly advance window' },
    { code: 'T+45 Days', desc: 'Early horizon baseline fare' },
  ];

  const frequencyList = [
    { code: 'Daily Real-time', desc: 'High-frequency automated scrape index' },
    { code: 'Weekly Aggregated', desc: 'Smoothed 7-day trailing moving average' },
    { code: 'Monthly CPI Base', desc: 'Augmentation for MoSPI / NSO CPI framework' },
  ];

  const sourceList = [
    { code: '5 Airlines + 6 OTAs', desc: 'IndiGo, Air India, Akasa, SpiceJet + MMT, EaseMyTrip, Cleartrip' },
    { code: 'Direct Airlines Only', desc: 'Primary carrier portal web-scraping' },
    { code: 'Leading OTAs Only', desc: 'Online Travel Aggregator price quotes' },
  ];

  const barRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (barRef.current && !barRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div className="booking-bar-wrapper" ref={barRef}>
      <div className="booking-capsule-bar">
        {/* Field 1: Sector Pair */}
        <div
          className={`booking-field-item ${activeDropdown === 'sector' ? 'field-active' : ''}`}
          onClick={() => toggleDropdown('sector')}
        >
          <div className="field-icon-box">
            <Plane size={15} strokeWidth={1.5} className="field-icon" />
          </div>
          <div className="field-text-content">
            <span className="field-label">CORRIDOR BASKET</span>
            <span className="field-value">{selectedRoute.code}</span>
          </div>
          <ChevronDown size={14} strokeWidth={1.5} className={`field-chevron ${activeDropdown === 'sector' ? 'rotated' : ''}`} />

          {activeDropdown === 'sector' && (
            <div className="booking-dropdown-popover sector-popover" onClick={(e) => e.stopPropagation()}>
              <div className="popover-title">DGCA HIGH-DENSITY CORRIDORS</div>
              <div className="popover-list">
                {sectorList.map((s) => (
                  <div
                    key={s.route_code}
                    className={`popover-option ${selectedRoute.route_code === s.route_code ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedRoute(s);
                      setActiveDropdown(null);
                    }}
                  >
                    <div className="option-info">
                      <div className="option-name">{s.name}</div>
                      <div className="option-subtitle">{s.trafficWeight} • {s.distance} km • Avg {s.avgFare}</div>
                    </div>
                    {selectedRoute.route_code === s.route_code && <Check size={15} strokeWidth={2} className="option-check" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="booking-divider" />

        {/* Field 2: Advance Window */}
        <div
          className={`booking-field-item ${activeDropdown === 'window' ? 'field-active' : ''}`}
          onClick={() => toggleDropdown('window')}
        >
          <div className="field-icon-box">
            <Calendar size={15} strokeWidth={1.5} className="field-icon" />
          </div>
          <div className="field-text-content">
            <span className="field-label">PURCHASE HORIZON</span>
            <span className="field-value">{advanceWindow}</span>
          </div>
          <ChevronDown size={14} strokeWidth={1.5} className={`field-chevron ${activeDropdown === 'window' ? 'rotated' : ''}`} />

          {activeDropdown === 'window' && (
            <div className="booking-dropdown-popover window-popover" onClick={(e) => e.stopPropagation()}>
              <div className="popover-title">BOOKING ADVANCE WINDOW</div>
              <div className="popover-list">
                {advanceWindowsList.map((w) => (
                  <div
                    key={w.code}
                    className={`popover-option ${advanceWindow === w.code ? 'selected' : ''}`}
                    onClick={() => {
                      setAdvanceWindow(w.code);
                      setActiveDropdown(null);
                    }}
                  >
                    <div className="option-info">
                      <div className="option-name">{w.code}</div>
                      <div className="option-subtitle">{w.desc}</div>
                    </div>
                    {advanceWindow === w.code && <Check size={15} strokeWidth={2} className="option-check" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="booking-divider" />

        {/* Field 3: Frequency */}
        <div
          className={`booking-field-item ${activeDropdown === 'frequency' ? 'field-active' : ''}`}
          onClick={() => toggleDropdown('frequency')}
        >
          <div className="field-icon-box">
            <TrendingUp size={15} strokeWidth={1.5} className="field-icon" />
          </div>
          <div className="field-text-content">
            <span className="field-label">SAMPLING CADENCE</span>
            <span className="field-value">{indexFrequency}</span>
          </div>
          <ChevronDown size={14} strokeWidth={1.5} className={`field-chevron ${activeDropdown === 'frequency' ? 'rotated' : ''}`} />

          {activeDropdown === 'frequency' && (
            <div className="booking-dropdown-popover date-popover" onClick={(e) => e.stopPropagation()}>
              <div className="popover-title">INDEX COMPUTATION CADENCE</div>
              <div className="popover-list">
                {frequencyList.map((f) => (
                  <div
                    key={f.code}
                    className={`popover-option ${indexFrequency === f.code ? 'selected' : ''}`}
                    onClick={() => {
                      setIndexFrequency(f.code);
                      setActiveDropdown(null);
                    }}
                  >
                    <div className="option-info">
                      <div className="option-name">{f.code}</div>
                      <div className="option-subtitle">{f.desc}</div>
                    </div>
                    {indexFrequency === f.code && <Check size={15} strokeWidth={2} className="option-check" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="booking-divider" />

        {/* Field 4: Sources */}
        <div
          className={`booking-field-item ${activeDropdown === 'sources' ? 'field-active' : ''}`}
          onClick={() => toggleDropdown('sources')}
        >
          <div className="field-icon-box">
            <Database size={15} strokeWidth={1.5} className="field-icon" />
          </div>
          <div className="field-text-content">
            <span className="field-label">INGESTION CHANNELS</span>
            <span className="field-value">{dataSource.split(' ')[0]} Sources</span>
          </div>
          <ChevronDown size={14} strokeWidth={1.5} className={`field-chevron ${activeDropdown === 'sources' ? 'rotated' : ''}`} />

          {activeDropdown === 'sources' && (
            <div className="booking-dropdown-popover guests-popover" onClick={(e) => e.stopPropagation()}>
              <div className="popover-title">CARRIER PORTALS & OTAs</div>
              <div className="popover-list">
                {sourceList.map((s) => (
                  <div
                    key={s.code}
                    className={`popover-option ${dataSource === s.code ? 'selected' : ''}`}
                    onClick={() => {
                      setDataSource(s.code);
                      setActiveDropdown(null);
                    }}
                  >
                    <div className="option-info">
                      <div className="option-name">{s.code}</div>
                      <div className="option-subtitle">{s.desc}</div>
                    </div>
                    {dataSource === s.code && <Check size={15} strokeWidth={2} className="option-check" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Button - Bold Vermillion Primary */}
        <button
          type="button"
          className="btn-book-stay btn-book-flight-cta"
          onClick={onGenerateIndex}
          aria-label="Compute Real-Time Airfare Price Index"
        >
          <span>COMPUTE APIx</span>
        </button>
      </div>
    </div>
  );
}
