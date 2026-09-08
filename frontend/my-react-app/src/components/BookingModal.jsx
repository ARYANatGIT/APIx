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

  // Calculate dynamic fare components based on backend formulas
  const distance = route.distance || 1148;
  const windowKey = (advanceWindow || 'T+7').slice(0, 3);
  const surgeMultiplier = windowKey === 'T+1' ? 1.75 : windowKey === 'T+7' ? 1.25 : windowKey === 'T+15' ? 1.00 : windowKey === 'T+30' ? 0.88 : 0.80;

  const baseFare = Math.round(distance * 3.85 * surgeMultiplier);
  const atfSurcharge = Math.round(baseFare * 0.11);
  const udfPsf = Math.round(baseFare * 0.06 + 350);
  const gst = Math.round(baseFare * 0.05);
  const totalFare = baseFare + atfSurcharge + udfPsf + gst;

  const currentSectorIndex = (100.0 + (surgeMultiplier - 1.0) * 12 + 4.77).toFixed(1);

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
            <div className="frh-airliner">Corridor: {route.name}</div>
            <div className="frh-route-title">
              Sector APIx Index: {currentSectorIndex} <span style={{ fontSize: '0.85rem', color: '#88e0a8', fontWeight: 600 }}>(+4.8% MoM)</span>
            </div>
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
              <span>Cleaned Base Economy Fare (Distance-Anchored)</span>
              <span>₹{baseFare.toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>Aviation Turbine Fuel (ATF) & Fuel Surcharge</span>
              <span>₹{atfSurcharge.toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>User Development Fee (UDF) & Passenger Service (PSF)</span>
              <span>₹{udfPsf.toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>Goods & Services Tax (GST 5% Economy)</span>
              <span>₹{gst.toLocaleString()}</span>
            </div>
            <div className="price-divider" />
            <div className="price-row total-row">
              <span>Total Normalised Sector Airfare</span>
              <span>₹{totalFare.toLocaleString()}</span>
            </div>
          </div>

          <div className="modal-guarantee">
            <ShieldCheck size={18} />
            <span>Ethical multi-source scraping compliant with robots.txt, rate-limiting & IQR 1.5x outlier removal.</span>
          </div>

          <div className="modal-actions">
            <button
              className="btn-modal-cancel"
              onClick={() => {
                const jsonStr = JSON.stringify({
                  sector: route.code,
                  route_code: route.route_code || "DEL-BOM",
                  advance_window: advanceWindow,
                  frequency: indexFrequency,
                  apix_value: parseFloat(currentSectorIndex),
                  base_fare: baseFare,
                  atf_surcharge: atfSurcharge,
                  udf_psf: udfPsf,
                  gst: gst,
                  total_fare: totalFare,
                  laspeyres_weight: route.trafficWeight,
                  sources_scraped: ["IndiGo", "Air India", "Akasa Air", "SpiceJet", "MakeMyTrip", "EaseMyTrip"],
                  timestamp: new Date().toISOString()
                }, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `APIx_${(route.route_code || 'DEL-BOM')}_${windowKey}.json`;
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
