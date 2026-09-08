import React, { useState, useRef, useEffect } from 'react';
import { Plane, Calendar, Database, ChevronDown, Check, TrendingUp, Layers, Activity } from 'lucide-react';

export default function BookingBar({
  selectedRoute,
  setSelectedRoute,
  advanceWindow,
  setAdvanceWindow,
  indexFrequency,
  setIndexFrequency,
  dataSource,
  setDataSource,
  onGenerateIndex
}) {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'sector' | 'window' | 'frequency' | 'sources' | null

  // Top 10 Indian Domestic Corridors based on official DGCA Passenger Traffic Statistics
  const sectorList = [
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

  // Multiple advance-purchase windows
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

  // Close dropdowns on outside click
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
            <Plane size={16} className="field-icon flight-plane-icon" />
          </div>
          <div className="field-text-content">
            <span className="field-label">Sector Pair</span>
            <span className="field-value">{selectedRoute.code}</span>
          </div>
          <ChevronDown size={15} className={`field-chevron ${activeDropdown === 'sector' ? 'rotated' : ''}`} />

          {/* Sector Dropdown */}
          {activeDropdown === 'sector' && (
            <div className="booking-dropdown-popover route-popover" onClick={(e) => e.stopPropagation()}>
              <div className="popover-title">Representative DGCA City-Pairs</div>
              <div className="popover-list">
                {sectorList.map((sector) => (
                  <div
                    key={sector.code}
                    className={`popover-option ${selectedRoute.code === sector.code ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedRoute(sector);
                      setActiveDropdown(null);
                    }}
                  >
                    <div className="option-info">
                      <div className="option-name">{sector.name}</div>
                      <div className="option-subtitle">{sector.trafficWeight}</div>
                    </div>
                    <div className="option-price-tag">{sector.avgFare}</div>
                    {selectedRoute.code === sector.code && <Check size={16} className="option-check" />}
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
            <Calendar size={16} className="field-icon" />
          </div>
          <div className="field-text-content">
            <span className="field-label">Advance Window</span>
            <span className="field-value">{advanceWindow}</span>
          </div>
          <ChevronDown size={15} className={`field-chevron ${activeDropdown === 'window' ? 'rotated' : ''}`} />

          {/* Window Dropdown */}
          {activeDropdown === 'window' && (
            <div className="booking-dropdown-popover date-popover" onClick={(e) => e.stopPropagation()}>
              <div className="popover-title">Advance-Purchase Lead Time</div>
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
                    {advanceWindow === w.code && <Check size={16} className="option-check" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="booking-divider" />

        {/* Field 3: Index Frequency */}
        <div
          className={`booking-field-item ${activeDropdown === 'frequency' ? 'field-active' : ''}`}
          onClick={() => toggleDropdown('frequency')}
        >
          <div className="field-icon-box">
            <TrendingUp size={16} className="field-icon" />
          </div>
          <div className="field-text-content">
            <span className="field-label">Frequency</span>
            <span className="field-value">{indexFrequency}</span>
          </div>
          <ChevronDown size={15} className={`field-chevron ${activeDropdown === 'frequency' ? 'rotated' : ''}`} />

          {/* Frequency Dropdown */}
          {activeDropdown === 'frequency' && (
            <div className="booking-dropdown-popover date-popover" onClick={(e) => e.stopPropagation()}>
              <div className="popover-title">Index Computation Frequency</div>
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
                    {indexFrequency === f.code && <Check size={16} className="option-check" />}
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
            <Database size={16} className="field-icon" />
          </div>
          <div className="field-text-content">
            <span className="field-label">Portals & OTAs</span>
            <span className="field-value">{dataSource.split(' ')[0]} Sources</span>
          </div>
          <ChevronDown size={15} className={`field-chevron ${activeDropdown === 'sources' ? 'rotated' : ''}`} />

          {/* Sources Dropdown */}
          {activeDropdown === 'sources' && (
            <div className="booking-dropdown-popover guests-popover" onClick={(e) => e.stopPropagation()}>
              <div className="popover-title">Scraping Sources (Airlines & OTAs)</div>
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
                    {dataSource === s.code && <Check size={16} className="option-check" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button
          className="btn-book-stay btn-book-flight-cta"
          onClick={onGenerateIndex}
          aria-label="Generate Airfare Price Index"
        >
          Generate APIx
        </button>
      </div>
    </div>
  );
}
