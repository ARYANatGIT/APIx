import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles, Plane, Calendar, Database, TrendingUp, Layers, Activity, Download, FileText, Code } from 'lucide-react';

export default function BookingModal({
  isOpen,
  onClose,
  route,
  advanceWindow,
  indexFrequency,
  dataSource
}) {
  const [exported, setExported] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card flight-booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modal-booking-content">
          <div className="modal-header">
            <span className="modal-badge"><Sparkles size={14} /> MoSPI • NSO • RBI Analytics</span>
            <h2>Real-Time Airfare Price Index (APIx)</h2>
            <p className="modal-subtitle">High-Frequency Retail Inflation Augmentation for CPI Transport Sub-Group</p>
          </div>

          <div className="flight-route-hero-card">
            <div className="frh-airliner">Sector: {route.name}</div>
            <div className="frh-route-title">Current Sector Index: 126.8 <span style={{ fontSize: '0.85rem', color: '#88e0a8', fontWeight: 600 }}>(+3.4% MoM)</span></div>
          </div>

          <div className="modal-summary-grid">
            <div className="summary-item">
              <Plane size={18} className="item-icon" />
              <div>
                <div className="item-label">Sector & Weight</div>
                <div className="item-val">{route.code} • {route.trafficWeight || 'DGCA Basket'}</div>
              </div>
            </div>

            <div className="summary-item">
              <Calendar size={18} className="item-icon" />
              <div>
                <div className="item-label">Advance Window</div>
                <div className="item-val">{advanceWindow}</div>
              </div>
            </div>

            <div className="summary-item">
              <TrendingUp size={18} className="item-icon" />
              <div>
                <div className="item-label">Index Frequency</div>
                <div className="item-val">{indexFrequency}</div>
              </div>
            </div>

            <div className="summary-item">
              <Database size={18} className="item-icon" />
              <div>
                <div className="item-label">Extraction Sources</div>
                <div className="item-val">{dataSource}</div>
              </div>
            </div>
          </div>

          {/* Fare Components Separation */}
          <div className="modal-price-breakdown">
            <div className="price-row">
              <span>Cleaned Base Fare (Weighted Average)</span>
              <span>₹4,750</span>
            </div>
            <div className="price-row">
              <span>Aviation Turbine Fuel (ATF) & Fuel Surcharge</span>
              <span>₹650</span>
            </div>
            <div className="price-row">
              <span>User Development Fee (UDF) & Passenger Service (PSF)</span>
              <span>₹420</span>
            </div>
            <div className="price-row">
              <span>Goods & Services Tax (GST 5% Economy / 12% Business)</span>
              <span>₹250</span>
            </div>
            <div className="price-divider" />
            <div className="price-row total-row">
              <span>Total Normalised Sector Airfare</span>
              <span>₹6,070</span>
            </div>
          </div>

          <div className="modal-guarantee">
            <ShieldCheck size={18} />
            <span>Ethical multi-source scraping compliant with robots.txt, rate-limiting & outlier removal.</span>
          </div>

          <div className="modal-actions">
            <button
              className="btn-modal-cancel"
              onClick={() => {
                const jsonStr = JSON.stringify({
                  sector: route.code,
                  advance_window: advanceWindow,
                  frequency: indexFrequency,
                  apix_value: 126.8,
                  base_fare: 4750,
                  taxes_udf: 1320,
                  total_fare: 6070,
                  sources_scraped: ["IndiGo", "Air India", "Akasa Air", "SpiceJet", "MakeMyTrip", "EaseMyTrip", "Cleartrip"],
                  timestamp: new Date().toISOString()
                }, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `APIx_${route.code.replace(/[^A-Z]/g, '')}_${advanceWindow}.json`;
                a.click();
              }}
            >
              <Code size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Export RBI API JSON
            </button>
            <button className="btn-modal-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
